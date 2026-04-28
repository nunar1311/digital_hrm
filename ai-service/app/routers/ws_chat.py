import asyncio
import json
import logging
import uuid
from typing import Optional, Dict, Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.requests import Request
from pydantic import BaseModel

from app.routers.chat import SmartChatRequest, ChatMessage, get_prisma_schema
from app.services.action_executor import (
    HRCommandExecutor,
    get_tools_prompt,
    parse_tool_calls_from_response,
    strip_action_blocks,
    is_tool_dangerous,
)
from app.services.provider_router import get_provider_router
from app.prompts.company_context import get_company_context
from app.services.db_queries import HRDataQueries, EmployeePersonalQueries
from app.routers.data_analyst import (
    analyze_intent,
    format_chart_data,
    _auto_extract_chart_data,
    extract_metrics_from_data,
)
from app.middleware.rbac import extract_user_context
from app.services.redis_service import track_active_session
from app.services.queue_manager import get_ai_queue, QueueTimeoutError

logger = logging.getLogger(__name__)
router = APIRouter()

# Tool label mapping for Vietnamese UX
TOOL_LABELS = {
    "query_database": "Truy vấn cơ sở dữ liệu",
    "query_employee_data": "Tra cứu dữ liệu nhân viên",
    "get_leave_balance": "Kiểm tra số dư phép",
    "get_attendance_report": "Lấy báo cáo chấm công",
    "get_team_overview": "Xem tổng quan team",
    "get_risk_assessment": "Đánh giá rủi ro",
    "get_copilot_insight": "Phân tích insight",
    "analyze_approval_request": "Phân tích yêu cầu duyệt",
    "create_leave_request": "Tạo đơn nghỉ phép",
    "approve_leave_request": "Duyệt đơn nghỉ phép",
    "reject_leave_request": "Từ chối đơn nghỉ phép",
    "send_notification": "Gửi thông báo",
}


def _build_chart_title(intent: str, chart_type: str, question: str) -> str:
    """Build a chart title from question context."""
    q = question.lower()
    if intent == "COMPARISON":
        if "lương" in q or "luong" in q:
            return "So sánh lương"
        if "nhân viên" in q or "nhan vien" in q:
            return "So sánh nhân viên"
        return "So sánh"
    if intent == "DISTRIBUTION":
        if "tỷ lệ" in q or "ty le" in q:
            return "Tỷ lệ"
        return "Phân bổ"
    if intent == "TREND":
        return "Xu hướng"
    if intent == "CORRELATION":
        return "Tương quan"
    return "Biểu đồ"


def _build_x_axis_label(intent: str, chart_type: str) -> str:
    if chart_type == "bar":
        return "Danh mục"
    if chart_type in ("line", "area", "areachart"):
        return "Thời gian"
    if chart_type == "scatter":
        return "Giá trị X"
    return "Giá trị"


def _build_y_axis_label(intent: str, chart_type: str) -> str:
    if chart_type == "bar":
        return "Giá trị"
    if chart_type in ("line", "area", "areachart"):
        return "Giá trị"
    if chart_type == "scatter":
        return "Giá trị Y"
    return "Số lượng"


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

manager = ConnectionManager()


def create_mock_request(user_id: Optional[str], user_role: Optional[str]) -> Request:
    """Create a mock Request object with headers for RBAC extraction"""
    headers = []
    if user_id:
        headers.append((b"x-user-id", user_id.encode("utf-8")))
    if user_role:
        headers.append((b"x-user-role", user_role.encode("utf-8")))
    
    scope = {
        "type": "http",
        "headers": headers,
    }
    return Request(scope=scope)


async def _send_thinking(ws: WebSocket, step: str, step_id: str = None):
    """Send a thinking step to the client"""
    await ws.send_json({
        "type": "thinking",
        "step": step,
        "step_id": step_id or f"think_{uuid.uuid4().hex[:8]}",
    })

async def _send_tool_start(ws: WebSocket, tool: str, step_id: str):
    """Send tool start event"""
    await ws.send_json({
        "type": "tool_start",
        "tool": tool,
        "description": TOOL_LABELS.get(tool, tool),
        "step_id": step_id,
    })

async def _send_tool_result(ws: WebSocket, step_id: str, status: str, detail: str = None):
    """Send tool result event"""
    await ws.send_json({
        "type": "tool_result",
        "step_id": step_id,
        "status": status,
        "detail": detail,
    })


