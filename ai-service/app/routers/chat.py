"""
Chat Router - HR Chatbot endpoint
Bao gom Smart Chat ket hop du lieu tu database
Co phan quyen theo role: SUPER_ADMIN/admin xem toan bo, EMPLOYEE chi xem ca nhan

Production features:
- Redis caching cho AI responses va DB queries
- Semaphore-based queue gioi han concurrent AI calls
- Request deduplication
"""

import logging
import uuid
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

from fastapi import APIRouter, HTTPException, Request

from app.services.provider_router import get_provider_router
from app.prompts.registry import get_prompt_registry
from app.prompts.company_context import get_company_context
from app.utils.response_formatter import ResponseFormatter
from app.services.db_queries import HRDataQueries, EmployeePersonalQueries
from app.middleware.rbac import extract_user_context
from app.services.action_executor import (
    HRCommandExecutor,
    get_tools_prompt,
    parse_tool_calls_from_response,
    strip_action_blocks,
    is_tool_dangerous,
)
from app.services.redis_service import (
    get_ai_response_cache,
    set_ai_response_cache,
    check_dedup,
    set_dedup,
    track_active_session,
    is_redis_available,
)
from app.services.queue_manager import get_ai_queue, QueueTimeoutError

import os
import functools

logger = logging.getLogger(__name__)

@functools.lru_cache(maxsize=1)
def get_prisma_schema() -> str:
    try:
        # Path resolution from router file back to root
        current_dir = os.path.dirname(os.path.abspath(__file__))
        ai_service_dir = os.path.dirname(os.path.dirname(current_dir))
        root_dir = os.path.dirname(ai_service_dir)
        schema_path = os.path.join(root_dir, "prisma", "schema.prisma")
        
        if os.path.exists(schema_path):
            with open(schema_path, "r", encoding="utf-8") as f:
                return f.read()
        return "Schema file not found."
    except Exception as e:
        logger.error(f"Failed to read schema.prisma: {e}")
        return ""
router = APIRouter()


class ChatMessage(BaseModel):
    """Chat message model"""
    role: str = Field(..., description="Message role: system, user, assistant")
    content: str = Field(..., description="Message content")


class ChatRequest(BaseModel):
    """Chat request model"""
    messages: List[ChatMessage] = Field(..., description="List of chat messages")
    provider: Optional[str] = Field(None, description="AI provider to use")
    model: Optional[str] = Field(None, description="Model to use")
    temperature: float = Field(0.7, ge=0, le=2, description="Sampling temperature")
    session_id: Optional[str] = Field(None, description="Session ID for context")


class ChatResponse(BaseModel):
    """Chat response model"""
    success: bool
    content: Optional[str] = None
    session_id: Optional[str] = None
    provider: Optional[str] = None
    model: Optional[str] = None
    usage: Optional[Dict] = None
    error: Optional[str] = None


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    HR Chatbot endpoint - Chat with AI assistant
    All AI calls go through the queue for concurrency control.
    """
    try:
        # Convert messages to dict format
        messages = [msg.model_dump() for msg in request.messages]

        # Add system prompt if not present
        has_system = any(m["role"] == "system" for m in messages)
        if not has_system:
            system_prompt = """Bạn là một đồng nghiệp thân thiện trong công ty, có quyền truy cập dữ liệu nhân sự.

