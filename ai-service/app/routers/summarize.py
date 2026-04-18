"""
Summarize Router - Content summarization endpoints
"""

import logging
from typing import Optional, List
from pydantic import BaseModel, Field

from fastapi import APIRouter

from app.services.provider_router import get_provider_router
from app.utils.response_formatter import ResponseFormatter

logger = logging.getLogger(__name__)
router = APIRouter()


class SummarizeRequest(BaseModel):
    """Summarization request"""
    content: str = Field(..., description="Content to summarize")
    summary_type: str = Field("brief", description="Type: brief, detailed, bullet_points")
    max_length: int = Field(500, description="Maximum length in words")
    focus: Optional[str] = Field(None, description="Focus area for summary")


class SummarizeResponse(BaseModel):
    """Summarization response"""
    success: bool
    summary: Optional[str] = None
    key_points: Optional[List[str]] = None
    error: Optional[str] = None


@router.post("/content", response_model=SummarizeResponse)
async def summarize_content(request: SummarizeRequest):
    """
    Summarize any text content

    Types:
    - brief: Short, concise summary
    - detailed: Detailed summary with key points
    - bullet_points: Bullet point format
    """
    try:
        provider_router = get_provider_router()

        type_prompts = {
            "brief": "Tóm tắt ngắn gọn, súc tích, đi thẳng vào vấn đề chính. Tối đa {max_length} từ.",
            "detailed": "Tóm tắt chi tiết bao gồm: bối cảnh, nội dung chính, kết luận. Tối đa {max_length} từ.",
            "bullet_points": "Tóm tắt dạng bullet points rõ ràng, dễ đọc. Mỗi điểm tối đa 2-3 câu.",
        }

        prompt = f"""
TÓM TẮT NỘI DUNG

{'Tập trung vào: ' + request.focus if request.focus else ''}

Loại tóm tắt: {request.summary_type}
{type_prompts.get(request.summary_type, type_prompts['brief']).format(max_length=request.max_length)}

NỘI DUNG CẦN TÓM TẮT:
{request.content}

"""

        messages = [
            {"role": "system", "content": "Bạn là chuyên gia tóm tắt nội dung. Tóm tắt chính xác, rõ ràng."},
            {"role": "user", "content": prompt},
        ]

        result = await provider_router.chat(messages, temperature=0.3)

        if not result.get("success"):
            return SummarizeResponse(success=False, error=result.get("error") or "Có lỗi xảy ra. Thử lại sau nhé.")

        return SummarizeResponse(
            success=True,
            summary=result.get("content"),
        )

    except Exception:
        logger.error(f"Summarization error", exc_info=True)
        return SummarizeResponse(success=False, error="Có lỗi xảy ra. Thử lại sau nhé.")


class FeedbackSummarizeRequest(BaseModel):
    """Interview feedback summarization request"""
    feedbacks: List[dict] = Field(..., description="List of interview feedbacks")
    candidate_name: Optional[str] = Field(None, description="Candidate name")


@router.post("/feedback")
async def summarize_feedback(request: FeedbackSummarizeRequest):
    """
    Summarize multiple interview feedbacks

    Combines feedback from multiple interviewers into:
    - Overall assessment
    - Key strengths
    - Areas of concern
    - Hiring recommendation
    """
    try:
        provider_router = get_provider_router()

        feedbacks_text = "\n\n".join([
            f"Phản hồi {i+1} ({f.get('interviewer', 'Unknown')}):\n{f.get('feedback', f)}"
            for i, f in enumerate(request.feedbacks)
        ])

        prompt = f"""
TÓM TẮT PHẢN HỒI PHỎNG VẤN

{'Ứng viên: ' + request.candidate_name if request.candidate_name else ''}

FEEDBACK TỪ CÁC BUỔI PHỎNG VẤN:
{feedbacks_text}

YÊU CẦU TỔNG HỢP:
1. ĐÁNH GIÁ TỔNG QUAN: Tổng hợp cảm nhận chung
2. ĐIỂM MẠNH NỔI BẬT: Các điểm mạnh được đề cập nhiều nhất
3. MỐI QUAN TÂM: Các vấn đề cần lưu ý
4. KHUYẾN NGHỊ TUYỂN DỤNG: Nên tuyển / Cần thêm thông tin / Không nên tuyển
5. ĐIỂM SỐ ĐÁNH GIÁ: 1-10

Format rõ ràng, dễ đọc.
"""

        messages = [
            {"role": "system", "content": "Bạn là chuyên gia tổng hợp feedback phỏng vấn. Đưa ra đánh giá khách quan."},
            {"role": "user", "content": prompt},
        ]

        result = await provider_router.generate(prompt=prompt)

        return ResponseFormatter.success(
            content=result.get("content"),
            metadata={
                "type": "interview_feedback_summary",
                "candidate": request.candidate_name,
                "feedback_count": len(request.feedbacks),
            },
            provider=result.get("provider"),
            usage=result.get("usage"),
        )

    except Exception as e:
        logger.error(f"Feedback summarization error: {e}", exc_info=True)
        return ResponseFormatter.error(str(e))