@router.websocket("/chat")
async def websocket_chat(websocket: WebSocket):
    await manager.connect(websocket)
    user_id = None
    user_role = None
    current_task: Optional[asyncio.Task] = None

    try:
        # Require authentication as first message
        try:
            auth_msg = await asyncio.wait_for(websocket.receive_text(), timeout=10.0)
            auth_data = json.loads(auth_msg)
            
            if auth_data.get("type") != "auth":
                await websocket.send_json({"type": "error", "error": "Cần gửi thông tin xác thực trước."})
                manager.disconnect(websocket)
                await websocket.close()
                return

            user_id = auth_data.get("userId")
            user_role = auth_data.get("userRole", "EMPLOYEE")
            
            await websocket.send_json({"type": "ready"})
        except asyncio.TimeoutError:
            manager.disconnect(websocket)
            await websocket.close()
            return
        except WebSocketDisconnect:
            logger.info("Client disconnected during auth handshake")
            manager.disconnect(websocket)
            return
        except Exception:
            try:
                await websocket.send_json({"type": "error", "error": "Không xác thực được. Thử lại sau nhé."})
                await websocket.close()
            except Exception:
                pass
            manager.disconnect(websocket)
            return

        # Listen for chat messages

        while True:
            msg_text = await websocket.receive_text()
            try:
                data = json.loads(msg_text)
                
                if data.get("type") == "stop":
                    # Cancel the current processing task
                    if current_task and not current_task.done():
                        current_task.cancel()
                        try:
                            await current_task
                        except asyncio.CancelledError:
                            pass
                        current_task = None
                    # Notify client that stop was acknowledged
                    try:
                        await websocket.send_json({"type": "stopped"})
                    except Exception:
                        pass
                    continue

                if data.get("type") == "chat":
                    # Cancel any previous in-flight task
                    if current_task and not current_task.done():
                        current_task.cancel()
                        try:
                            await current_task
                        except asyncio.CancelledError:
                            pass

                    # Run processing in a cancellable task
                    current_task = asyncio.create_task(
                        _process_chat(websocket, data, user_id, user_role)
                    )

                elif data.get("type") == "confirm_action":
                    # User confirms a dangerous tool execution
                    tool = data.get("tool", "")
                    params = data.get("params", {})
                    action_id = data.get("action_id", "")

                    executor = HRCommandExecutor(
                        user_id=user_id or "",
                        user_role=user_role or "EMPLOYEE",
                    )
                    result = await executor.execute(tool, params, confirmed=True)

                    await websocket.send_json({
                        "type": "action_result",
                        "action_id": action_id,
                        "tool": tool,
                        "success": result.status.value in ("success", "pending_confirmation"),
                        "status": result.status.value,
                        "display_message": result.display_message,
                        "error": result.error,
                    })
                    
            except json.JSONDecodeError:
                await websocket.send_json({"type": "error", "error": "Định dạng không hợp lệ. Gửi lại nhé."})
            
    except WebSocketDisconnect:
        if current_task and not current_task.done():
            current_task.cancel()
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket Error: {e}", exc_info=True)
        if current_task and not current_task.done():
            current_task.cancel()
        manager.disconnect(websocket)
        try:
            await websocket.close()
        except:
            pass


