"""
Generate Router - Content generation endpoints
"""

import logging
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

from fastapi import APIRouter

from app.services.provider_router import get_provider_router
from app.utils.response_formatter import ResponseFormatter

logger = logging.getLogger(__name__)
router = APIRouter()


class GenerateRequest(BaseModel):
    """Generic generation request"""
    prompt: str = Field(..., description="Generation prompt")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context")
    provider: Optional[str] = Field(None, description="AI provider")
    model: Optional[str] = Field(None, description="Model to use")


class GenerateResponse(BaseModel):
    """Generation response"""
    success: bool
    content: Optional[str] = None
    error: Optional[str] = None


@router.post("/contract")
async def generate_contract(request: GenerateRequest):
    """
    Generate contract content or clauses

    Use for:
    - Contract clause suggestions
    - Contract summary
    - Compliance checking
    """
    try:
        provider_router = get_provider_router()

        prompt = f"""
TẠO NỘI DUNG HỢP ĐỒNG LAO ĐỘNG

{'Ngữ cảnh: ' + str(request.context) if request.context else ''}

YÊU CẦU:
{request.prompt}

Lưu ý:
- Tuân thủ Bộ luật Lao động Việt Nam 2019
- Sử dụng ngôn ngữ rõ ràng, chính xác
- Bao gồm các điều khoản bắt buộc theo luật

"""

        messages = [
            {"role": "system", "content": "Bạn là chuyên gia pháp lý về luật lao động Việt Nam. Soạn thảo hợp đồng chính xác, tuân thủ pháp luật."},
            {"role": "user", "content": prompt},
        ]

        result = await provider_router.generate(
            prompt=request.prompt,
            context=request.context,
        )

        return ResponseFormatter.success(
            content=result.get("content"),
            metadata={"type": "contract_generation"},
            provider=result.get("provider"),
            usage=result.get("usage"),
        )

    except Exception as e:
        logger.error(f"Contract generation error: {e}", exc_info=True)
        return ResponseFormatter.error(str(e))


class InterviewQuestionsRequest(BaseModel):
    """Interview questions generation request"""
    job_title: str = Field(..., description="Job title/position")
    job_description: str = Field(..., description="Job description")
    department: Optional[str] = Field(None, description="Department")
    experience_level: Optional[str] = Field(None, description="Experience level: junior/mid/senior")
    question_types: Optional[List[str]] = Field(None, description="Types: technical/behavioral/situational")


@router.post("/interview-questions")
async def generate_interview_questions(request: InterviewQuestionsRequest):
    """
    Generate interview questions for a position

    Creates:
    - Technical questions
    - Behavioral questions
    - Situational questions
    - Culture fit questions
    """
    try:
        provider_router = get_provider_router()

        types = request.question_types or ["technical", "behavioral", "situational"]

        type_prompts = {
            "technical": "Câu hỏi kỹ thuật liên quan đến công việc",
            "behavioral": "Câu hỏi về hành vi, cách xử lý tình huống trong quá khứ",
            "situational": "Câu hỏi tình huống, đặt ra tình huống giả định",
        }

        prompt = f"""
TẠO CÂU HỎI PHỎNG VẤN

VỊ TRÍ: {request.job_title}
PHÒNG BAN: {request.department or 'Không xác định'}
CẤP BẬC: {request.experience_level or 'Mid-level'}

MÔ TẢ CÔNG VIỆC:
{request.job_description}

TẠO CÂU HỎI PHỎNG VẤN CHO:
{', '.join([type_prompts.get(t, t) for t in types])}

YÊU CẦU:
- Mỗi loại tạo 5-7 câu hỏi
- Câu hỏi phù hợp với cấp bậc {request.experience_level or 'mid-level'}
- Đánh dấu câu hỏi quan trọng nhất (*)
- Format rõ ràng, dễ đọc

"""

        messages = [
            {"role": "system", "content": "Bạn là chuyên gia tuyển dụng với kinh nghiệm phỏng vấn sâu. Tạo câu hỏi chất lượng cao."},
            {"role": "user", "content": prompt},
        ]

        result = await provider_router.generate(
            prompt=prompt,
            context={"job_title": request.job_title, "department": request.department},
        )

        return ResponseFormatter.success(
            content=result.get("content"),
            metadata={
                "type": "interview_questions",
                "job_title": request.job_title,
                "question_types": types,
            },
            provider=result.get("provider"),
            usage=result.get("usage"),
        )

    except Exception as e:
        logger.error(f"Interview questions generation error: {e}", exc_info=True)
        return ResponseFormatter.error(str(e))


