"""
Dashboard Router - AI Dashboard insights endpoints
Bao gom Auto-Insights va Auto-Summary tu du lieu thuc
Co phan quyen: Admin roles moi duoc xem dashboard tong quan
"""

import logging
import json
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

from fastapi import APIRouter, Request, Depends

from app.services.provider_router import get_provider_router
from app.utils.response_formatter import ResponseFormatter
from app.services.db_queries import HRDataQueries
from app.middleware.rbac import require_dashboard_access, require_full_access, extract_user_context

logger = logging.getLogger(__name__)
router = APIRouter()


class DashboardInsightsRequest(BaseModel):
    """Dashboard insights request"""
    dashboard_data: Dict[str, Any] = Field(..., description="Dashboard data")
    period: Optional[str] = Field(None, description="Analysis period")
    focus_areas: Optional[List[str]] = Field(None, description="Focus areas")


class DashboardInsightsResponse(BaseModel):
    """Dashboard insights response"""
    success: bool
    insights: Optional[List[Dict[str, Any]]] = None
    summary: Optional[str] = None
    recommendations: Optional[List[str]] = None
    error: Optional[str] = None


@router.post("/insights", response_model=DashboardInsightsResponse)
async def get_dashboard_insights(request: DashboardInsightsRequest):
    """
    Get AI-generated insights from dashboard data

    Provides:
    - Key insights
    - Anomaly detection
    - Trend analysis
    - Recommendations
    """
    try:
        provider_router = get_provider_router()

        focus_str = ", ".join(request.focus_areas) if request.focus_areas else "Tất cả"

        prompt = f"""
PHÂN TÍCH INSIGHTS TỪ DỮ LIỆU DASHBOARD HR

GIAI ĐOẠN: {request.period or 'Hiện tại'}
LĨNH VỰC QUAN TÂM: {focus_str}

DỮ LIỆU DASHBOARD:
{request.dashboard_data}

YÊU CẦU PHÂN TÍCH:
1. INSIGHTS CHÍNH: 3-5 insights quan trọng nhất
2. PHÁT HIỆN BẤT THƯỜNG: Các điểm bất thường cần chú ý
3. XU HƯỚNG: Các xu hướng đáng chú ý
4. SO SÁNH: So sánh với giai đoạn trước (nếu có data)
5. KHUYẾN NGHỊ: Hành động cần thiết

Format: JSON array với cấu trúc:
{{
  "insights": [
    {{"title": "...", "description": "...", "severity": "high/medium/low"}}
  ],
  "summary": "Tóm tắt ngắn",
  "recommendations": ["Khuyến nghị 1", "Khuyến nghị 2"]
}}
"""

        messages = [
            {"role": "system", "content": "Bạn là chuyên gia phân tích dữ liệu HR. Đưa ra insights có giá trị kinh doanh."},
            {"role": "user", "content": prompt},
        ]

        result = await provider_router.chat(messages, temperature=0.3)

        if not result.get("success"):
            return DashboardInsightsResponse(success=False, error=result.get("error") or "Có lỗi xảy ra. Thử lại sau nhé.")

        # Try to parse JSON
        content = result.get("content", "")

        try:
            json_start = content.find("[")
            json_end = content.rfind("]") + 1

            if json_start != -1 and json_end > json_start:
                data = json.loads(content[json_start:json_end])
                return DashboardInsightsResponse(
                    success=True,
                    insights=data if isinstance(data, list) else data.get("insights"),
                    summary=data.get("summary") if isinstance(data, dict) else None,
                    recommendations=data.get("recommendations") if isinstance(data, dict) else None,
                )
        except (json.JSONDecodeError, ValueError):
            pass

        # Try JSON object
        try:
            json_start = content.find("{")
            json_end = content.rfind("}") + 1
            if json_start != -1 and json_end > json_start:
                data = json.loads(content[json_start:json_end])
                return DashboardInsightsResponse(
                    success=True,
                    insights=data.get("insights", []),
                    summary=data.get("summary"),
                    recommendations=data.get("recommendations", []),
                )
        except (json.JSONDecodeError, ValueError):
            pass

        # Fallback
        return DashboardInsightsResponse(
            success=True,
            summary=content,
        )

    except Exception:
        logger.error(f"Dashboard insights error", exc_info=True)
        return DashboardInsightsResponse(success=False, error="Có lỗi xảy ra. Thử lại sau nhé.")


