"""
Recommend Router - AI Recommendation endpoints
"""

import logging
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

from fastapi import APIRouter

from app.services.provider_router import get_provider_router
from app.utils.response_formatter import ResponseFormatter

logger = logging.getLogger(__name__)
router = APIRouter()


class SalaryRecommendRequest(BaseModel):
    """Salary recommendation request"""
    position: str = Field(..., description="Job position")
    experience_years: int = Field(..., description="Years of experience")
    education: Optional[str] = Field(None, description="Education level")
    skills: Optional[List[str]] = Field(None, description="Key skills")
    location: Optional[str] = Field(None, description="Work location")
    industry: Optional[str] = Field(None, description="Industry")


@router.post("/salary")
async def recommend_salary(request: SalaryRecommendRequest):
    """
    Recommend salary based on position, experience, and market data

    Provides:
    - Salary range recommendation
    - Market comparison
    - Negotiation tips
    """
    try:
        provider_router = get_provider_router()

        skills_str = ", ".join(request.skills) if request.skills else "Không có thông tin"

        prompt = f"""
TƯ VẤN LƯƠNG CHO VỊ TRÍ

VỊ TRÍ: {request.position}
SỐ NĂM KINH NGHIỆM: {request.experience_years} năm
TRÌNH ĐỘ HỌC VẤN: {request.education or 'Không có thông tin'}
KỸ NĂNG CHÍNH: {skills_str}
ĐỊA ĐIỂM: {request.location or 'Hồ Chí Minh'}
NGÀNH: {request.industry or 'Công nghệ'}

YÊU CẦU:
1. ĐỀ XUẤT MỨC LƯƠNG: Thấp - Trung bình - Cao (VND/tháng)
2. SO SÁNH THỊ TRƯỜNG: Cao hơn/thấp hơn/trung bình so với thị trường
3. CÁC YẾU TỐ ẢNH HƯỞNG: Giải thích tại sao
4. MẸO ĐÀM PHÁN: Gợi ý cách đàm phán
5. LƯU Ý: Các phúc lợi khác cần xem xét

Lưu ý: Đây là tư vấn tham khảo dựa trên thông tin được cung cấp.
"""

        messages = [
            {"role": "system", "content": "Bạn là chuyên gia tư vấn lương và phúc lợi. Đưa ra gợi ý khách quan, thực tế."},
            {"role": "user", "content": prompt},
        ]

        result = await provider_router.chat(messages, temperature=0.5)

        return ResponseFormatter.success(
            content=result.get("content"),
            metadata={
                "type": "salary_recommendation",
                "position": request.position,
                "experience_years": request.experience_years,
            },
            provider=result.get("provider"),
            usage=result.get("usage"),
        )

    except Exception as e:
        logger.error(f"Salary recommendation error: {e}", exc_info=True)
        return ResponseFormatter.error(str(e))


class TrainingRecommendRequest(BaseModel):
    """Training recommendation request"""
    employee_id: Optional[str] = Field(None, description="Employee ID")
    position: str = Field(..., description="Current position")
    goals: Optional[List[str]] = Field(None, description="Career goals")
    skill_gaps: Optional[List[str]] = Field(None, description="Identified skill gaps")
    experience_years: Optional[int] = Field(None, description="Years of experience")


@router.post("/training")
async def recommend_training(request: TrainingRecommendRequest):
    """
    Recommend training and development path

    Provides:
    - Training courses
    - Development activities
    - Certification paths
    """
    try:
        provider_router = get_provider_router()

        goals_str = ", ".join(request.goals) if request.goals else "Không xác định"
        gaps_str = ", ".join(request.skill_gaps) if request.skill_gaps else "Cần đánh giá"

        prompt = f"""
ĐỀ XUẤT ĐÀO TẠO VÀ PHÁT TRIỂN

VỊ TRÍ HIỆN TẠI: {request.position}
{'MÃ NHÂN VIÊN: ' + request.employee_id if request.employee_id else ''}
SỐ NĂM KINH NGHIỆM: {request.experience_years or 'Không xác định'} năm

MỤC TIÊU NGHỀ NGHIỆP: {goals_str}
KHOẢNG TRỐNG KỸ NĂNG: {gaps_str}

YÊU CẦU:
1. KHÓA HỌC ĐỀ XUẤT: 3-5 khóa học phù hợp
2. HOẠT ĐỘNG PHÁT TRIỂN: Các hoạt động bổ sung (mentoring, project, etc.)
3. CHỨNG CHỈ: Các chứng chỉ nên có
4. LỘ TRÌNH: Thứ tự ưu tiên và thời gian
5. ƯỚC TÍNH CHI PHÍ: Nếu có thể

"""

        messages = [
            {"role": "system", "content": "Bạn là chuyên gia phát triển nguồn nhân lực và đào tạo."},
            {"role": "user", "content": prompt},
        ]

        result = await provider_router.generate(prompt=prompt)

        return ResponseFormatter.success(
            content=result.get("content"),
            metadata={
                "type": "training_recommendation",
                "position": request.position,
                "employee_id": request.employee_id,
            },
            provider=result.get("provider"),
            usage=result.get("usage"),
        )

    except Exception as e:
        logger.error(f"Training recommendation error: {e}", exc_info=True)
        return ResponseFormatter.error(str(e))