class OnboardingPlanRequest(BaseModel):
    """Onboarding plan generation request"""
    employee_name: str = Field(..., description="New employee name")
    position: str = Field(..., description="Job position")
    department: str = Field(..., description="Department")
    start_date: Optional[str] = Field(None, description="Start date")
    employment_type: Optional[str] = Field(None, description="Full-time/part-time/intern")
    previous_experience: Optional[str] = Field(None, description="Previous experience summary")


@router.post("/onboarding")
async def generate_onboarding_plan(request: OnboardingPlanRequest):
    """
    Generate personalized onboarding plan

    Creates:
    - Week-by-week schedule
    - Training tasks
    - Mentorship assignments
    - Milestones
    """
    try:
        provider_router = get_provider_router()

        prompt = f"""
TẠO KẾ HOẠCH ONBOARDING CHO NHÂN VIÊN MỚI

NHÂN VIÊN: {request.employee_name}
VỊ TRÍ: {request.position}
PHÒNG BAN: {request.department}
NGÀY BẮT ĐẦU: {request.start_date or 'Chưa xác định'}
LOẠI HÌNH: {request.employment_type or 'Full-time'}

{'KINH NGHIỆM TRƯỚC ĐÓ: ' + request.previous_experience if request.previous_experience else ''}

YÊU CẦU KẾ HOẠCH:
1. Lịch trình tuần 1-4 (hoặc tuần 1-12 cho internship)
2. Các buổi đào tạo cần thiết
3. Các milestone quan trọng
4. Người hướng dẫn/buddy được gợi ý
5. Tài liệu cần chuẩn bị
6. Các buổi check-in định kỳ

Format chi tiết, có thời gian cụ thể.
"""

        messages = [
            {"role": "system", "content": "Bạn là chuyên gia về onboarding và đào tạo nhân viên mới."},
            {"role": "user", "content": prompt},
        ]

        result = await provider_router.generate(
            prompt=prompt,
            context={
                "employee_name": request.employee_name,
                "position": request.position,
                "department": request.department,
            },
        )

        return ResponseFormatter.success(
            content=result.get("content"),
            metadata={
                "type": "onboarding_plan",
                "employee": request.employee_name,
                "position": request.position,
            },
            provider=result.get("provider"),
            usage=result.get("usage"),
        )

    except Exception as e:
        logger.error(f"Onboarding plan generation error: {e}", exc_info=True)
        return ResponseFormatter.error(str(e))


class LeaveResponseRequest(BaseModel):
    """Leave request auto-response"""
    leave_type: str = Field(..., description="Leave type")
    start_date: str = Field(..., description="Start date")
    end_date: str = Field(..., description="End date")
    reason: Optional[str] = Field(None, description="Reason")
    employee_name: Optional[str] = Field(None, description="Employee name")
    leave_balance: Optional[Dict[str, int]] = Field(None, description="Leave balance")