# =====================
# AUTO-INSIGHTS - Tu dong lay data tu DB va phan tich
# =====================

class AutoInsightsRequest(BaseModel):
    """Auto insights request - automatically fetches data from DB"""
    focus_areas: Optional[List[str]] = Field(
        None,
        description="Focus areas: employees, attendance, payroll, leave, recruitment, contracts"
    )
    month: Optional[int] = Field(None, description="Target month")
    year: Optional[int] = Field(None, description="Target year")


@router.post("/auto-insights")
async def get_auto_insights(request: AutoInsightsRequest, raw_request: Request):
    """
    Auto AI Insights - Tự động lấy dữ liệu từ Database và phân tích

    CHỈ DÀNH CHO: SUPER_ADMIN, DIRECTOR, HR_MANAGER
    KHÔNG cần gửi data từ frontend - AI Service tự truy vấn database.

    Trả về:
    - Insights quan trọng từ dữ liệu thực
    - Phát hiện bất thường
    - Khuyến nghị hành động
    """
    # Kiểm tra quyền truy cập dashboard
    require_dashboard_access(raw_request)
    try:
        # Step 1: Fetch data from database
        hr_data = await HRDataQueries.get_full_hr_snapshot()

        if not any(hr_data.values()):
            return ResponseFormatter.error(
                "Không thể truy cập database. Vui lòng kiểm tra cấu hình DATABASE_URL."
            )

        # Step 2: Build analysis prompt
        focus_str = ", ".join(request.focus_areas) if request.focus_areas else "Tất cả lĩnh vực"

        prompt = f"""
PHÂN TÍCH THÔNG MINH DỮ LIỆU HR TỪ DATABASE

LĨNH VỰC PHÂN TÍCH: {focus_str}

DỮ LIỆU THỰC TỪ HỆ THỐNG:
{json.dumps(hr_data, ensure_ascii=False, indent=2, default=str)}

YÊU CẦU:
Hãy phân tích DỮ LIỆU THỰC ở trên và trả về JSON với cấu trúc:
{{
  "insights": [
    {{
      "title": "Tiêu đề insight ngắn gọn",
      "description": "Mô tả chi tiết với số liệu cụ thể",
      "severity": "high/medium/low",
      "category": "employees/attendance/payroll/leave/recruitment/contracts"
    }}
  ],
  "summary": "Tóm tắt tổng quan tình hình HR trong 3-5 câu, với số liệu cụ thể",
  "recommendations": [
    "Khuyến nghị hành động cụ thể 1",
    "Khuyến nghị hành động cụ thể 2"
  ],
  "health_score": 85
}}

LƯU Ý:
- Sử dụng SỐ LIỆU CHÍNH XÁC từ dữ liệu
- Đưa ra ít nhất 3-5 insights
- Mỗi insight phải có số liệu cụ thể
- health_score từ 0-100 đánh giá sức khỏe tổ chức
- Trả lời bằng tiếng Việt
"""

        # Step 3: Call AI
        provider_router = get_provider_router()
        result = await provider_router.chat(
            [
                {"role": "system", "content": "Bạn là chuyên gia phân tích dữ liệu HR cấp cao. Phân tích dữ liệu thực và đưa ra insights có giá trị kinh doanh. Luôn trả lời bằng JSON."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
        )

        if not result.get("success"):
            return ResponseFormatter.error(result.get("error", "AI analysis failed"))

        # Step 4: Parse response
        content = result.get("content", "")
        parsed_data = None

        try:
            # Extract JSON from response
            json_start = content.find("{")
            json_end = content.rfind("}") + 1
            if json_start != -1 and json_end > json_start:
                parsed_data = json.loads(content[json_start:json_end])
        except (json.JSONDecodeError, ValueError):
            pass

        if parsed_data:
            return {
                "success": True,
                "insights": parsed_data.get("insights", []),
                "summary": parsed_data.get("summary", ""),
                "recommendations": parsed_data.get("recommendations", []),
                "health_score": parsed_data.get("health_score"),
                "data_snapshot": {
                    "total_employees": hr_data.get("employees", {}).get("total_employees") if hr_data.get("employees") else None,
                    "generated_at": hr_data.get("generated_at"),
                },
                "provider": result.get("provider"),
                "usage": result.get("usage"),
            }
        else:
            return {
                "success": True,
                "summary": content,
                "insights": [],
                "recommendations": [],
                "provider": result.get("provider"),
                "usage": result.get("usage"),
            }

    except Exception as e:
        logger.error(f"Auto insights error: {e}", exc_info=True)
        return ResponseFormatter.error(str(e))


# =====================
# AUTO-SUMMARY - Tom tat dieu hanh tu dong
# =====================

class AutoSummaryRequest(BaseModel):
    """Auto summary request"""
    language: str = Field("vi", description="Response language")
    detail_level: str = Field("standard", description="Detail level: brief, standard, detailed")


@router.post("/auto-summary")
async def get_auto_summary(request: AutoSummaryRequest, raw_request: Request):
    """
    Auto Executive Summary - Tạo tóm tắt điều hành tự động từ dữ liệu thực

    CHỈ DÀNH CHO: SUPER_ADMIN, DIRECTOR, HR_MANAGER
    Dùng cho:
    - Báo cáo cho Ban Giám đốc
    - Review tình hình HR hàng tháng
    - Slide thuyết trình
    """
    # Kiểm tra quyền truy cập dashboard
    require_dashboard_access(raw_request)
    try:
        # Fetch data
        hr_data = await HRDataQueries.get_full_hr_snapshot()

        if not any(hr_data.values()):
            return ResponseFormatter.error("Không thể truy cập database.")

        detail_instructions = {
            "brief": "Viết tóm tắt ngắn gọn trong 3-5 câu.",
            "standard": "Viết tóm tắt vừa phải, bao gồm các điểm quan trọng nhất, khoảng 200-300 từ.",
            "detailed": "Viết tóm tắt chi tiết, phân tích sâu từng lĩnh vực, khoảng 500-800 từ.",
        }

        language_note = "Viết bằng tiếng Việt." if request.language == "vi" else "Write in English."

        prompt = f"""
TẠO TÓM TẮT ĐIỀU HÀNH TỰ ĐỘNG TỪ DỮ LIỆU HR

{detail_instructions.get(request.detail_level, detail_instructions['standard'])}
{language_note}

DỮ LIỆU THỰC TỪ HỆ THỐNG:
{json.dumps(hr_data, ensure_ascii=False, indent=2, default=str)}

FORMAT:
1. TỔNG QUAN: Tình hình nhân sự tổng thể
2. ĐIỂM NỔI BẬT: Điều gì đáng chú ý nhất?
3. CẢNH BÁO: Rủi ro hoặc vấn đề cần lưu ý
4. KHUYẾN NGHỊ: Hành động cần thực hiện

Sử dụng SỐ LIỆU CỤ THỂ từ dữ liệu được cung cấp.
"""

        provider_router = get_provider_router()
        result = await provider_router.chat(
            [
                {"role": "system", "content": "Bạn là chuyên gia HR viết báo cáo điều hành chuyên nghiệp, rõ ràng, súc tích."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.4,
        )

        if not result.get("success"):
            return ResponseFormatter.error(result.get("error", "AI analysis failed"))

        return ResponseFormatter.success(
            content=result.get("content"),
            metadata={
                "detail_level": request.detail_level,
                "data_sources": list(k for k, v in hr_data.items() if v and k != "generated_at"),
            },
            provider=result.get("provider"),
            usage=result.get("usage"),
        )

    except Exception as e:
        logger.error(f"Auto summary error: {e}", exc_info=True)
        return ResponseFormatter.error(str(e))


# =====================
# WORKFORCE ANALYSIS - Phan tich luc luong lao dong
# =====================

@router.post("/workforce-analysis")
async def workforce_analysis(raw_request: Request):
    """
    Workforce Analysis - Phân tích toàn diện lực lượng lao động từ database

    CHỈ DÀNH CHO: Admin roles có quyền full access
    Bao gồm:
    - Cơ cấu nhân sự theo phòng ban, giới tính, loại hợp đồng
    - Biến động nhân sự: tuyển mới, nghỉ việc
    - Phân tích thâm niên, độ tuổi
    - Cảnh báo rủi ro
    """
    # Kiểm tra quyền truy cập full data
    require_full_access(raw_request)
    try:
        # Fetch comprehensive data
        employee_data = await HRDataQueries.get_employee_overview()
        leave_data = await HRDataQueries.get_leave_summary()
        contract_data = await HRDataQueries.get_contract_summary()

        if not employee_data:
            return ResponseFormatter.error("Không thể truy cập database.")

        prompt = f"""
PHÂN TÍCH TOÀN DIỆN LỰC LƯỢNG LAO ĐỘNG

DỮ LIỆU NHÂN SỰ:
{json.dumps(employee_data, ensure_ascii=False, indent=2, default=str)}

DỮ LIỆU NGHỈ PHÉP:
{json.dumps(leave_data, ensure_ascii=False, indent=2, default=str) if leave_data else 'Không có dữ liệu'}

DỮ LIỆU HỢP ĐỒNG:
{json.dumps(contract_data, ensure_ascii=False, indent=2, default=str) if contract_data else 'Không có dữ liệu'}

YÊU CẦU PHÂN TÍCH:
1. CƠ CẤU NHÂN SỰ: Phân tích cấu trúc theo phòng ban, giới tính, loại hợp đồng
2. BIẾN ĐỘNG: Tuyển mới vs nghỉ việc, tỷ lệ turnover
3. THÂM NIÊN & ĐỘ TUỔI: Phân tích demographics
4. RỦI RO: Các vấn đề cần lưu ý (hợp đồng hết hạn, turnover cao, v.v.)
5. KHUYẾN NGHỊ: Đề xuất cải thiện

Trả lời bằng tiếng Việt, chi tiết với số liệu cụ thể.
"""

        provider_router = get_provider_router()
        result = await provider_router.chat(
            [
                {"role": "system", "content": "Bạn là chuyên gia phân tích nhân sự (People Analytics). Phân tích sâu dữ liệu workforce."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
        )

        return ResponseFormatter.success(
            content=result.get("content"),
            metadata={
                "type": "workforce_analysis",
                "total_employees": employee_data.get("total_employees"),
            },
            provider=result.get("provider"),
            usage=result.get("usage"),
        )

    except Exception as e:
        logger.error(f"Workforce analysis error: {e}", exc_info=True)
        return ResponseFormatter.error(str(e))


# =====================
# EXISTING ENDPOINTS (kept as-is)
# =====================

class DashboardSummaryRequest(BaseModel):
    """Dashboard summary request"""
    metrics: Dict[str, Any] = Field(..., description="Dashboard metrics")
    period: str = Field(..., description="Report period")


@router.post("/summary")
async def generate_dashboard_summary(request: DashboardSummaryRequest):
    """
    Generate natural language summary from dashboard metrics

    Creates:
    - Executive summary
    - Key highlights
    - Areas of concern
    """
    try:
        provider_router = get_provider_router()

        prompt = f"""
TẠO TÓM TẮT ĐIỀU HÀNH TỪ METRICS DASHBOARD

GIAI ĐOẠN: {request.period}

METRICS:
{request.metrics}

YÊU CẦU:
1. TÓM TẮT NGẮN: 3-5 câu tổng quan tình hình
2. ĐIỂM SÁNG: Những gì đang hoạt động tốt
3. ĐIỂM CẦN CHÚ Ý: Những gì cần theo dõi
4. SO SÁNH: So với mục tiêu hoặc giai đoạn trước

Ngôn ngữ: Tiếng Việt, formal nhưng dễ hiểu.
"""

        messages = [
            {"role": "system", "content": "Bạn là chuyên gia phân tích HR metrics. Viết tóm tắt rõ ràng, có chiều sâu."},
            {"role": "user", "content": prompt},
        ]

        result = await provider_router.generate(prompt=prompt)

        return ResponseFormatter.success(
            content=result.get("content"),
            metadata={
                "type": "dashboard_summary",
                "period": request.period,
            },
            provider=result.get("provider"),
            usage=result.get("usage"),
        )

    except Exception as e:
        logger.error(f"Dashboard summary error: {e}", exc_info=True)
        return ResponseFormatter.error(str(e))


class NaturalLanguageQueryRequest(BaseModel):
    """Natural language query request"""
    query: str = Field(..., description="Natural language query")
    dashboard_data: Optional[Dict[str, Any]] = Field(None, description="Dashboard data context")


@router.post("/query")
async def natural_language_query(request: NaturalLanguageQueryRequest):
    """
    Answer natural language questions about HR data

    Examples:
    - "Tỷ lệ nghỉ việc tháng này là bao nhiêu?"
    - "Phòng ban nào có nhiều nhân viên nhất?"
    - "Xu hướng tuyển dụng 3 tháng gần đây?"
    """
    try:
        provider_router = get_provider_router()

        # Try to enrich with DB data if no dashboard_data provided
        data_context = ""
        if request.dashboard_data:
            data_context = f"""
DỮ LIỆU HIỆN CÓ:
{request.dashboard_data}
"""
        else:
            # Auto-fetch from DB
            try:
                relevant_data = await HRDataQueries.search_data_for_query(request.query)
                if relevant_data:
                    data_context = f"""
DỮ LIỆU THỰC TỪ DATABASE:
{json.dumps(relevant_data, ensure_ascii=False, indent=2, default=str)}
"""
            except Exception as db_err:
                logger.warning(f"Could not auto-fetch DB data: {db_err}")

        prompt = f"""
TRẢ LỜI CÂU HỎI VỀ DỮ LIỆU HR

CÂU HỎI: {request.query}
{data_context}

YÊU CẦU:
1. Trả lời trực tiếp câu hỏi với SỐ LIỆU CỤ THỂ
2. Sử dụng dữ liệu được cung cấp
3. Nếu không có đủ dữ liệu, nói rõ và đề xuất cách lấy thêm
4. Cung cấp context và giải thích nếu cần

Trả lời bằng tiếng Việt.
"""

        messages = [
            {"role": "system", "content": "Bạn là chuyên gia phân tích dữ liệu HR. Trả lời câu hỏi chính xác, hữu ích."},
            {"role": "user", "content": prompt},
        ]

        result = await provider_router.chat(messages, temperature=0.3)

        return ResponseFormatter.success(
            content=result.get("content"),
            metadata={"query": request.query},
            provider=result.get("provider"),
            usage=result.get("usage"),
        )

    except Exception as e:
        logger.error(f"Natural language query error: {e}", exc_info=True)
        return ResponseFormatter.error(str(e))


class AnomalyAlertRequest(BaseModel):
    """Anomaly detection alert request"""
    metrics: Dict[str, Any] = Field(..., description="Current metrics")
    historical_data: Optional[Dict[str, Any]] = Field(None, description="Historical data for comparison")


@router.post("/anomaly-alert")
async def detect_anomalies(request: AnomalyAlertRequest):
    """
    Detect anomalies in HR metrics

    Compares current data with historical patterns
    Alerts on significant deviations
    """
    try:
        provider_router = get_provider_router()

        historical_str = ""
        if request.historical_data:
            historical_str = f"""
DỮ LIỆU LỊCH SỬ (để so sánh):
{request.historical_data}
"""

        prompt = f"""
PHÁT HIỆN BẤT THƯỜNG TRONG DỮ LIỆU HR

DỮ LIỆU HIỆN TẠI:
{request.metrics}
{historical_str}

YÊU CẦU:
1. SO SÁNH với dữ liệu lịch sử để tìm bất thường
2. ĐÁNH DẤU các metrics có thay đổi bất thường (>20% deviation)
3. GIẢI THÍCH tại sao có thể xảy ra
4. CẢNH BÁO mức độ nghiêm trọng (cao/trung bình/thấp)
5. ĐỀ XUẤT hành động cần thiết

"""

        messages = [
            {"role": "system", "content": "Bạn là chuyên gia phân tích dữ liệu và phát hiện bất thường."},
            {"role": "user", "content": prompt},
        ]

        result = await provider_router.generate(prompt=prompt)

        return ResponseFormatter.success(
            content=result.get("content"),
            metadata={"type": "anomaly_detection"},
            provider=result.get("provider"),
            usage=result.get("usage"),
        )

    except Exception as e:
        logger.error(f"Anomaly detection error: {e}", exc_info=True)
        return ResponseFormatter.error(str(e))


class PredictiveAnalyticsRequest(BaseModel):
    """Predictive analytics request"""
    historical_data: Dict[str, Any] = Field(..., description="Historical data for prediction")
    prediction_type: str = Field(..., description="Type: headcount, turnover, payroll, attendance")
    forecast_periods: int = Field(3, description="Number of periods to forecast")


@router.post("/predictive")
async def get_predictive_analytics(request: PredictiveAnalyticsRequest):
    """
    Generate predictive analytics

    Types:
    - headcount: Predict future headcount
    - turnover: Predict turnover rate
    - payroll: Forecast payroll costs
    - attendance: Predict attendance patterns
    """
    try:
        provider_router = get_provider_router()

        type_descriptions = {
            "headcount": "Dự đoán số lượng nhân viên tương lai",
            "turnover": "Dự đoán tỷ lệ nghỉ việc",
            "payroll": "Dự báo chi phí lương",
            "attendance": "Dự đoán mẫu chấm công",
        }

        prompt = f"""
DỰ BÁO {type_descriptions.get(request.prediction_type, request.prediction_type).upper()}

SỐ GIAI ĐOẠN DỰ BÁO: {request.forecast_periods} giai đoạn

DỮ LIỆU LỊCH SỬ:
{request.historical_data}

YÊU CẦU:
1. PHÂN TÍCH xu hướng từ dữ liệu lịch sử
2. ĐƯA RA DỰ BÁO cho {request.forecast_periods} giai đoạn tới
3. CHỈ RA các yếu tố ảnh hưởng đến dự báo
4. ĐÁNH GIÁ độ tin cậy của dự báo
5. CẢNH BÁO nếu có rủi ro

"""

        messages = [
            {"role": "system", "content": "Bạn là chuyên gia phân tích dự báo HR. Đưa ra dự báo có cơ sở."},
            {"role": "user", "content": prompt},
        ]

        result = await provider_router.generate(prompt=prompt)

        return ResponseFormatter.success(
            content=result.get("content"),
            metadata={
                "type": "predictive_analytics",
                "prediction_type": request.prediction_type,
                "forecast_periods": request.forecast_periods,
            },
            provider=result.get("provider"),
            usage=result.get("usage"),
        )

    except Exception as e:
        logger.error(f"Predictive analytics error: {e}", exc_info=True)
        return ResponseFormatter.error(str(e))