class CandidateRecommendRequest(BaseModel):
    """Candidate recommendation request"""
    job_requirements: str = Field(..., description="Job requirements")
    candidates: List[dict] = Field(..., description="List of candidates")
    top_n: int = Field(5, description="Number of top candidates to return")


@router.post("/candidate")
async def recommend_candidates(request: CandidateRecommendRequest):
    """
    Recommend best candidates for a job

    Ranks candidates by:
    - Skills match
    - Experience relevance
    - Culture fit potential
    """
    try:
        provider_router = get_provider_router()

        candidates_text = "\n\n".join([
            f"Candidate {i+1}: {c.get('name', 'Unknown')}\n"
            f"Skills: {', '.join(c.get('skills', []))}\n"
            f"Experience: {c.get('experience', 'N/A')}\n"
            f"Score: {c.get('score', 'N/A')}"
            for i, c in enumerate(request.candidates)
        ])

        prompt = f"""
XẾP HẠNG VÀ ĐỀ XUẤT ỨNG VIÊN

YÊU CẦU CÔNG VIỆC:
{request.job_requirements}

DANH SÁCH ỨNG VIÊN:
{candidates_text}

YÊU CẦU:
1. Xếp hạng {request.top_n} ứng viên phù hợp nhất
2. Điểm match (0-100) với yêu cầu
3. Giải thích tại sao phù hợp
4. Lưu ý rủi ro (nếu có)

"""

        messages = [
            {"role": "system", "content": "Bạn là chuyên gia tuyển dụng. Đánh giá và xếp hạng ứng viên khách quan."},
            {"role": "user", "content": prompt},
        ]

        result = await provider_router.generate(prompt=prompt)

        return ResponseFormatter.success(
            content=result.get("content"),
            metadata={
                "type": "candidate_recommendation",
                "candidate_count": len(request.candidates),
                "top_n": request.top_n,
            },
            provider=result.get("provider"),
            usage=result.get("usage"),
        )

    except Exception as e:
        logger.error(f"Candidate recommendation error: {e}", exc_info=True)
        return ResponseFormatter.error(str(e))


class OnboardingBuddyRecommendRequest(BaseModel):
    """Onboarding buddy recommendation request"""
    new_employee_id: str = Field(..., description="New employee ID")
    new_employee_skills: Optional[List[str]] = Field(None, description="New employee skills")
    new_employee_interests: Optional[List[str]] = Field(None, description="New employee interests")
    department_id: str = Field(..., description="Department ID")
    available_buddies: List[dict] = Field(..., description="Available buddy candidates")


@router.post("/onboarding-buddy")
async def recommend_onboarding_buddy(request: OnboardingBuddyRecommendRequest):
    """
    Recommend best onboarding buddy

    Matches based on:
    - Shared interests
    - Complementary skills
    - Experience level
    - Department fit
    """
    try:
        provider_router = get_provider_router()

        buddies_text = "\n\n".join([
            f"Buddy {i+1}: {b.get('name', 'Unknown')}\n"
            f"Position: {b.get('position', 'N/A')}\n"
            f"Skills: {', '.join(b.get('skills', []))}\n"
            f"Interests: {', '.join(b.get('interests', []))}\n"
            f"Experience: {b.get('years_experience', 'N/A')} years"
            for i, b in enumerate(request.available_buddies)
        ])

        prompt = f"""
ĐỀ XUẤT BUDDY ONBOARDING

NHÂN VIÊN MỚI:
- Skills: {', '.join(request.new_employee_skills or ['Không có thông tin'])}
- Interests: {', '.join(request.new_employee_interests or ['Không có thông tin'])}

CÁC BUDDY CÓ THỂ:
{buddies_text}

YÊU CẦU:
1. Đề xuất TOP 3 buddy phù hợp nhất
2. Điểm phù hợp (0-100)
3. Giải thích tại sao phù hợp
4. Gợi ý các buổi chia sẻ/kết nối

"""

        messages = [
            {"role": "system", "content": "Bạn là chuyên gia về onboarding và phát triển nhân viên."},
            {"role": "user", "content": prompt},
        ]

        result = await provider_router.generate(prompt=prompt)

        return ResponseFormatter.success(
            content=result.get("content"),
            metadata={
                "type": "onboarding_buddy_recommendation",
                "new_employee_id": request.new_employee_id,
                "buddy_count": len(request.available_buddies),
            },
            provider=result.get("provider"),
            usage=result.get("usage"),
        )

    except Exception as e:
        logger.error(f"Buddy recommendation error: {e}", exc_info=True)
        return ResponseFormatter.error(str(e))
