"""
Analyze Router - AI Analysis endpoints for HR data
Bao gom Workforce, Department va Employee 360 analysis tu database
"""

import logging
import json
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

from fastapi import APIRouter, HTTPException

from app.services.provider_router import get_provider_router
from app.utils.response_formatter import ResponseFormatter
from app.services.db_queries import HRDataQueries

logger = logging.getLogger(__name__)
router = APIRouter()


class AnalyzeRequest(BaseModel):
    """Generic analysis request"""
    prompt: str = Field(..., description="Analysis prompt/instructions")
    data: Dict[str, Any] = Field(..., description="Data to analyze")
    provider: Optional[str] = Field(None, description="AI provider")
    model: Optional[str] = Field(None, description="Model to use")


class ResumeAnalysisRequest(BaseModel):
    """Resume/CV analysis request"""
    resume_text: str = Field(..., description="Resume or CV text content")
    job_requirements: Optional[str] = Field(None, description="Job requirements")
    job_description: Optional[str] = Field(None, description="Job description")
    candidate_name: Optional[str] = Field(None, description="Candidate name")


class ResumeAnalysisResponse(BaseModel):
    """Resume analysis response"""
    success: bool
    score: Optional[float] = None
    strengths: Optional[List[str]] = None
    weaknesses: Optional[List[str]] = None
    skills_match: Optional[Dict[str, Any]] = None
    recommendations: Optional[List[str]] = None
    summary: Optional[str] = None
    error: Optional[str] = None


@router.post("/resume", response_model=ResumeAnalysisResponse)
async def analyze_resume(request: ResumeAnalysisRequest):
    """
    Analyze candidate resume/CV

    Extracts:
    - Skills and experience
    - Match score with job requirements
    - Strengths and weaknesses
    - Recommendations
    """
    try:
        provider_router = get_provider_router()

        # Build comprehensive analysis prompt
        job_info = ""
        if request.job_requirements or request.job_description:
            job_info = f"""
YÊU CẦU CÔNG VIỆC:
{request.job_requirements or request.job_description}
"""

        prompt = f"""
Bạn là chuyên gia tuyển dụng với kinh nghiệm sâu trong việc đánh giá hồ sơ ứng viên.

Hãy phân tích CV sau và đưa ra đánh giá chi tiết:

{job_info}

CV ỨNG VIÊN:
{request.resume_text}

YÊU CẦU PHÂN TÍCH:
1. Chấm điểm phù hợp (0-100) với yêu cầu công việc
2. Liệt kê các ĐIỂM MẠNH của ứng viên
3. Liệt kê các ĐIỂM YẾU cần lưu ý
4. Đánh giá mức độ khớp kỹ năng (match/don't match/partially match)
5. Đưa ra KHUYẾN NGHỊ cho nhà tuyển dụng
6. Tóm tắt ngắn gọi (dưới 200 từ)

Trả lời bằng tiếng Việt, format JSON như sau:
{{
  "score": <điểm 0-100>,
  "strengths": ["điểm mạnh 1", "điểm mạnh 2", ...],
  "weaknesses": ["điểm yếu 1", "điểm yếu 2", ...],
  "skills_match": {{"matched": [...], "partial": [...], "missing": [...]}},
  "recommendations": ["khuyến nghị 1", "khuyến nghị 2", ...],
  "summary": "<tóm tắt ngắn>"
}}
"""

        messages = [
            {"role": "system", "content": "Bạn là chuyên gia tuyển dụng. Phân tích CV chính xác và khách quan."},
            {"role": "user", "content": prompt},
        ]

        result = await provider_router.chat(messages, temperature=0.3)

        if not result.get("success"):
            return ResumeAnalysisResponse(success=False, error=result.get("error") or "Có lỗi xảy ra. Thử lại sau nhé.")

        # Parse JSON from response
        content = result.get("content", "")

        try:
            # Try to extract JSON from response
            json_start = content.find("{")
            json_end = content.rfind("}") + 1
            if json_start != -1 and json_end > json_start:
                json_str = content[json_start:json_end]
                analysis = json.loads(json_str)

                return ResumeAnalysisResponse(
                    success=True,
                    score=analysis.get("score"),
                    strengths=analysis.get("strengths", []),
                    weaknesses=analysis.get("weaknesses", []),
                    skills_match=analysis.get("skills_match", {}),
                    recommendations=analysis.get("recommendations", []),
                    summary=analysis.get("summary"),
                )
        except (json.JSONDecodeError, ValueError) as e:
            logger.warning(f"Failed to parse JSON from response: {e}")

        # Fallback: return raw content
        return ResumeAnalysisResponse(
            success=True,
            summary=content,
        )

    except Exception:
        logger.error(f"Resume analysis error", exc_info=True)
        return ResumeAnalysisResponse(success=False, error="Có lỗi xảy ra. Thử lại sau nhé.")