CÁCH TRẢ LỜI:
- Nói chuyện tự nhiên như đang chat với đồng nghiệp, không phải chatbot
- Trả lời ngắn gọn, đúng trọng tâm, không dài dòng
- Dùng số liệu cụ thể khi có, format rõ ràng (VD: lương dùng VNĐ, phần trăm dùng %)
- KHÔNG dùng bảng Markdown, thay bằng danh sách bullet points
- Không có dữ liệu thì nói thẳng, gợi ý cách lấy thêm nếu có
- LUÔN LUÔN thêm mục "Follow ups:" ở cuối câu trả lời, kèm theo 2-3 câu gợi ý tiếp theo dạng danh sách. Các câu này PHẢI VIẾT DƯỚI GÓC NHÌN CỦA NGƯỜI DÙNG (dùng đại từ "tôi", "cho tôi") để họ bấm vào hỏi tiếp (Ví dụ: "Tôi muốn nghỉ 1 ngày", "Kiểm tra giúp tôi số phép còn lại", "Lọc theo phòng ban giúp tôi").
- Khi cần hỏi thêm thông tin: HỎI BẰNG LỜI CỦA MÌNH, KHÔNG BAO GIỜ hiển thị template như [key: value], [Loại: ...], [Ngày: ...]"""
            messages.insert(0, {"role": "system", "content": system_prompt})

        # Route to AI provider through queue
        provider_router = get_provider_router()
        ai_queue = get_ai_queue()

        try:
            result = await ai_queue.execute(
                provider_router.chat(
                    messages=messages,
                    provider=request.provider,
                    model=request.model,
                    temperature=request.temperature,
                ),
                request_id=f"chat_{request.session_id or 'anon'}",
            )
        except QueueTimeoutError:
            return ChatResponse(
                success=False,
                error="Hệ thống đang bận. Thử lại trong giây lát nhé.",
            )

        if not result.get("success"):
            return ChatResponse(
                success=False,
                error=result.get("error", "Có lỗi xảy ra. Thử lại sau nhé."),
                provider=result.get("provider"),
            )

        return ChatResponse(
            success=True,
            content=result.get("content"),
            session_id=request.session_id,
            provider=result.get("provider"),
            model=result.get("model"),
            usage=result.get("usage"),
        )

    except Exception:
        logger.error(f"Chat error", exc_info=True)
        return ChatResponse(
            success=False,
            error="Có lỗi xảy ra. Thử lại sau nhé.",
        )


# =====================
# SMART CHAT - Chat kết hợp dữ liệu thực từ Database
# =====================

class SmartChatRequest(BaseModel):
    """Smart chat request - automatically enriches with DB data"""
    message: str = Field(..., description="User message/question")
    history: Optional[List[ChatMessage]] = Field(None, description="Previous messages for context")
    provider: Optional[str] = Field(None, description="AI provider to use")
    model: Optional[str] = Field(None, description="Model to use")
    language: str = Field("vi", description="Response language (vi/en)")
    session_id: Optional[str] = Field(None, description="Session ID for tracking")


class SmartChatResponse(BaseModel):
    """Smart chat response with optional action proposals"""
    success: bool
    content: Optional[str] = None
    data_sources: Optional[List[str]] = None
    actions: Optional[List[Dict[str, Any]]] = None
    needs_followup: bool = False
    provider: Optional[str] = None
    model: Optional[str] = None
    usage: Optional[Dict] = None
    error: Optional[str] = None


@router.post("/smart-chat", response_model=SmartChatResponse)
async def smart_chat(request: SmartChatRequest, raw_request: Request):
    """
    Smart Chat - AI Chatbot thông minh kết hợp dữ liệu thực từ Database

    Production features:
    - Redis caching cho AI responses (10 phút)
    - Request deduplication (5 giây)
    - Queue-based concurrency control (max 20 concurrent)
    - Phân quyền theo role
    """
    try:
        # Đọc user context từ headers (được forward bởi Next.js)
        user_ctx = extract_user_context(raw_request)
        request_id = f"smart_{user_ctx.user_id or 'anon'}_{uuid.uuid4().hex[:6]}"

        # Track active session
        if user_ctx.user_id:
            await track_active_session(user_ctx.user_id, request.session_id or "default")

        # Step 0: Request deduplication (cùng user, cùng message trong 5s → skip)
        if user_ctx.user_id:
            dedup_result = await check_dedup(user_ctx.user_id, request.message)
            if dedup_result:
                logger.info(f"[{request_id}] Dedup hit - same message within 5s")
                # Try to return cached response
                cached = await get_ai_response_cache(
                    request.message,
                    str(user_ctx.user_role.value) if user_ctx.user_role else "EMPLOYEE",
                    user_ctx.has_full_access,
                )
                if cached:
                    return SmartChatResponse(**cached)

        # Mark this request for dedup
        if user_ctx.user_id:
            await set_dedup(user_ctx.user_id, request.message, request_id)

        # Step 0.5: Check AI response cache (tạm disable - mỗi câu hỏi cần fresh response)
        # user_role_str = str(user_ctx.user_role.value) if user_ctx.user_role else "EMPLOYEE"
        # cached_response = await get_ai_response_cache(
        #     request.message,
        #     user_role_str,
        #     user_ctx.has_full_access,
        # )
        # if cached_response:
        #     logger.info(f"[{request_id}] AI response cache HIT")
        #     return SmartChatResponse(**cached_response)

        # Step 1: Query data dựa theo role
        data_sources = []
        db_context = ""
        access_note = ""

        try:
            if user_ctx.has_full_access:
                # ADMIN ROLES: Lấy toàn bộ dữ liệu HR
                relevant_data = await HRDataQueries.search_data_for_query(request.message)
                access_note = "Bạn có quyền xem toàn bộ dữ liệu tổ chức."
                logger.info(f"Full HR data access for role={user_ctx.user_role}")
            elif user_ctx.is_identified:
                # PERSONAL ROLES: Chỉ lấy dữ liệu cá nhân
                relevant_data = await EmployeePersonalQueries.search_personal_data_for_query(
                    user_ctx.user_id, request.message
                )
                access_note = "Dữ liệu được cung cấp chỉ bao gồm thông tin CÁ NHÂN của bạn."
                logger.info(f"Personal data access for user={user_ctx.user_id}, role={user_ctx.user_role}")
            else:
                # Không xác định được user → giới hạn không có data DB
                relevant_data = {}
                access_note = "Không thể xác định danh tính người dùng."
                logger.warning("Smart chat request without user context")

            if relevant_data:
                for key in relevant_data:
                    if relevant_data[key]:
                        data_sources.append(key)

                db_context = f"""