async def _process_chat(websocket: WebSocket, data: dict, user_id: Optional[str], user_role: Optional[str]):
    """Process a chat message in a cancellable task."""
    try:
        message = data.get("message", "")
        history = data.get("history", [])
        session_id = data.get("sessionId", "ws-default")
        language = data.get("language", "vi")

        # === AGENTIC FLOW with granular progress messages ===
        
        # Step 1: Thinking - analyzing question
        await _send_thinking(websocket, "Đang phân tích câu hỏi...")

        # Extract user context
        mock_req = create_mock_request(user_id, user_role)
        user_ctx = extract_user_context(mock_req)
        request_id = f"ws_{user_ctx.user_id or 'anon'}_{uuid.uuid4().hex[:6]}"

        if user_ctx.user_id:
            await track_active_session(user_ctx.user_id, session_id)

        # Step 2: Query database
        data_sources = []
        db_context = ""
        hr_data_for_charts: Dict[str, Any] = {}

        try:
            await _send_thinking(websocket, "Đang truy vấn dữ liệu HR...")

            if user_ctx.has_full_access:
                relevant_data = await HRDataQueries.search_data_for_query(message)
                data_label = "DỮ LIỆU HR TOÀN TỔ CHỨC"
            elif user_ctx.is_identified:
                relevant_data = await EmployeePersonalQueries.search_personal_data_for_query(
                    user_ctx.user_id, message
                )
                data_label = "DỮ LIỆU CÁ NHÂN CỦA NGƯỜI DÙNG NÀY (đã truy vấn trực tiếp từ database — TRẢ LỜI NGAY, KHÔNG cần gọi thêm tool)"
            else:
                relevant_data = {}
                data_label = "DỮ LIỆU HR"

            if relevant_data:
                for key in relevant_data:
                    if relevant_data[key]:
                        data_sources.append(key)
                db_context = f"\n{data_label}:\n==========================================\n{relevant_data}\n==========================================\n"
                hr_data_for_charts = relevant_data
        except Exception as db_error:
            logger.warning(f"Could not fetch DB data: {db_error}")
            db_context = "\n(Không thể truy cập database - trả lời dựa trên kiến thức chung)\n"

        # Step 3: Build prompt and call AI
        await _send_thinking(websocket, "Đang suy luận và tạo phản hồi...")
        
        language_instruction = "Trả lời bằng tiếng Việt." if language == "vi" else "Respond in English."
        
        if user_ctx.has_full_access:
            role_context = """Bạn đang hỗ trợ một quản trị viên/ban lãnh đạo.
Có thể cung cấp dữ liệu tổng quan toàn tổ chức, thống kê, so sánh phòng ban."""
        else:
            role_context = """Bạn đang hỗ trợ một nhân viên.
CHỈ trả lời về thông tin CÁ NHÂN của người dùng này.
KHÔNG đưa ra thông tin của nhân viên khác, phòng ban khác, hay số liệu tổng quan tổ chức.
Nếu người dùng hỏi về dữ liệu tổng thể (ví dụ: lương toàn công ty, số nhân viên...),
hãy lịch sự giải thích rằng bạn chỉ có thể cung cấp thông tin cá nhân của họ.

QUAN TRỌNG - DỮ LIỆU CÁ NHÂN TRONG SNAPSHOT:
Dữ liệu trong phần "DỮ LIỆU THỰC TỪ HỆ THỐNG HR" bên dưới đã là dữ liệu CÁ NHÂN TRỰC TIẾP của chính người dùng này, được truy vấn sẵn từ database.
- Nếu snapshot có trường "leave" hoặc "leave_balances" → ĐÂY CHÍNH LÀ số dư nghỉ phép của họ. TRẢ LỜI NGAY, KHÔNG gọi get_leave_balance.
- Nếu snapshot có trường "attendance" → TRẢ LỜI NGAY, KHÔNG gọi get_attendance_report.
- Nếu snapshot có trường "salary" → TRẢ LỜI NGAY, KHÔNG gọi tool nào.
- Nếu snapshot có trường "profile" → TRẢ LỜI NGAY về thông tin cá nhân.
CHỈ gọi tool khi câu hỏi yêu cầu HÀNH ĐỘNG (tạo đơn, xin nghỉ...) hoặc khi snapshot THỰC SỰ không có dữ liệu liên quan."""

        tools_prompt = get_tools_prompt()
        prisma_schema = get_prisma_schema()
        company_ctx = await get_company_context()
        dp_context = f"\n**THÔNG TIN CÔNG TY:**\n{company_ctx}\n" if company_ctx else ""

        system_prompt = f"""Bạn là một đồng nghiệp thân thiện trong công ty, có quyền truy cập dữ liệu nhân sự.

{role_context}

CÁCH TRẢ LỜI:
- Nói chuyện tự nhiên như đang chat với đồng nghiệp, không phải chatbot
- Trả lời ngắn gọn, đúng trọng tâm, không dài dòng
- Dùng số liệu cụ thể khi có, format rõ ràng (VD: lương dùng VNĐ, phần trăm dùng %)
- Nếu cần hành động (tạo đơn, duyệt, thông báo...), thực hiện luôn qua tool
- Không có dữ liệu thì nói thẳng, gợi ý cách lấy thêm nếu có
- Không cần phải đưa ra khuyến nghị nếu câu hỏi chỉ cần trả lời đơn giản
- LUÔN LUÔN thêm mục "Follow ups:" ở cuối câu trả lời, kèm theo 2-3 câu gợi ý tiếp theo dạng danh sách. Các câu này PHẢI VIẾT DƯỚI GÓC NHÌN CỦA NGƯỜI DÙNG (dùng đại từ "tôi", "cho tôi") để họ bấm vào hỏi tiếp (Ví dụ: "Tôi muốn nghỉ 1 ngày", "Kiểm tra giúp tôi số phép còn lại", "Lọc theo phòng ban giúp tôi").

QUY TẮC HIỂN THỊ DỮ LIỆU - ĐỌC KỸ:
- CHỈ DÙNG BẢNG MARKDOWN khi liệt kê danh sách CÓ TỪ 2 BẢN GHI TRỞ LÊN (vd: danh sách nhân viên, đơn nghỉ, ứng viên):
  | Cột 1 | Cột 2 | Cột 3 |
  |-------|-------|-------|
  | ...   | ...   | ...   |
- NẾU CHỈ CÓ 1 BẢN GHI (vd: chi tiết của 1 nhân viên cụ thể) → Dùng text thường với bullet points, TUYỆT ĐỐI KHÔNG dùng bảng.
- KHI TRẢ LỜI SỐ LIỆU ĐƠN GIẢN (1-2 con số, tổng quan ngắn) → dùng bullet points hoặc text thường.
- KHI SO SÁNH / PHÂN TÍCH NHIỀU CHỈ SỐ → dùng bảng để dễ đọc.
- KHÔNG BAO GIỜ hiển thị ID, UUID, hoặc bất kỳ trường kỹ thuật nào từ database (id, userId...). Chỉ hiển thị thông tin có ý nghĩa.

QUY TẮC NGHIÊM NGẶT - KHÔNG ĐƯỢC VI PHẠM:
- Khi cần hỏi thêm thông tin từ user, HỎI BẰNG LỜI CỦA MÌNH. Ví dụ:
  ✗ SAI: "[Loại nghỉ: ANNUAL/SICK...]"
  ✓ ĐÚNG: "Bạn muốn nghỉ loại nào: nghỉ phép thường niên hay nghỉ ốm?"
  ✗ SAI: "[Ngày bắt đầu: YYYY-MM-DD]"
  ✓ ĐÚNG: "Bạn muốn bắt đầu nghỉ từ ngày nào?"
- KHÔNG BAO GIỜ hiển thị template/placeholder như [key: value], [[key: value]], [Loại: ...], [Ngày: ...]
- Khi hỏi thêm thông tin, chỉ hỏi ĐÚNG những thứ còn thiếu, không hỏi lại những thứ đã có
- {language_instruction}

TRUY VẤN DATABASE THÔNG MINH - ĐỌC KỸ:
- Dữ liệu HR snapshot ở trên là dữ liệu THỰC từ database, đã được truy vấn sẵn. Hãy DÙNG NGAY nếu đủ thông tin.
- ƯU TIÊN SỐ 1: Nếu snapshot đã có dữ liệu liên quan → TRẢ LỜI NGAY từ snapshot. KHÔNG gọi thêm tool.
- Chỉ gọi tool khi câu hỏi cần HÀNH ĐỘNG (tạo đơn, duyệt...) hoặc snapshot THỰC SỰ không có dữ liệu liên quan.
- NẾU snapshot chỉ có COUNT/tổng hợp mà user cần danh sách chi tiết → GỌI query_database.
- Khi gọi query_database:
  + LUÔN dùng JOIN để lấy tên phòng ban, chức vụ thay vì ID
  + LUÔN thêm LIMIT (tối đa 50)
  + KHÔNG BAO GIỜ SELECT các cột ID (id, userId, departmentId, positionId) — chỉ SELECT thông tin có nghĩa
  + Ví dụ đúng: SELECT u.name, u."hireDate", d.name as department_name, p.name as position_name FROM users u LEFT JOIN departments d ON u."departmentId" = d.id LEFT JOIN positions p ON u."positionId" = p.id WHERE ... LIMIT 20

DƯỚI ĐÂY LÀ KIẾN TRÚC DATABASE CỦA HỆ THỐNG (schema.prisma). HÃY DÙNG NÓ ĐỂ TẠO CÂU LỆNH SQL CHUẨN XÁC NẾU CẦN:
```prisma
{prisma_schema}
```

{tools_prompt}

{dp_context}

{db_context}"""

        messages_for_ai = [{"role": "system", "content": system_prompt}]
        
        if history:
            for msg in history[-10:]:
                if isinstance(msg, dict):
                    messages_for_ai.append(msg)
                else:
                    messages_for_ai.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})
        
        messages_for_ai.append({"role": "user", "content": message})

        # Call AI provider
        provider_router = get_provider_router()
        ai_queue = get_ai_queue()

        MAX_TOOL_RETRIES = 3  # Per-tool retry limit

        try:
            result = await ai_queue.execute(
                provider_router.chat(
                    messages=messages_for_ai,
                    temperature=0.4,
                ),
                request_id=request_id,
            )
        except QueueTimeoutError:
            await websocket.send_json({
                "type": "error",
                "error": "Hệ thống đang bận. Thử lại trong giây lát nhé."
            })
            return

        if not result.get("success"):
            await websocket.send_json({
                "type": "error",
                "error": result.get("error", "Có lỗi xảy ra khi xử lý AI request.")
            })
            return

        # Step 4: Parse tool calls and execute with per-tool retry
        ai_content = result.get("content", "")
        reasoning = result.get("reasoning_content", "")
        
        logger.info(f"[DEBUG] ai_content length={len(ai_content)}, reasoning length={len(reasoning)}")
        logger.info(f"[DEBUG] ai_content preview: {ai_content[:200] if ai_content else '(empty)'}")
        logger.info(f"[DEBUG] reasoning preview: {reasoning[:200] if reasoning else '(empty)'}")
        
        combined_content = ai_content + "\n" + reasoning if reasoning else ai_content
        tool_calls = parse_tool_calls_from_response(combined_content)
        
        logger.info(f"[DEBUG] tool_calls found: {len(tool_calls)}")
        
        if not ai_content and reasoning and not tool_calls:
            ai_content = reasoning  # Use reasoning directly as the response
            
        actions = []
        needs_followup = False
        any_tool_permanently_failed = False
        
        READ_ONLY_TOOLS = {
            "query_database", "query_employee_data", "get_leave_balance",
            "get_attendance_report", "get_team_overview", "get_risk_assessment",
            "get_copilot_insight", "analyze_approval_request",
        }

        if tool_calls:
            executor = HRCommandExecutor(
                user_id=user_ctx.user_id or "",
                user_role=str(user_ctx.user_role.value) if user_ctx.user_role else "EMPLOYEE",
            )

            # Process each tool call — retry individually on failure
            for tc in tool_calls:
                tool_name = tc["tool"]
                step_id = f"tool_{tool_name}_{uuid.uuid4().hex[:6]}"
                tool_params = tc.get("params", {})
                
                # Send tool_start
                await _send_tool_start(websocket, tool_name, step_id)

                # Per-tool retry loop
                tool_result = None
                retry_messages = list(messages_for_ai)  # Copy for tool-specific retries
                
                for tool_attempt in range(MAX_TOOL_RETRIES):
                    if tool_attempt > 0:
                        # On retry: ask AI for a corrected tool call
                        await _send_thinking(websocket, f"Đang tự động thử lại... (lần {tool_attempt+1}/{MAX_TOOL_RETRIES})")
                        
                        try:
                            retry_result = await ai_queue.execute(
                                provider_router.chat(
                                    messages=retry_messages,
                                    temperature=0.3,
                                ),
                                request_id=f"{request_id}_retry{tool_attempt}",
                            )
                        except QueueTimeoutError:
                            break
                        
                        if not retry_result.get("success"):
                            break
                        
                        # Parse the corrected tool call from AI's retry response
                        retry_content = retry_result.get("content", "")
                        retry_tool_calls = parse_tool_calls_from_response(retry_content)
                        
                        if not retry_tool_calls:
                            # AI couldn't produce a new tool call — give up on this tool
                            break
                        
                        # Use the first matching corrected tool call
                        corrected_tc = retry_tool_calls[0]
                        tool_params = corrected_tc.get("params", {})
                    
                    # Execute the tool
                    tool_result = await executor.execute(tool_name, tool_params, confirmed=True)
                    
                    if tool_result.status.value != "error":
                        # Success — break retry loop
                        break
                    
                    if tool_result.error and "Quyền truy cập bị từ chối" in tool_result.error:
                        # Permission denied — retrying won't help
                        break
                    
                    # Tool failed — feed internal error to AI for self-correction
                    internal_err = (tool_result.data or {}).get("_internal_error", tool_result.error)
                    retry_messages.append({
                        "role": "assistant",
                        "content": f"```action\n{json.dumps({'tool': tool_name, 'params': tool_params}, ensure_ascii=False)}\n```"
                    })
                    retry_messages.append({
                        "role": "user",
                        "content": (
                            f"Công cụ {tool_name} gặp lỗi:\n{internal_err}\n"
                            f"HÃY SỬA LẠI CÂU LỆNH VÀ GỌI LẠI TOOL. CHỈ TRẢ VỀ KHỐI ```action``` MỚI."
                        )
                    })

                # Send tool_result to UI (status only, no SQL details)
                if tool_result:
                    # Determine user-facing status
                    final_status = tool_result.status.value
                    
                    await _send_tool_result(
                        websocket, 
                        step_id, 
                        final_status,
                        tool_result.display_message[:100] if tool_result.display_message and final_status != "error" else None
                    )

                    # Build user-facing description (never show SQL)
                    desc = tc.get("description", tool_result.display_message)
                    if tool_name == "query_database":
                        if final_status == "error":
                            # Generic business-level error only
                            desc = tool_result.error or "Không thể thực hiện yêu cầu lúc này."
                        else:
                            # Check if it was a read or write query
                            is_write = "status" in (tool_result.data or {})
                            if is_write:
                                desc = "Đã kiểm tra và cập nhật dữ liệu thành công."
                            else:
                                count = (tool_result.data or {}).get("count", 0)
                                desc = f"Truy xuất thành công {count} thông tin dữ liệu."

                    actions.append({
                        "id": f"{tc['tool']}_{len(actions)}",
                        "tool": tool_name,
                        "description": desc,
                        "status": final_status,
                        "display_message": tool_result.display_message if tool_name != "query_database" else None,
                        "data": {k: v for k, v in (tool_result.data or {}).items() if not k.startswith("_internal")} if tool_result.data else None,
                        "confirmation_required": tool_result.confirmation_required,
                        "confirmation_data": tool_result.confirmation_data,
                        "error": tool_result.error if final_status == "error" else None,
                        "auto_executed": True,
                    })

                    if final_status == "error":
                        any_tool_permanently_failed = True
                    elif (
                        tool_name in READ_ONLY_TOOLS
                        and final_status == "success"
                        and tool_result.data
                    ):
                        needs_followup = True

            ai_content = strip_action_blocks(ai_content)

        # Step 4.5: Follow-up AI call — format tool results into user-friendly response
        if needs_followup and actions:
            await _send_thinking(websocket, "Đang phân tích kết quả truy vấn...")

            # Collect successful tool results
            tool_results_text = []
            for act in actions:
                if act["status"] == "success" and act.get("data"):
                    data = act["data"]
                    if "results" in data:
                        # query_database results — serialize for AI
                        results = data["results"]
                        if results:
                            tool_results_text.append(
                                f"Kết quả từ {act['tool']} ({len(results)} bản ghi):\n"
                                f"{json.dumps(results[:30], ensure_ascii=False, default=str)}"
                            )
                    elif data:
                        tool_results_text.append(
                            f"Kết quả từ {act['tool']}:\n"
                            f"{json.dumps(data, ensure_ascii=False, default=str)[:2000]}"
                        )

            if tool_results_text:
                followup_prompt = f"""Dựa trên kết quả truy vấn database bên dưới, hãy trả lời câu hỏi ban đầu của người dùng.

CÂU HỎI BAN ĐẦU: {message}

KẾT QUẢ TRUY VẤN:
{chr(10).join(tool_results_text)}

QUY TẮC TRẢ LỜI:
- Nếu kết quả có NHIỀU BẢN GHI (từ 2 trở lên) → BẮT BUỘC dùng bảng Markdown (| Cột 1 | Cột 2 | ...)
- Nếu kết quả chỉ có 1 BẢN GHI hoặc thông tin đơn giản → Dùng text thường, in đậm, bullet points (TUYỆT ĐỐI KHÔNG dùng bảng).
- KHÔNG BAO GIỜ hiển thị ID, UUID, hoặc trường kỹ thuật database.
- Chỉ hiển thị: tên người, ngày tháng, phòng ban, chức vụ, trạng thái, số liệu cần thiết.
- Nếu không có dữ liệu, trả lời lịch sự là không tìm thấy.
- Dùng định dạng ngày: DD/MM/YYYY cho tiếng Việt.
- Trả lời ngắn gọn, thân thiện.
- Thêm mục "Follow ups:" ở cuối với 2-3 gợi ý."""

                try:
                    followup_result = await ai_queue.execute(
                        provider_router.chat(
                            messages=[
                                {"role": "system", "content": "Bạn là trợ lý HR thân thiện. Trả lời bằng tiếng Việt. Chỉ dùng bảng Markdown cho danh sách từ 2 mục trở lên, không dùng bảng cho 1 thông tin đơn lẻ. KHÔNG hiển thị ID database."},
                                {"role": "user", "content": followup_prompt},
                            ],
                            temperature=0.3,
                        ),
                        request_id=f"{request_id}_followup",
                    )
                    if followup_result.get("success"):
                        fu_content = followup_result.get("content", "")
                        fu_reasoning = followup_result.get("reasoning_content", "")
                        ai_content = fu_content if fu_content else fu_reasoning
                except Exception as fu_err:
                    logger.warning(f"Follow-up AI call failed: {fu_err}")
                    # Fall through to use original ai_content

        # Step 4.5: Data Analyst — analyze question intent and prepare chart data
        data_analyst_response: Optional[Dict[str, Any]] = None
        try:
            intent_result = analyze_intent(message)
            intent = intent_result.get("intent", "GENERAL")
            chart_type = intent_result.get("chart_type", "none")
            confidence = intent_result.get("confidence", 0.0)

            if chart_type and chart_type != "none" and hr_data_for_charts:
                chart_data = _auto_extract_chart_data(hr_data_for_charts, chart_type, message)

                if chart_data and len(chart_data) > 0:
                    data_analyst_response = {
                        "intent": intent,
                        "chartType": chart_type,
                        "confidence": confidence,
                        "chartData": chart_data,
                        "chartTitle": intent_result.get("chart_title") or _build_chart_title(intent, chart_type, message),
                        "xAxis": _build_x_axis_label(intent, chart_type),
                        "yAxis": _build_y_axis_label(intent, chart_type),
                        "metrics": extract_metrics_from_data(hr_data_for_charts),
                        "insights": [],
                        "dataSources": data_sources,
                    }
                    logger.info(f"Data analyst: intent={intent}, chart_type={chart_type}, data_points={len(chart_data)}")
        except Exception as da_err:
            logger.warning(f"Data analyst analysis failed: {da_err}")

        # Step 5: Stream the response content
        if any_tool_permanently_failed and actions:
            # Some tools failed — ask AI for a user-friendly summary
            success_results = [a for a in actions if a["status"] == "success"]
            failed_results = [a for a in actions if a["status"] == "error"]
            
            summary_parts = []
            if success_results:
                summary_parts.append(f"Đã hoàn thành {len(success_results)} tác vụ thành công.")
            if failed_results:
                for fr in failed_results:
                    summary_parts.append(f"Lỗi: {fr.get('error', 'Không thể thực hiện tác vụ.')}")
            
            ai_content = "\n".join(summary_parts) if summary_parts else ai_content

        # Strip action blocks so the user doesn't see raw XML from reasoning
        ai_content = strip_action_blocks(ai_content)

        # Step 5: Stream the response content
        if ai_content:
            # Stream by word boundaries for natural feeling
            # Tăng chunk size lên 40 ký tự và giảm delay xuống 4ms để stream nhanh hơn
            words = ai_content.split(' ')
            buffer = ""
            for i, word in enumerate(words):
                buffer += word
                if i < len(words) - 1:
                    buffer += " "
                if len(buffer) >= 40 or i == len(words) - 1:
                    await websocket.send_json({"type": "token", "content": buffer})
                    buffer = ""
                    await asyncio.sleep(0.004)

        # Step 6: Send done
        await websocket.send_json({
            "type": "done",
            "actions": actions if actions else None,
            "data_sources": data_sources if data_sources else None,
            "needs_followup": needs_followup,
            "data_analyst_response": data_analyst_response,
        })

    except asyncio.CancelledError:
        # Task was cancelled by user pressing Stop — clean up silently
        logger.info("Chat processing cancelled by user")
        try:
            await websocket.send_json({"type": "done", "actions": None, "cancelled": True})
        except Exception:
            pass
        raise  # Re-raise so the task properly ends
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected during chat processing")
    except Exception as e:
        logger.error(f"Error in chat processing: {e}", exc_info=True)
        try:
            await websocket.send_json({"type": "error", "error": "Đã xảy ra lỗi khi xử lý. Vui lòng thử lại."})
        except Exception:
            pass