# =====================
# WORKFORCE ANALYSIS - Phan tich luc luong lao dong tu DB
# =====================

@router.post("/workforce")
async def analyze_workforce():
    """
    Phân tích toàn diện lực lượng lao động từ Database

    Tự động truy vấn tất cả dữ liệu HR và phân tích:
    - Cơ cấu nhân sự
    - Biến động nhân sự
    - Năng suất và chấm công
    - Chi phí nhân sự
    - Rủi ro và cảnh báo
    """
    try:
        # Fetch all data
        hr_data = await HRDataQueries.get_full_hr_snapshot()

        if not any(hr_data.values()):
            return ResponseFormatter.error("Không thể truy cập database.")

        prompt = f"""
PHÂN TÍCH TOÀN DIỆN LỰC LƯỢNG LAO ĐỘNG

DỮ LIỆU HR THỰC TỪ DATABASE:
{json.dumps(hr_data, ensure_ascii=False, indent=2, default=str)}

HÃY PHÂN TÍCH CHI TIẾT:

1. **CƠ CẤU NHÂN SỰ**
   - Quy mô tổng thể, phân bổ theo phòng ban
   - Tỷ lệ giới tính, độ tuổi trung bình, thâm niên
   - Phân bổ loại hợp đồng

2. **BIẾN ĐỘNG NHÂN SỰ**
   - Tuyển mới vs nghỉ việc 30 ngày gần nhất
   - Tỷ lệ turnover ước tính
   - Xu hướng tăng/giảm

3. **CHẤM CÔNG & NĂNG SUẤT**
   - Tỷ lệ đi muộn, vắng mặt
   - Số giờ OT trung bình
   - Nhân viên có vấn đề chấm công

4. **CHI PHÍ NHÂN SỰ**
   - Quỹ lương tổng thể
   - Chi phí trung bình/nhân viên
   - Phân bổ theo phòng ban

5. **NGHỈ PHÉP**
   - Tỷ lệ sử dụng phép
   - Số dư phép trung bình
   - Đơn nghỉ đang chờ duyệt

6. **TUYỂN DỤNG**
   - Pipeline hiện tại
   - Tỷ lệ chuyển đổi
   - Vị trí đang mở

7. **HỢP ĐỒNG**
   - Phân bổ trạng thái
   - Hợp đồng sắp hết hạn

8. **RỦI RO & CẢNH BÁO**
   - Các vấn đề cần chú ý ngay
   - Rủi ro tiềm ẩn

9. **KHUYẾN NGHỊ**
   - Top 5 hành động ưu tiên

Trả lời bằng tiếng Việt, sử dụng SỐ LIỆU CỤ THỂ.
"""

        provider_router = get_provider_router()
        result = await provider_router.chat(
            [
                {"role": "system", "content": "Bạn là chuyên gia People Analytics cấp cao. Phân tích dữ liệu workforce toàn diện và chi tiết."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
        )

        return ResponseFormatter.success(
            content=result.get("content"),
            metadata={
                "type": "workforce_analysis",
                "total_employees": hr_data.get("employees", {}).get("total_employees") if hr_data.get("employees") else None,
                "data_sources": list(k for k, v in hr_data.items() if v and k != "generated_at"),
            },
            provider=result.get("provider"),
            usage=result.get("usage"),
        )

    except Exception as e:
        logger.error(f"Workforce analysis error: {e}", exc_info=True)
        return ResponseFormatter.error(str(e))


# =====================
# DEPARTMENT ANALYSIS - Phan tich phong ban tu DB
# =====================

@router.post("/department/{department_id}")
async def analyze_department(department_id: str):
    """
    Phân tích chi tiết một phòng ban từ Database

    Bao gồm:
    - Thông tin phòng ban và quản lý
    - Danh sách nhân viên
    - Hiệu suất chấm công
    - Phân tích lương
    - Đề xuất cải thiện
    """
    try:
        dept_data = await HRDataQueries.get_department_analysis(department_id)

        if not dept_data:
            return ResponseFormatter.error(
                f"Không tìm thấy phòng ban với ID: {department_id}. "
                "Vui lòng kiểm tra lại ID hoặc kết nối database."
            )

        prompt = f"""
PHÂN TÍCH CHI TIẾT PHÒNG BAN

DỮ LIỆU PHÒNG BAN TỪ DATABASE:
{json.dumps(dept_data, ensure_ascii=False, indent=2, default=str)}

HÃY PHÂN TÍCH:
1. TỔNG QUAN: Quy mô, cơ cấu, người quản lý
2. NHÂN SỰ: Phân tích danh sách nhân viên (thâm niên, vị trí, giới tính)
3. CHẤM CÔNG: Đánh giá tình hình chấm công (đi muộn, OT)
4. LƯƠNG: Phân bổ lương, mức trung bình, min/max
5. VẤN ĐỀ: Vấn đề cần lưu ý
6. KHUYẾN NGHỊ: Đề xuất cải thiện cho phòng ban

Trả lời bằng tiếng Việt với số liệu cụ thể.
"""

        provider_router = get_provider_router()
        result = await provider_router.chat(
            [
                {"role": "system", "content": "Bạn là chuyên gia phân tích tổ chức. Phân tích chi tiết phòng ban và đề xuất cải thiện."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
        )

        return ResponseFormatter.success(
            content=result.get("content"),
            metadata={
                "type": "department_analysis",
                "department_id": department_id,
                "department_name": dept_data.get("department", {}).get("name"),
                "employee_count": dept_data.get("employee_count"),
            },
            provider=result.get("provider"),
            usage=result.get("usage"),
        )

    except Exception as e:
        logger.error(f"Department analysis error: {e}", exc_info=True)
        return ResponseFormatter.error(str(e))


# =====================
# EMPLOYEE 360 ANALYSIS - Ho so 360 do cua nhan vien
# =====================

@router.post("/employee/{user_id}")
async def analyze_employee_360(user_id: str):
    """
    Phân tích hồ sơ 360° nhân viên từ Database

    Bao gồm:
    - Thông tin cá nhân & công việc
    - Lịch sử chấm công
    - Hợp đồng hiện tại
    - Lương & phụ cấp
    - Khen thưởng/kỷ luật
    - Timeline sự kiện
    - Đánh giá tổng thể & đề xuất
    """
    try:
        employee_data = await HRDataQueries.get_employee_360(user_id)

        if not employee_data:
            return ResponseFormatter.error(
                f"Không tìm thấy nhân viên với ID: {user_id}. "
                "Vui lòng kiểm tra lại ID hoặc kết nối database."
            )

        prompt = f"""
PHÂN TÍCH HỒ SƠ 360° NHÂN VIÊN

DỮ LIỆU NHÂN VIÊN TỪ DATABASE:
{json.dumps(employee_data, ensure_ascii=False, indent=2, default=str)}

HÃY PHÂN TÍCH TOÀN DIỆN:

1. **TỔNG QUAN CÁ NHÂN**
   - Thông tin cơ bản, vị trí, phòng ban
   - Thâm niên làm việc

2. **HIỆU SUẤT CHẤM CÔNG**
   - Đánh giá 3 tháng gần nhất
   - Xu hướng đi muộn, OT
   - So sánh với tiêu chuẩn

3. **LƯƠNG & ĐÃI NGỘ**
   - Mức lương hiện tại
   - So sánh với vị trí tương đương (nếu có)

4. **HỢP ĐỒNG**
   - Trạng thái hợp đồng hiện tại
   - Thời hạn còn lại

5. **NGHỈ PHÉP**
   - Số dư phép
   - Tình hình sử dụng

6. **KHEN THƯỞNG / KỶ LUẬT**
   - Lịch sử khen thưởng, kỷ luật

7. **ĐÁNH GIÁ TỔNG THỂ**
   - Đánh giá nhân viên trên thang 1-10
   - Điểm mạnh, điểm cần cải thiện

8. **KHUYẾN NGHỊ**
   - Đề xuất phát triển cá nhân
   - Gợi ý lộ trình thăng tiến

Trả lời bằng tiếng Việt.
"""

        provider_router = get_provider_router()
        result = await provider_router.chat(
            [
                {"role": "system", "content": "Bạn là chuyên gia HR (HRBP) phân tích hồ sơ nhân viên toàn diện. Đưa ra đánh giá công bằng và đề xuất phát triển."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
        )

        emp_info = employee_data.get("employee", {})
        return ResponseFormatter.success(
            content=result.get("content"),
            metadata={
                "type": "employee_360",
                "user_id": user_id,
                "employee_name": emp_info.get("name"),
                "department": emp_info.get("department_name"),
                "position": emp_info.get("position_name"),
            },
            provider=result.get("provider"),
            usage=result.get("usage"),
        )

    except Exception as e:
        logger.error(f"Employee 360 analysis error: {e}", exc_info=True)
        return ResponseFormatter.error(str(e))


# =====================
# EXISTING ENDPOINTS (kept as-is)
# =====================

class AttendanceAnalysisRequest(BaseModel):
    """Attendance data analysis request"""
    attendance_data: Dict[str, Any] = Field(..., description="Attendance records")
    employee_id: Optional[str] = Field(None, description="Employee ID")
    analysis_type: str = Field("anomaly", description="Type: anomaly, pattern, overtime")


@router.post("/attendance")
async def analyze_attendance(request: AttendanceAnalysisRequest):
    """
    Analyze attendance data

    Types of analysis:
    - anomaly: Detect unusual attendance patterns
    - pattern: Analyze work patterns
    - overtime: Predict overtime needs
    """
    try:
        provider_router = get_provider_router()

        analysis_prompts = {
            "anomaly": "Phát hiện các mẫu bất thường trong dữ liệu chấm công như: đi muộn thường xuyên, về sớm bất thường, vắng mặt nhiều, patterns đáng ngờ.",
            "pattern": "Phân tích mẫu chấm công để tìm xu hướng, thói quen làm việc, peak hours, và insights về hiệu suất.",
            "overtime": "Dự đoán nhu cầu overtime dựa trên workload, project deadlines, và historical data.",
            "stay_interview": "Đóng vai trò HR Business Partner (HRBP). Dựa trên dữ liệu 30 ngày gần nhất, hãy:\n1. Đánh giá rủi ro nghỉ việc hiện tại (Low/Medium/High)\n2. Phân tích nguyên nhân tâm lý có thể xảy ra\n3. Sinh ra 'Kịch bản phỏng vấn giữ chân' (Stay Interview Script). BẮT BUỘC phải có đúng nguyên văn câu hỏi này: \"Dạo này tôi thấy bạn thường xuyên đến muộn, liệu có phải bạn đang gặp áp lực về khối lượng công việc hiện tại hay có định hướng mới không?\"",
            "flight_risk": "Đóng vai trò chuyên gia phân tích nhân sự. Phân tích các nhân viên có nguy cơ nghỉ việc cao (Flight Risk) dựa trên dữ liệu đầu vào bao gồm độ lệch giờ check-in, tỷ lệ đi muộn, vắng mặt và số giờ OT. Đưa ra cảnh báo tổng thể và đề xuất giải pháp.",
        }

        prompt = f"""
PHÂN TÍCH {request.analysis_type.upper()} CHẤM CÔNG

{'Mã nhân viên: ' + request.employee_id if request.employee_id else ''}

DỮ LIỆU CHẤM CÔNG:
{request.attendance_data}

YÊU CẦU:
{analysis_prompts.get(request.analysis_type, analysis_prompts['anomaly'])}

Trả lời chi tiết bằng tiếng Việt.
"""

        messages = [
            {"role": "system", "content": "Bạn là chuyên gia phân tích chấm công và quản lý thời gian làm việc."},
            {"role": "user", "content": prompt},
        ]

        result = await provider_router.analyze(
            prompt=analysis_prompts.get(request.analysis_type),
            data=request.attendance_data,
        )

        return ResponseFormatter.success(
            content=result.get("content"),
            metadata={
                "type": request.analysis_type,
                "employee_id": request.employee_id,
            },
            provider=result.get("provider"),
            usage=result.get("usage"),
        )

    except Exception as e:
        logger.error(f"Attendance analysis error: {e}", exc_info=True)
        return ResponseFormatter.error(str(e))


class PayrollAnalysisRequest(BaseModel):
    """Payroll analysis request"""
    payroll_data: Dict[str, Any] = Field(..., description="Payroll/salary data")
    employee_id: Optional[str] = Field(None, description="Employee ID")
    analysis_type: str = Field("fairness", description="Type: fairness, anomaly, forecast")


@router.post("/payroll")
async def analyze_payroll(request: PayrollAnalysisRequest):
    """
    Analyze payroll/salary data

    Types:
    - fairness: Analyze salary fairness
    - anomaly: Detect anomalies
    - forecast: Forecast future payroll
    """
    try:
        provider_router = get_provider_router()

        analysis_prompts = {
            "fairness": "Phân tích công bằng lương: so sánh mức lương với thị trường, kinh nghiệm, hiệu suất. Đưa ra insights về gap và khuyến nghị.",
            "anomaly": "Phát hiện các bất thường trong dữ liệu lương: sai sót tính toán, outliers, patterns không hợp lý.",
            "forecast": "Dự báo chi phí lương tương lai dựa trên hiring plans, salary adjustments, và market trends.",
        }

        result = await provider_router.analyze(
            prompt=analysis_prompts.get(request.analysis_type),
            data=request.payroll_data,
        )

        return ResponseFormatter.success(
            content=result.get("content"),
            metadata={
                "type": request.analysis_type,
                "employee_id": request.employee_id,
            },
            provider=result.get("provider"),
            usage=result.get("usage"),
        )

    except Exception as e:
        logger.error(f"Payroll analysis error: {e}", exc_info=True)
        return ResponseFormatter.error(str(e))


class TurnoverAnalysisRequest(BaseModel):
    """Turnover/resignation risk analysis"""
    employee_data: Dict[str, Any] = Field(..., description="Employee data")
    employee_id: Optional[str] = Field(None, description="Employee ID")


@router.post("/turnover")
async def analyze_turnover(request: TurnoverAnalysisRequest):
    """
    Analyze and predict employee turnover risk

    Factors considered:
    - Tenure and career progression
    - Performance trends
    - Attendance patterns
    - Team dynamics
    """
    try:
        provider_router = get_provider_router()

        prompt = """
PHÂN TÍCH NGUY CƠ NGHỈ VIỆC

Dựa trên dữ liệu nhân viên dưới đây, hãy:
1. Đánh giá mức độ nguy cơ nghỉ việc (low/medium/high/critical)
2. Xác định các dấu hiệu cảnh báo
3. Đề xuất các hành động giữ chân nhân viên

"""

        result = await provider_router.analyze(
            prompt=prompt,
            data=request.employee_data,
        )

        return ResponseFormatter.success(
            content=result.get("content"),
            metadata={"employee_id": request.employee_id},
            provider=result.get("provider"),
            usage=result.get("usage"),
        )

    except Exception as e:
        logger.error(f"Turnover analysis error: {e}", exc_info=True)
        return ResponseFormatter.error(str(e))


class SentimentAnalysisRequest(BaseModel):
    """Sentiment analysis for employee feedback"""
    text: str = Field(..., description="Text to analyze")
    context: Optional[str] = Field(None, description="Context")


@router.post("/sentiment")
async def analyze_sentiment(request: SentimentAnalysisRequest):
    """
    Analyze sentiment in employee feedback, exit interviews, surveys

    Returns sentiment score and key themes
    """
    try:
        provider_router = get_provider_router()

        prompt = f"""
PHÂN TÍCH CẢM XÚC VÀ CHỦ ĐỀ

Văn bản cần phân tích:
{request.text}

{'Ngữ cảnh: ' + request.context if request.context else ''}

YÊU CẦU:
1. Xác định cảm xúc chính (tích cực/tiêu cực/trung lập)
2. Đánh giá mức độ cảm xúc (1-10)
3. Trích xuất các chủ đề chính
4. Nhận diện các vấn đề quan trọng

Trả lời bằng tiếng Việt, format JSON.
"""

        messages = [
            {"role": "system", "content": "Bạn là chuyên gia phân tích cảm xúc và feedback."},
            {"role": "user", "content": prompt},
        ]

        result = await provider_router.chat(messages, temperature=0.3)

        return ResponseFormatter.success(
            content=result.get("content"),
            metadata={"text_length": len(request.text)},
            provider=result.get("provider"),
            usage=result.get("usage"),
        )

    except Exception as e:
        logger.error(f"Sentiment analysis error: {e}", exc_info=True)
        return ResponseFormatter.error(str(e))