DỮ LIỆU THỰC TỪ HỆ THỐNG HR:
==========================================
{relevant_data}
==========================================
"""
        except Exception as db_error:
            logger.warning(f"Could not fetch DB data: {db_error}")
            db_context = "\n(Không thể truy cập database - trả lời dựa trên kiến thức chung)\n"

        # Step 2: Build smart messages with DB context
        language_instruction = "Trả lời bằng tiếng Việt." if request.language == "vi" else "Respond in English."

        # System prompt khác nhau theo role
        if user_ctx.has_full_access:
            role_context = """Bạn đang hỗ trợ một quản trị viên/ban lãnh đạo.
Có thể cung cấp dữ liệu tổng quan toàn tổ chức, thống kê, so sánh phòng ban."""
        else:
            role_context = """Bạn đang hỗ trợ một nhân viên.
CHỈ trả lời về thông tin CÁ NHÂN của người dùng này.
KHÔNG đưa ra thông tin của nhân viên khác, phòng ban khác, hay số liệu tổng quan tổ chức.
Nếu người dùng hỏi về dữ liệu tổng thể (ví dụ: lương toàn công ty, số nhân viên...),
hãy lịch sự giải thích rằng bạn chỉ có thể cung cấp thông tin cá nhân của họ."""

        # Inject tool-calling prompt
        tools_prompt = get_tools_prompt()

        # Inject prisma schema
        prisma_schema = get_prisma_schema()

        # Inject company context
        company_ctx = await get_company_context()
        dp_context = (
            f"\n**THÔNG TIN CÔNG TY:**\n{company_ctx}\n"
            if company_ctx
            else ""
        )

        system_prompt = f"""Bạn là một đồng nghiệp thân thiện trong công ty, có quyền truy cập dữ liệu nhân sự.