class ReportSummarizeRequest(BaseModel):
    """HR report summarization request"""
    report_type: str = Field(..., description="Type: attendance, payroll, recruitment, turnover")
    report_data: dict = Field(..., description="Report data")
    period: Optional[str] = Field(None, description="Report period")


@router.post("/report")
async def summarize_report(request: ReportSummarizeRequest):
    """
    Summarize HR reports

    Creates:
    - Executive summary
    - Key metrics
    - Trends
    - Recommendations
    """
    try:
        provider_router = get_provider_router()

        prompt = f"""
TẠO TÓM TẮT BÁO CÁO HR

LOẠI BÁO CÁO: {request.report_type}
GIAI ĐOẠN: {request.period or 'Không xác định'}

DỮ LIỆU BÁO CÁO:
{request.report_data}

YÊU CẦU:
1. TÓM TẮT ĐIỀU HÀNH: 3-5 câu tổng quan
2. CÁC CHỈ SỐ CHÍNH: Metrics quan trọng nhất
3. XU HƯỚNG: So sánh với giai đoạn trước
4. ĐIỂM CẦN CHÚ Ý: Các vấn đề quan trọng
5. KHUYẾN NGHỊ: Hành động cần thiết

Format rõ ràng, phù hợp cho lãnh đạo.
"""

        messages = [
            {"role": "system", "content": "Bạn là chuyên gia phân tích báo cáo HR. Tạo tóm tắt rõ ràng, hữu ích."},
            {"role": "user", "content": prompt},
        ]

        result = await provider_router.generate(prompt=prompt)

        return ResponseFormatter.success(
            content=result.get("content"),
            metadata={
                "type": f"{request.report_type}_report_summary",
                "period": request.period,
            },
            provider=result.get("provider"),
            usage=result.get("usage"),
        )

    except Exception as e:
        logger.error(f"Report summarization error: {e}", exc_info=True)
        return ResponseFormatter.error(str(e))


class NotificationSummarizeRequest(BaseModel):
    """Notification batch summarization"""
    notifications: List[dict] = Field(..., description="List of notifications")
    period: Optional[str] = Field(None, description="Period: today, this_week, this_month")


@router.post("/notifications")
async def summarize_notifications(request: NotificationSummarizeRequest):
    """
    Summarize batch of notifications

    Creates daily/weekly digest of notifications
    """
    try:
        provider_router = get_provider_router()

        notifications_text = "\n".join([
            f"- {n.get('title', 'No title')}: {n.get('message', '')}"
            for n in request.notifications
        ])

        prompt = f"""
TẠO TÓM TẮT THÔNG BÁO

GIAI ĐOẠN: {request.period or 'Hôm nay'}
SỐ LƯỢNG: {len(request.notifications)} thông báo

DANH SÁCH THÔNG BÁO:
{notifications_text}

YÊU CẦU:
1. NHÓM THEO LOẠI: Phân loại thông báo theo chủ đề
2. ƯU TIÊN: Đánh dấu thông báo quan trọng nhất
3. TÓM TẮT NGẮN: Mỗi nhóm 1-2 câu
4. HÀNH ĐỘNG CẦN THIẾT: Nếu có

"""

        messages = [
            {"role": "system", "content": "Bạn là trợ lý quản lý thông báo. Tạo digest rõ ràng, hữu ích."},
            {"role": "user", "content": prompt},
        ]

        result = await provider_router.generate(prompt=prompt)

        return ResponseFormatter.success(
            content=result.get("content"),
            metadata={
                "type": "notification_digest",
                "period": request.period,
                "count": len(request.notifications),
            },
            provider=result.get("provider"),
            usage=result.get("usage"),
        )

    except Exception as e:
        logger.error(f"Notification summarization error: {e}", exc_info=True)
        return ResponseFormatter.error(str(e))
