"""
Chat Router - HR Chatbot endpoint
Bao gom Smart Chat ket hop du lieu tu database
Co phan quyen theo role: SUPER_ADMIN/admin xem toan bo, EMPLOYEE chi xem ca nhan
"""

import logging
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

from fastapi import APIRouter, HTTPException, Request

from app.services.provider_router import get_provider_router
from app.prompts.registry import get_prompt_registry
from app.utils.response_formatter import ResponseFormatter
from app.services.db_queries import HRDataQueries, EmployeePersonalQueries
from app.middleware.rbac import extract_user_context

logger = logging.getLogger(__name__)
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

    Use this endpoint for:
    - HR policy questions
    - Leave request inquiries
    - General HR assistance
    - Employee support
    """
    try:
        # Convert messages to dict format
        messages = [msg.model_dump() for msg in request.messages]

        # Add system prompt if not present
        has_system = any(m["role"] == "system" for m in messages)
        if not has_system:
            # Use ESS system prompt from registry
            prompt_registry = get_prompt_registry()
            system_prompt = prompt_registry.get_system_prompt("ess")
            messages.insert(0, {"role": "system", "content": system_prompt})

        # Route to AI provider
        provider_router = get_provider_router()
        result = await provider_router.chat(
            messages=messages,
            provider=request.provider,
            model=request.model,
            temperature=request.temperature,
        )

        if not result.get("success"):
            return ChatResponse(
                success=False,
                error=result.get("error", "AI request failed"),
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

    except Exception as e:
        logger.error(f"Chat error: {e}", exc_info=True)
        return ChatResponse(
            success=False,
            error=str(e),
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


class SmartChatResponse(BaseModel):
    """Smart chat response"""
    success: bool
    content: Optional[str] = None
    data_sources: Optional[List[str]] = None
    provider: Optional[str] = None
    model: Optional[str] = None
    usage: Optional[Dict] = None
    error: Optional[str] = None


@router.post("/smart-chat", response_model=SmartChatResponse)
async def smart_chat(request: SmartChatRequest, raw_request: Request):
    """
    Smart Chat - AI Chatbot thông minh kết hợp dữ liệu thực từ Database

    Phân quyền theo role:
    - SUPER_ADMIN / Admin roles (DIRECTOR, HR_MANAGER, HR_STAFF, ACCOUNTANT):
      → Truy cập toàn bộ dữ liệu HR để trả lời câu hỏi
    - EMPLOYEE / DEPT_MANAGER / TEAM_LEADER / IT_ADMIN:
      → Chỉ truy cập dữ liệu CÁ NHÂN của chính họ

    AI tự động:
    1. Đọc role của user từ header
    2. Truy vấn database phù hợp với quyền
    3. Kết hợp dữ liệu thực vào context
    4. Trả lời chính xác dựa trên dữ liệu thật
    """
    try:
        # Đọc user context từ headers (được forward bởi Next.js)
        user_ctx = extract_user_context(raw_request)

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

        system_prompt = f"""Bạn là trợ lý AI thông minh cho hệ thống Quản lý Nhân sự (Digital HRM).

{role_context}

QUAN TRỌNG:
- Ưu tiên sử dụng DỮ LIỆU THỰC từ database được cung cấp bên dưới
- Trả lời CỤ THỂ với SỐ LIỆU CHÍNH XÁC từ dữ liệu
- Khi trả lời về số liệu, hãy format đẹp (VD: lương dùng VNĐ, phần trăm dùng %)
- Nếu không có đủ dữ liệu, hãy nói rõ và gợi ý cách lấy thêm
- Luôn phân tích và đưa ra nhận xét/khuyến nghị kèm theo
- {language_instruction}