{role_context}

CÁCH TRẢ LỜI:
- Nói chuyện tự nhiên như đang chat với đồng nghiệp, không phải chatbot
- Trả lời ngắn gọn, đúng trọng tâm, không dài dòng
- Dùng số liệu cụ thể khi có, format rõ ràng (VD: lương dùng VNĐ, phần trăm dùng %)
- KHÔNG dùng bảng Markdown, thay bằng danh sách bullet points
- Nếu cần hành động (tạo đơn, duyệt, thông báo...), thực hiện luôn qua tool
- Không có dữ liệu thì nói thẳng, gợi ý cách lấy thêm nếu có
- Không cần phải đưa ra khuyến nghị nếu câu hỏi chỉ cần trả lời đơn giản
- LUÔN LUÔN thêm mục "Follow ups:" ở cuối câu trả lời, kèm theo 2-3 câu gợi ý tiếp theo dạng danh sách. Các câu này PHẢI VIẾT DƯỚI GÓC NHÌN CỦA NGƯỜI DÙNG (dùng đại từ "tôi", "cho tôi") để họ bấm vào hỏi tiếp (Ví dụ: "Tôi muốn nghỉ 1 ngày", "Kiểm tra giúp tôi số phép còn lại", "Lọc theo phòng ban giúp tôi").

QUY TẮC NGHIÊM NGẶT - KHÔNG ĐƯỢC VI PHẠM:
- Khi cần hỏi thêm thông tin từ user, HỎI BẰNG LỜI CỦA MÌNH. Ví dụ:
  ✗ SAI: "[Loại nghỉ: ANNUAL/SICK...]"
  ✓ ĐÚNG: "Bạn muốn nghỉ loại nào: nghỉ phép thường niên hay nghỉ ốm?"
  ✗ SAI: "[Ngày bắt đầu: YYYY-MM-DD]"
  ✓ ĐÚNG: "Bạn muốn bắt đầu nghỉ từ ngày nào?"
- KHÔNG BAO GIỜ hiển thị template/placeholder như [key: value], [[key: value]], [Loại: ...], [Ngày: ...]
- Khi hỏi thêm thông tin, chỉ hỏi ĐÚNG những thứ còn thiếu, không hỏi lại những thứ đã có
- {language_instruction}

DƯỚI ĐÂY LÀ KIẾN TRÚC DATABASE CỦA HỆ THỐNG (schema.prisma). HÃY DÙNG NÓ ĐỂ TẠO CÂU LỆNH SQL CHUẨN XÁC NẾU CẦN:
```prisma
{prisma_schema}
```

{tools_prompt}

{dp_context}