@router.post("/leave-response")
async def generate_leave_response(request: LeaveResponseRequest):
    """
    Generate response/recommendation for leave request

    Analyzes and provides:
    - Recommendation (approve/reject/need more info)
    - Response message
    - Risk assessment
    """
    try:
        provider_router = get_provider_router()

        balance_info = ""
        if request.leave_balance:
            balance_info = f"""
SỐ DƯ NGHỈ PHÉP:
{request.leave_balance}
"""

        prompt = f"""
PHÂN TÍCH VÀ ĐỀ XUẤT PHẢN HỒI ĐƠN NGHỈ PHÉP

THÔNG TIN ĐƠN:
- Loại nghỉ: {request.leave_type}
- Từ ngày: {request.start_date}
- Đến ngày: {request.end_date}
- Lý do: {request.reason or 'Không có'}
- Nhân viên: {request.employee_name or 'Không xác định'}

{balance_info}

YÊU CẦU:
1. Đưa ra KHUYẾN NGHỊ: Chấp nhận / Từ chối / Cần thêm thông tin
2. Viết THÔNG BÁO phản hồi cho nhân viên
3. Đánh giá RỦI RO (nếu có)
4. Gợi ý ĐIỀU KIỆN đi kèm (nếu cần)

"""

        messages = [
            {"role": "system", "content": "Bạn là chuyên gia quản lý nghỉ phép. Phân tích và đưa ra phản hồi hợp lý."},
            {"role": "user", "content": prompt},
        ]

        result = await provider_router.generate(prompt=prompt)

        return ResponseFormatter.success(
            content=result.get("content"),
            metadata={
                "type": "leave_response",
                "leave_type": request.leave_type,
                "employee": request.employee_name,
            },
            provider=result.get("provider"),
            usage=result.get("usage"),
        )

    except Exception as e:
        logger.error(f"Leave response generation error: {e}", exc_info=True)
        return ResponseFormatter.error(str(e))


class JobDescriptionRequest(BaseModel):
    """Job description generation request"""
    job_title: str = Field(..., description="Job title")
    department: str = Field(..., description="Department")
    employment_type: Optional[str] = Field(None, description="Full-time/part-time")
    experience_level: Optional[str] = Field(None, description="Experience level")
    key_responsibilities: Optional[List[str]] = Field(None, description="Key responsibilities")
    requirements: Optional[List[str]] = Field(None, description="Requirements")
    benefits: Optional[List[str]] = Field(None, description="Benefits")


@router.post("/job-description")
async def generate_job_description(request: JobDescriptionRequest):
    """
    Generate optimized job description

    Creates compelling:
    - Job title variations
    - Responsibilities
    - Requirements
    - Benefits
    - Company culture hints
    """
    try:
        provider_router = get_provider_router()

        prompt = f"""
TẠO MÔ TẢ CÔNG VIỆC HẤP DẪN

VỊ TRÍ: {request.job_title}
PHÒNG BAN: {request.department}
LOẠI HÌNH: {request.employment_type or 'Full-time'}
CẤP BẬC: {request.experience_level or 'Mid-level'}

{'TRÁCH NHIỆM CHÍNH: ' + ', '.join(request.key_responsibilities) if request.key_responsibilities else ''}
{'YÊU CẦU: ' + ', '.join(request.requirements) if request.requirements else ''}
{'LỢI ÍCH: ' + ', '.join(request.benefits) if request.benefits else ''}

YÊU CẦU:
1. Mô tả công việc hấp dẫn, thu hút ứng viên
2. Sử dụng ngôn ngữ chuyên nghiệp nhưng thân thiện
3. Nêu bật cơ hội phát triển
4. Đảm bảo phù hợp với thị trường lao động Việt Nam
5. Format rõ ràng, dễ đọc

"""

        messages = [
            {"role": "system", "content": "Bạn là chuyên gia tuyển dụng. Viết mô tả công việc hấp dẫn ứng viên."},
            {"role": "user", "content": prompt},
        ]

        result = await provider_router.generate(prompt=prompt)

        return ResponseFormatter.success(
            content=result.get("content"),
            metadata={
                "type": "job_description",
                "job_title": request.job_title,
                "department": request.department,
            },
            provider=result.get("provider"),
            usage=result.get("usage"),
        )

    except Exception as e:
        logger.error(f"Job description generation error: {e}", exc_info=True)
        return ResponseFormatter.error(str(e))


class WelcomeEmailRequest(BaseModel):
    """Welcome email generation request"""
    employee_name: str = Field(..., description="New employee name")
    position: str = Field(..., description="Job position")
    department: str = Field(..., description="Department")
    start_date: str = Field(..., description="Start date")
    manager_name: Optional[str] = Field(None, description="Manager name")
    buddy_name: Optional[str] = Field(None, description="Buddy name")