{db_context}"""

        messages = [
            {"role": "system", "content": system_prompt},
        ]

        # Add conversation history
        if request.history:
            for msg in request.history[-10:]:  # Keep last 10 messages
                messages.append(msg.model_dump())

        messages.append({"role": "user", "content": request.message})

        # Step 3: Call AI provider
        provider_router = get_provider_router()
        result = await provider_router.chat(
            messages=messages,
            provider=request.provider,
            model=request.model,
            temperature=0.4,
        )

        if not result.get("success"):
            return SmartChatResponse(
                success=False,
                error=result.get("error", "AI request failed"),
                provider=result.get("provider"),
            )

        return SmartChatResponse(
            success=True,
            content=result.get("content"),
            data_sources=data_sources if data_sources else None,
            provider=result.get("provider"),
            model=result.get("model"),
            usage=result.get("usage"),
        )

    except Exception as e:
        logger.error(f"Smart chat error: {e}", exc_info=True)
        return SmartChatResponse(
            success=False,
            error=str(e),
        )


class HRQuestionRequest(BaseModel):
    """Specific HR question request"""
    question: str = Field(..., description="User question")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context")
    language: str = Field("vi", description="Response language (vi/en)")


@router.post("/hr-question")
async def hr_question(request: HRQuestionRequest):
    """
    Answer specific HR questions

    Provides answers to common HR questions like:
    - Leave policies
    - Benefits information
    - Company policies
    - Procedures
    """
    try:
        provider_router = get_provider_router()

        # Build context-aware prompt
        context_str = ""
        if request.context:
            context_str = f"\n\nNgữ cảnh bổ sung:\n{request.context}"

        language_instruction = "Trả lời bằng tiếng Việt." if request.language == "vi" else "Respond in English."

        prompt = f"""
{language_instruction}

Câu hỏi: {request.question}
{context_str}

Hãy trả lời câu hỏi một cách chính xác, hữu ích và thân thiện.
Nếu không chắc chắn về câu trả lời, hãy nói rõ và gợi ý liên hệ bộ phận HR để được hỗ trợ.
"""

        messages = [
            {"role": "system", "content": "Bạn là trợ lý HR thân thiện, chuyên nghiệp. Trả lời chính xác các câu hỏi về chính sách nhân sự."},
            {"role": "user", "content": prompt},
        ]

        result = await provider_router.chat(messages, temperature=0.5)

        return ResponseFormatter.success(
            content=result.get("content"),
            metadata={"question": request.question},
            provider=result.get("provider"),
            usage=result.get("usage"),
        )

    except Exception as e:
        logger.error(f"HR question error: {e}", exc_info=True)
        return ResponseFormatter.error(str(e))


class LeaveChatRequest(BaseModel):
    """Leave-related chat request"""
    action: str = Field(..., description="Action: ask, approve, reject, info")
    employee_id: Optional[str] = None
    leave_request_id: Optional[str] = None
    message: Optional[str] = None
    language: str = Field("vi", description="Response language")


@router.post("/leave-chat")
async def leave_chat(request: LeaveChatRequest):
    """
    Chat about leave requests

    Actions:
    - ask: Ask about leave balance or policy
    - info: Get information about a leave request
    - approve: Get AI analysis for approval recommendation
    - reject: Get AI analysis for rejection reason
    """
    try:
        provider_router = get_provider_router()

        action_prompts = {
            "ask": "Trả lời câu hỏi về đơn nghỉ phép, số ngày nghỉ còn lại, và chính sách nghỉ phép.",
            "info": "Cung cấp thông tin chi tiết về đơn nghỉ được yêu cầu.",
            "approve": "Phân tích và đưa ra khuyến nghị có nên chấp nhận đơn nghỉ này không.",
            "reject": "Phân tích và đưa ra lý do hợp lý để từ chối đơn nghỉ này.",
        }

        prompt = f"""
Hành động: {action_prompts.get(request.action, 'Trả lời câu hỏi')}

{'Mã nhân viên: ' + request.employee_id if request.employee_id else ''}
{'Mã đơn nghỉ: ' + request.leave_request_id if request.leave_request_id else ''}
{'Tin nhắn: ' + request.message if request.message else ''}

{'Trả lời bằng tiếng Việt.' if request.language == 'vi' else 'Respond in English.'}
"""

        messages = [
            {"role": "system", "content": "Bạn là trợ lý HR chuyên về nghỉ phép. Phân tích và đưa ra thông tin hữu ích."},
            {"role": "user", "content": prompt},
        ]

        result = await provider_router.chat(messages, temperature=0.5)

        return ResponseFormatter.success(
            content=result.get("content"),
            metadata={"action": request.action},
            provider=result.get("provider"),
            usage=result.get("usage"),
        )

    except Exception as e:
        logger.error(f"Leave chat error: {e}", exc_info=True)
        return ResponseFormatter.error(str(e))