{db_context}"""

        messages = [
            {"role": "system", "content": system_prompt},
        ]

        # Add conversation history
        if request.history:
            for msg in request.history[-10:]:  # Keep last 10 messages
                messages.append(msg.model_dump())

        messages.append({"role": "user", "content": request.message})

        # Step 3: Call AI provider through queue
        provider_router = get_provider_router()
        ai_queue = get_ai_queue()

        try:
            result = await ai_queue.execute(
                provider_router.chat(
                    messages=messages,
                    provider=request.provider,
                    model=request.model,
                    temperature=0.4,
                ),
                request_id=request_id,
            )
        except QueueTimeoutError:
            return SmartChatResponse(
                success=False,
                error="Hệ thống đang bận. Thử lại trong giây lát nhé.",
            )

        if not result.get("success"):
            return SmartChatResponse(
                success=False,
                error=result.get("error", "Có lỗi xảy ra. Thử lại sau nhé."),
                provider=result.get("provider"),
            )

        # Step 4: Parse tool calls from AI response
        ai_content = result.get("content", "")
        tool_calls = parse_tool_calls_from_response(ai_content)
        actions = []
        needs_followup = False

        # Tools that are read-only and should trigger a follow-up AI analysis
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

            for tc in tool_calls:
                tool_name = tc["tool"]
                # Dangerous tools (SQL INSERT/UPDATE/DELETE) need explicit confirmation
                # Safe tools are auto-confirmed inside executor.execute()
                confirmed = not is_tool_dangerous(tool_name, tc.get("params", {}))
                tool_result = await executor.execute(tool_name, tc.get("params", {}), confirmed=confirmed)
                actions.append({
                    "id": f"{tc['tool']}_{len(actions)}",
                    "tool": tool_name,
                    "description": tc.get("description", tool_result.display_message),
                    "status": tool_result.status.value,
                    "display_message": tool_result.display_message,
                    "data": tool_result.data,
                    "confirmation_required": tool_result.confirmation_required,
                    "confirmation_data": tool_result.confirmation_data,
                    "error": tool_result.error,
                    "auto_executed": confirmed,
                })

                # Flag if read-only tool succeeded with data → frontend should follow up
                if (
                    tool_name in READ_ONLY_TOOLS
                    and tool_result.status.value == "success"
                    and tool_result.data
                ):
                    needs_followup = True

            # Strip action blocks from display content
            ai_content = strip_action_blocks(ai_content)

        # Build response
        response_data = {
            "success": True,
            "content": ai_content,
            "data_sources": data_sources if data_sources else None,
            "actions": actions if actions else None,
            "needs_followup": needs_followup,
            "provider": result.get("provider"),
            "model": result.get("model"),
            "usage": result.get("usage"),
        }

        # Cache response disabled - always return fresh response
        # if not tool_calls:
        #     await set_ai_response_cache(
        #         request.message,
        #         user_role_str,
        #         user_ctx.has_full_access,
        #         response_data,
        #     )

        return SmartChatResponse(**response_data)

    except QueueTimeoutError:
        return SmartChatResponse(
            success=False,
            error="Hệ thống đang bận. Thử lại trong giây lát nhé.",
        )
    except Exception:
        logger.error(f"Smart chat error", exc_info=True)
        return SmartChatResponse(
            success=False,
            error="Có lỗi xảy ra. Thử lại sau nhé.",
        )


# =====================
# EXECUTE ACTION - User-confirmed action execution
# =====================

class ExecuteActionRequest(BaseModel):
    """Request to execute a confirmed action"""
    action_id: str = Field(..., description="Action ID from smart-chat response")
    tool: str = Field(..., description="Tool name to execute")
    params: Dict[str, Any] = Field(default_factory=dict, description="Tool parameters")
    confirmed: bool = Field(True, description="User confirmation flag")


@router.post("/execute-action")
async def execute_action(request: ExecuteActionRequest, raw_request: Request):
    """
    Execute a user-confirmed action from smart-chat.
    Only proceeds if confirmed=True.
    """
    try:
        if not request.confirmed:
            return {
                "success": False,
                "error": "Action requires user confirmation.",
            }

        user_ctx = extract_user_context(raw_request)
        executor = HRCommandExecutor(
            user_id=user_ctx.user_id or "",
            user_role=str(user_ctx.user_role.value) if user_ctx.user_role else "EMPLOYEE",
        )

        result = await executor.execute(request.tool, request.params, confirmed=request.confirmed)

        return {
            "success": result.status.value in ("success", "pending_confirmation"),
            "action_id": request.action_id,
            "tool": request.tool,
            "status": result.status.value,
            "display_message": result.display_message,
            "data": result.data,
            "error": result.error,
        }

    except Exception:
        logger.error(f"Execute action error", exc_info=True)
        return {"success": False, "error": "Có lỗi xảy ra. Thử lại sau nhé."}


# /hr-question and /leave-chat endpoints removed - use /smart-chat instead
# hrQuestion() and leaveChat() in ai-service-client.ts marked as @deprecated