@router.post("/welcome-email")
async def generate_welcome_email(request: WelcomeEmailRequest):
    """
    Generate personalized welcome email

    Creates warm, professional welcome message
    """
    try:
        provider_router = get_provider_router()

        prompt = f"""
VIẾT EMAIL CHÀO MỪNG NHÂN VIÊN MỚI

NHÂN VIÊN: {request.employee_name}
VỊ TRÍ: {request.position}
PHÒNG BAN: {request.department}
NGÀY BẮT ĐẦU: {request.start_date}
QUẢN LÝ: {request.manager_name or 'Chưa xác định'}
BUDDY: {request.buddy_name or 'Sẽ được chỉ định'}

YÊU CẦU:
1. Email ấm áp, thân thiện, chuyên nghiệp
2. Giới thiệu về vị trí và phòng ban
3. Thông tin ngày đầu tiên
4. Thông tin người liên hệ
5. Động viên, tạo hứng khởi

"""

        messages = [
            {"role": "system", "content": "Bạn là chuyên gia truyền thông nội bộ. Viết email chào mừng chuyên nghiệp."},
            {"role": "user", "content": prompt},
        ]

        result = await provider_router.generate(prompt=prompt)

        return ResponseFormatter.success(
            content=result.get("content"),
            metadata={
                "type": "welcome_email",
                "employee": request.employee_name,
            },
            provider=result.get("provider"),
            usage=result.get("usage"),
        )

    except Exception as e:
        logger.error(f"Welcome email generation error: {e}", exc_info=True)
        return ResponseFormatter.error(str(e))


class PerformanceReviewRequest(BaseModel):
    """Performance review generation request"""
    employee_name: str = Field(..., description="Employee name")
    position: str = Field(..., description="Job position")
    period: str = Field(..., description="Review period")
    achievements: List[str] = Field(..., description="Key achievements")
    areas_for_improvement: Optional[List[str]] = Field(None, description="Areas for improvement")
    goals: Optional[List[str]] = Field(None, description="Goals for next period")


@router.post("/performance-review")
async def generate_performance_review(request: PerformanceReviewRequest):
    """
    Generate performance review content

    Creates:
    - Performance summary
    - Strengths and achievements
    - Areas for improvement
    - Goals and recommendations
    """
    try:
        provider_router = get_provider_router()

        prompt = f"""
TẠO NỘI DUNG ĐÁNH GIÁ HIỆU SUẤT

NHÂN VIÊN: {request.employee_name}
VỊ TRÍ: {request.position}
GIAI ĐOẠN: {request.period}

THÀNH TÍCH ĐẠT ĐƯỢC:
{chr(10).join('- ' + a for a in request.achievements)}

{'LĨNH VỰC CẦN CẢI TIẾN: ' + chr(10).join('- ' + a for a in request.areas_for_improvement) if request.areas_for_improvement else ''}

{'MỤC TIÊU GIAI ĐOẠN TỚI: ' + chr(10).join('- ' + g for g in request.goals) if request.goals else ''}

YÊU CẦU:
1. Viết đánh giá khách quan, công bằng
2. Cân bằng giữa điểm mạnh và điểm cần cải thiện
3. Đề xuất cụ thể cho giai đoạn tới
4. Ngôn ngữ chuyên nghiệp, mang tính xây dựng

"""

        messages = [
            {"role": "system", "content": "Bạn là chuyên gia đánh giá hiệu suất. Viết đánh giá công bằng, xây dựng."},
            {"role": "user", "content": prompt},
        ]

        result = await provider_router.generate(prompt=prompt)

        return ResponseFormatter.success(
            content=result.get("content"),
            metadata={
                "type": "performance_review",
                "employee": request.employee_name,
                "period": request.period,
            },
            provider=result.get("provider"),
            usage=result.get("usage"),
        )

    except Exception as e:
        logger.error(f"Performance review generation error: {e}", exc_info=True)
        return ResponseFormatter.error(str(e))
