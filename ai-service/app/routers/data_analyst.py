"""
Data Analyst Router - AI-powered HR Data Analysis
Xu ly cau hoi ngon ngu tu nhien ve du lieu HR,
phan tich intent va goi y bieu do phu hop.
"""

import logging
import json
import re
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

from fastapi import APIRouter, Request

from app.services.provider_router import get_provider_router
from app.services.db_queries import HRDataQueries
from app.prompts.data_analyst_prompts import PROMPTS
from app.utils.response_formatter import ResponseFormatter

logger = logging.getLogger(__name__)
router = APIRouter()


# =====================
# Intent Classification Keywords
# =====================

COMPARISON_KEYWORDS = [
    "so sánh", "nào hơn", "khác nhau", "nhiều hơn", "ít hơn",
    "tỷ lệ", "nhiều nhất", "ít nhất", "cao hơn", "thấp hơn",
    "lớn hơn", "bé hơn", "bằng nhau", "hơn", "kém", "hơn",
    "top", "rank", "xếp hạng", "hạng"
]

TREND_KEYWORDS = [
    "xu hướng", "tăng", "giảm", "bao lâu", "thay đổi",
    "theo thời gian", "theo tháng", "theo quý", "theo năm",
    "đang", "dần", "trend", "từ trước", "giai đoạn",
    "hàng tháng", "hàng quý", "hàng năm", "trước", "sau",
    "so với", "trong khoảng"
]

DISTRIBUTION_KEYWORDS = [
    "cơ cấu", "tỷ trọng", "phần trăm", "chiếm", "bao nhiêu",
    "tỷ lệ", "tổng", "bao gồm", "gồm", "chia", "phân bổ",
    "phân chia", "tất cả", "toàn bộ", "đều", "mỗi"
]

CORRELATION_KEYWORDS = [
    "liên quan", "tương quan", "ảnh hưởng", "kết nối",
    "tác động", "nguyên nhân", "kết quả", "dẫn đến",
    "do đó", "vì thế", "correlate", "relationship"
]


# =====================
# Request/Response Models
# =====================

class DataAnalystQueryRequest(BaseModel):
    """Request for natural language data query"""
    question: str = Field(..., description="Câu hỏi bằng ngôn ngữ tự nhiên")
    language: str = Field(default="vi", description="Ngôn ngữ trả lời")
    include_chart: bool = Field(default=True, description="Có bao gồm chart data không")
    intent_only: bool = Field(default=False, description="Chỉ phân tích intent, không thực thi full query")


class ChartDataPoint(BaseModel):
    """Single data point for chart"""
    label: Optional[str] = None
    name: Optional[str] = None
    value: float
    x: Optional[float] = None
    y: Optional[float] = None
    percent: Optional[float] = None


class MetricItem(BaseModel):
    """Metric item"""
    label: str
    value: Any
    unit: Optional[str] = None
    change: Optional[float] = None
    change_direction: Optional[str] = None


class InsightItem(BaseModel):
    """Insight item"""
    title: str
    description: str
    severity: str = "medium"
    metric: Optional[str] = None
    recommendation: Optional[str] = None


class DataAnalystQueryResponse(BaseModel):
    """Response for data analyst query"""
    success: bool
    answer: Optional[str] = None
    chart_type: Optional[str] = None
    chart_data: Optional[List[Dict[str, Any]]] = None
    chart_title: Optional[str] = None
    x_axis: Optional[str] = None
    y_axis: Optional[str] = None
    metrics: Optional[List[Dict[str, Any]]] = None
    insights: Optional[List[Dict[str, Any]]] = None
    intent: Optional[str] = None
    confidence: Optional[float] = None
    data_sources: Optional[List[str]] = None
    error: Optional[str] = None


class ChartRecommendRequest(BaseModel):
    """Request for chart recommendation"""
    question: str = Field(..., description="Câu hỏi cần phân tích")
    data_preview: Optional[Dict[str, Any]] = Field(None, description="Preview data nếu có")


class ChartRecommendResponse(BaseModel):
    """Response for chart recommendation"""
    success: bool
    chart_type: str
    title: str
    x_axis: str
    y_axis: str
    reasoning: str
    confidence: float


# =====================
# Intent Analysis Functions
# =====================

def analyze_intent(question: str) -> Dict[str, Any]:
    """
    Phan tich intent cua cau hoi su dung keyword matching + AI.
    """
    question_lower = question.lower()

    # Count keyword matches
    comparison_count = sum(1 for kw in COMPARISON_KEYWORDS if kw in question_lower)
    trend_count = sum(1 for kw in TREND_KEYWORDS if kw in question_lower)
    distribution_count = sum(1 for kw in DISTRIBUTION_KEYWORDS if kw in question_lower)
    correlation_count = sum(1 for kw in CORRELATION_KEYWORDS if kw in question_lower)

    counts = {
        "COMPARISON": comparison_count,
        "TREND": trend_count,
        "DISTRIBUTION": distribution_count,
        "CORRELATION": correlation_count
    }

    # Determine primary intent
    max_count = max(counts.values())

    if max_count == 0:
        intent = "GENERAL"
        chart_type = "none"
    else:
        # Ưu tiên DISTRIBUTION cho "tỷ lệ" vì đây là câu hỏi về cơ cấu
        has_ty_le = "tỷ lệ" in question_lower or "phần trăm" in question_lower or "%" in question_lower
        
        if has_ty_le and distribution_count > 0:
            intent = "DISTRIBUTION"
            chart_type = "pie"
        else:
            # Get the intent with highest count
            intent = max(counts, key=counts.get)
            chart_map = {
                "COMPARISON": "bar",
                "TREND": "line",
                "DISTRIBUTION": "pie",
                "CORRELATION": "scatter",
                "GENERAL": "none"
            }
            chart_type = chart_map.get(intent, "none")

    # Calculate confidence based on keyword density
    total_keywords = len(question.split())
    confidence = min(max_count / max(total_keywords * 0.1, 1), 1.0)

    # Boost confidence if we have strong keyword matches
    if max_count >= 2:
        confidence = min(confidence + 0.2, 1.0)

    return {
        "intent": intent,
        "chart_type": chart_type,
        "confidence": round(confidence, 2),
        "reasoning": f"Kết quả phân tích từ khóa: {intent} (confidence={confidence:.2f})",
        "keyword_counts": counts
    }


def format_chart_data(data: List[Dict[str, Any]], chart_type: str) -> List[Dict[str, Any]]:
    """
    Format data for chart rendering.
    """
    if chart_type == "bar":
        # For bar charts, extract label/value pairs
        result = []
        for item in data:
            if isinstance(item, dict):
                # Try to find label/name and value
                label = item.get("label") or item.get("name") or item.get("department") or item.get("category") or str(item)
                value = item.get("value") or item.get("count") or item.get("total") or item.get("y") or 0
                result.append({"label": str(label), "value": float(value)})
            elif isinstance(item, (int, float)):
                result.append({"label": str(len(result) + 1), "value": float(item)})
        return result

    elif chart_type == "line":
        # For line charts, extract time series data
        result = []
        for item in data:
            if isinstance(item, dict):
                label = item.get("label") or item.get("month") or item.get("date") or item.get("period") or str(item)
                value = item.get("value") or item.get("count") or item.get("total") or 0
                result.append({"label": str(label), "value": float(value)})
            elif isinstance(item, (int, float)):
                result.append({"label": str(len(result) + 1), "value": float(item)})
        return result

    elif chart_type == "pie":
        # For pie charts, calculate percentages
        result = []
        total = sum(
            float(item.get("value") or item.get("count") or item.get("total") or 0)
            for item in data if isinstance(item, dict)
        ) or sum(float(x) for x in data if isinstance(x, (int, float))) or 1

        for item in data:
            if isinstance(item, dict):
                # Support multiple field name formats for pie charts
                name = (
                    item.get("name") or
                    item.get("label") or
                    item.get("category") or
                    item.get("leave_type") or  # leave data format
                    item.get("department") or   # department data format
                    item.get("gender") or        # gender data format
                    item.get("employment_type") or  # employment type format
                    item.get("status") or        # status format
                    item.get("stage") or         # recruitment stage format
                    str(item)
                )
                value = float(
                    item.get("value") or
                    item.get("count") or
                    item.get("total") or
                    item.get("total_days") or  # leave usage format
                    item.get("remaining") or
                    0
                )
                percent = round((value / total) * 100, 1) if total > 0 else 0
                result.append({"name": str(name), "value": value, "percent": percent})
            elif isinstance(item, (int, float)):
                name = str(len(result) + 1)
                value = float(item)
                percent = round((value / total) * 100, 1) if total > 0 else 0
                result.append({"name": name, "value": value, "percent": percent})
        return result

    elif chart_type == "scatter":
        # For scatter plots, extract x/y pairs
        result = []
        for item in data:
            if isinstance(item, dict):
                x = float(item.get("x") or item.get("ot_hours") or item.get("hours") or 0)
                y = float(item.get("y") or item.get("performance") or item.get("value") or 0)
                label = item.get("label") or item.get("name") or item.get("employee_name") or ""
                result.append({"x": x, "y": y, "label": str(label)})
        return result

    return data


def extract_metrics_from_data(data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Extract key metrics from HR data snapshot.
    """
    metrics = []

    # Employee metrics
    if "employees" in data and data["employees"]:
        emp = data["employees"]
        if "total_employees" in emp:
            metrics.append({
                "label": "Tổng nhân viên",
                "value": emp["total_employees"],
                "unit": "người"
            })
        if "new_hires_last_30_days" in emp:
            metrics.append({
                "label": "Tuyển mới (30 ngày)",
                "value": emp["new_hires_last_30_days"],
                "unit": "người"
            })
        if "resignations_last_30_days" in emp:
            metrics.append({
                "label": "Nghỉ việc (30 ngày)",
                "value": emp["resignations_last_30_days"],
                "unit": "người"
            })

    # Attendance metrics
    if "attendance" in data and data["attendance"]:
        att = data["attendance"]
        if "summary" in att and att["summary"]:
            s = att["summary"]
            if "total_late_days" in s:
                metrics.append({
                    "label": "Tổng ngày đi muộn",
                    "value": int(s["total_late_days"] or 0),
                    "unit": "ngày"
                })
            if "total_ot_hours" in s:
                metrics.append({
                    "label": "Tổng giờ OT",
                    "value": float(s["total_ot_hours"] or 0),
                    "unit": "giờ"
                })

    # Leave metrics
    if "leave" in data and data["leave"]:
        leave = data["leave"]
        if "pending_requests_count" in leave:
            metrics.append({
                "label": "Đơn nghỉ chờ duyệt",
                "value": leave["pending_requests_count"],
                "unit": "đơn"
            })

    # Payroll metrics
    if "payroll" in data and data["payroll"]:
        pay = data["payroll"]
        if "average_base_salary" in pay:
            metrics.append({
                "label": "Lương TB",
                "value": int(pay["average_base_salary"] or 0),
                "unit": "VND"
            })

    # Recruitment metrics
    if "recruitment" in data and data["recruitment"]:
        rec = data["recruitment"]
        if "total_candidates" in rec:
            metrics.append({
                "label": "Tổng ứng viên",
                "value": rec["total_candidates"],
                "unit": "người"
            })
        if "hired_count" in rec:
            metrics.append({
                "label": "Đã tuyển",
                "value": rec["hired_count"],
                "unit": "người"
            })

    return metrics[:10]  # Limit to 10 metrics


def _auto_extract_chart_data(
    hr_data: Dict[str, Any],
    chart_type: str,
    question: str = ""
) -> List[Dict[str, Any]]:
    """
    Auto-extract chart data from HR data when AI doesn't provide chart_data.
    Fallback mechanism to ensure charts are always displayed.
    """
    result = []
    question_lower = question.lower()

    # === PIE CHART: Extract distribution data ===
    if chart_type == "pie":
        # Priority order for pie chart sources
        pie_sources = [
            # 1. Leave type usage (most common for "tỷ lệ" questions)
            ("leave", "leave_type_usage"),
            # 2. Leave by status
            ("leave", "leave_by_status"),
            # 3. Employee gender distribution
            ("employees", "gender_distribution"),
            # 4. Employee department distribution
            ("employees", "department_distribution"),
            # 5. Employment type distribution
            ("employees", "employment_type_distribution"),
            # 6. Recruitment candidates by stage
            ("recruitment", "candidates_by_stage"),
            # 7. Recruitment jobs by status
            ("recruitment", "jobs_by_status"),
            # 8. Contracts by status
            ("contracts", "contracts_by_status"),
            # 9. Salary by department
            ("payroll", "salary_by_department"),
        ]

        # Check for leave-related questions first
        is_leave_query = any(k in question_lower for k in [
            "tỷ lệ", "phép", "nghỉ", "leave", "ty le"
        ])

        if is_leave_query:
            # Try leave data first
            if "leave" in hr_data and hr_data["leave"]:
                leave = hr_data["leave"]
                # Try leave_type_usage
                if "leave_type_usage" in leave and leave["leave_type_usage"]:
                    items = leave["leave_type_usage"]
                    total = sum(float(i.get("count", 0)) for i in items)
                    for item in items:
                        count = float(item.get("count", 0))
                        result.append({
                            "name": item.get("leave_type", item.get("name", "Unknown")),
                            "value": count,
                            "percent": round((count / total * 100), 1) if total > 0 else 0
                        })
                    if result:
                        return result

                # Try leave_by_status
                if "leave_by_status" in leave and leave["leave_by_status"]:
                    items = leave["leave_by_status"]
                    total = sum(float(i.get("count", 0)) for i in items)
                    for item in items:
                        count = float(item.get("count", 0))
                        result.append({
                            "name": item.get("status", item.get("name", "Unknown")),
                            "value": count,
                            "percent": round((count / total * 100), 1) if total > 0 else 0
                        })
                    if result:
                        return result

        # Check other sources
        for section, key in pie_sources:
            if section in hr_data and hr_data[section] and key in hr_data[section]:
                items = hr_data[section][key]
                if items and isinstance(items, list) and len(items) > 0:
                    # Calculate total
                    total = 0
                    for item in items:
                        val = float(
                            item.get("count", 0) or
                            item.get("value", 0) or
                            item.get("total", 0) or
                            item.get("avg_salary", 0)
                        )
                        total += val

                    if total > 0:
                        for item in items:
                            val = float(
                                item.get("count", 0) or
                                item.get("value", 0) or
                                item.get("total", 0) or
                                item.get("avg_salary", 0)
                            )
                            # Find name field
                            name = (
                                item.get("leave_type") or
                                item.get("status") or
                                item.get("gender") or
                                item.get("department") or
                                item.get("stage") or
                                item.get("name") or
                                item.get("label") or
                                str(item)
                            )
                            result.append({
                                "name": str(name),
                                "value": val,
                                "percent": round((val / total * 100), 1)
                            })
                        break  # Got data, exit

        return result

    # === BAR CHART: Extract comparison data ===
    elif chart_type == "bar":
        bar_sources = [
            ("employees", "department_distribution"),
            ("payroll", "salary_by_department"),
            ("attendance", "top_late_employees"),
            ("recruitment", "candidates_by_stage"),
        ]

        for section, key in bar_sources:
            if section in hr_data and hr_data[section] and key in hr_data[section]:
                items = hr_data[section][key]
                if items and isinstance(items, list) and len(items) > 0:
                    for item in items:
                        label = (
                            item.get("department") or
                            item.get("name") or
                            item.get("stage") or
                            item.get("label") or
                            str(item)
                        )
                        value = float(
                            item.get("count", 0) or
                            item.get("avg_salary", 0) or
                            item.get("lateDays", 0) or
                            item.get("value", 0) or
                            0
                        )
                        result.append({"label": str(label), "value": value})
                    break

        return result

    # === LINE CHART: Extract trend data ===
    elif chart_type == "line":
        # For trends, we need time-series data
        # Currently not implemented as we don't have historical trend data
        pass

    # === SCATTER CHART: Extract correlation data ===
    elif chart_type == "scatter":
        # Scatter plots need x/y pairs - typically for attendance vs performance
        pass

    return result


# =====================
# API Endpoints
# =====================

@router.post("/query", response_model=DataAnalystQueryResponse)
async def query_data_analyst(request: DataAnalystQueryRequest):
    """
    Natural Language Query - Tra loi cau hoi ve du lieu HR

    Xu ly:
    1. Phan tich intent cua cau hoi
    2. Lay du lieu tu database theo keywords (neu khong phai intent_only)
    3. Tao cau tra loi voi so lieu cu the
    4. Go i y bieu do neu phu hop

    Neu request.intent_only = True:
    - Chi phan tich intent, khong goi AI tao cau tra loi day du
    - Tra ve nhanh de frontend co the quyet dinh routing
    """
    try:
        question = request.question.strip()
        if not question:
            return DataAnalystQueryResponse(
                success=False,
                error="Câu hỏi không được để trống"
            )

        # Step 1: Analyze intent (keyword-based + lightweight AI)
        intent_result = analyze_intent(question)

        # === INTENT-ONLY MODE: Fast classification for frontend routing ===
        if request.intent_only:
            # Try lightweight AI analysis for better intent detection
            try:
                provider_router = get_provider_router()
                ai_result = await provider_router.chat(
                    [
                        {"role": "system", "content": PROMPTS["data_analyst.intent_classification"].format(question=question)},
                        {"role": "user", "content": f"Câu hỏi: {question}\n\nXác định intent và loại biểu đồ phù hợp nhất."}
                    ],
                    temperature=0.1
                )

                if ai_result.get("success") and ai_result.get("content"):
                    content = ai_result.get("content", "")
                    # Try parse AI response
                    try:
                        json_start = content.find("{")
                        json_end = content.rfind("}") + 1
                        if json_start != -1 and json_end > json_start:
                            parsed = json.loads(content[json_start:json_end])
                            if parsed.get("intent"):
                                intent_result["intent"] = parsed["intent"]
                                intent_result["chart_type"] = parsed.get("chart_type", intent_result["chart_type"])
                                intent_result["confidence"] = parsed.get("confidence", intent_result["confidence"])
                                intent_result["reasoning"] = parsed.get("reasoning", intent_result["reasoning"])
                    except:
                        pass
            except Exception as e:
                logger.warning(f"Intent-only AI analysis failed, using keyword fallback: {e}")

            return DataAnalystQueryResponse(
                success=True,
                answer=f"Intent detected: {intent_result['intent']} (confidence: {intent_result['confidence']})",
                chart_type=intent_result["chart_type"],
                intent=intent_result["intent"],
                confidence=intent_result["confidence"],
            )

        # === FULL QUERY MODE: Complete data analyst flow ===
        # Step 2: Get relevant data from DB
        try:
            hr_data = await HRDataQueries.search_data_for_query(question)
            logger.info(f"DB data keys: {list(hr_data.keys()) if hr_data else 'empty'}")
            if "leave" in hr_data:
                logger.info(f"Leave data: {json.dumps(hr_data.get('leave', {}), default=str)[:500]}")
        except Exception as db_err:
            logger.warning(f"DB query error: {db_err}")
            hr_data = {}

        # Step 3: Build the prompt
        data_summary = json.dumps(hr_data, ensure_ascii=False, indent=2, default=str)
        system_prompt = PROMPTS["data_analyst.system"]
        user_prompt = f"""Câu hỏi: {question}

Dữ liệu HR hiện có:
{data_summary if data_summary != "{}" else "Không có dữ liệu cụ thể cho câu hỏi này."}

Hãy phân tích câu hỏi và quyết định:
1. Câu hỏi này CÓ NÊN tạo biểu đồ không? (Trả lời: CÓ nếu cần so sánh, xu hướng, hoặc hiển thị nhiều giá trị)
2. Nếu CÓ → chọn loại biểu đồ phù hợp và trích xuất dữ liệu
3. Nếu KHÔNG → chỉ trả lời bằng text

QUYẾT ĐỊNH CỦA BẠN:
- Nếu câu hỏi chứa: "bao nhiêu", "tỷ lệ", "so sánh", "theo tháng", "phân bổ", "tỉ lệ xin nghỉ", "loại nghỉ nào" → CÓ tạo chart
- Nếu chỉ hỏi 1-2 con số đơn giản → KHÔNG cần chart

Định dạng trả lời JSON (BẮT BUỘC):
{{
  "answer": "Câu trả lời bằng tiếng Việt, có số liệu cụ thể",
  "chart_type": "bar|line|pie|scatter|none",
  "chart_data": [{{"name": "...", "value": số}}],  // CHO PIE: dùng "name" và "value"
  "chart_data": [{{"label": "...", "value": số}}], // CHO BAR/LINE: dùng "label" và "value"
  "chart_title": "Tiêu đề biểu đồ",
  "x_axis": "Nhãn trục X",
  "y_axis": "Nhãn trục Y",
  "metrics": [{{"label": "...", "value": ..., "unit": "..."}}],
  "insights": [{{"title": "...", "description": "...", "severity": "medium"}}]
}}

QUAN TRỌNG - ĐỌC KỸ:
1. Giao tiếp thông minh, KHÔNG ĐƯỢC NÓI thuật ngữ khó hiểu hay giải thích rườm rà. Trao đổi như 1 người nhân sự thân thiện. Viết tóm tắt, RÕ RÀNG, format xuống dòng/in đậm đẹp mắt và DỄ HIỂU cho nhân viên.
2. Nếu chart_type = "pie" → chart_data PHẢI là: [{{"name": "Tên loại", "value": số, "percent": số}}]
   Ví dụ: [{{"name": "Nghỉ phép thường niên", "value": 25, "percent": 50}}, {{"name": "Nghỉ ốm", "value": 15, "percent": 30}}]
3. Nếu chart_type = "bar" hoặc "line" → chart_data PHẢI là: [{{"label": "Nhãn", "value": số}}]
4. Nếu chart_type = "none" → KHÔNG cần chart_data
5. LUÔN LUÔN trả về JSON đầy đủ, không được bỏ qua chart_data nếu câu hỏi cần biểu đồ
6. Dữ liệu phải được trích xuất TỪ DỮ LIỆU HR đã cung cấp ở trên"""

        # Step 4: Call AI
        provider_router = get_provider_router()
        result = await provider_router.chat(
            [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3
        )

        if not result.get("success"):
            return DataAnalystQueryResponse(
                success=False,
                error=result.get("error", "Có lỗi xảy ra. Thử lại sau nhé."),
                intent=intent_result["intent"],
                confidence=intent_result["confidence"]
            )

        # Step 5: Parse response
        content = result.get("content", "")
        parsed_data = None

        # Try to extract JSON from response
        try:
            # Find JSON block
            json_start = content.find("{")
            json_end = content.rfind("}") + 1
            if json_start != -1 and json_end > json_start:
                json_str = content[json_start:json_end]
                parsed_data = json.loads(json_str)
        except (json.JSONDecodeError, ValueError) as e:
            logger.warning(f"Failed to parse JSON from AI response: {e}")
            parsed_data = None

        # Step 6: Format and return response
        if parsed_data:
            chart_data_raw = parsed_data.get("chart_data")
            chart_type = parsed_data.get("chart_type", intent_result["intent"])

            # Format chart data
            chart_data = None
            if chart_type and chart_type != "none" and chart_data_raw and request.include_chart:
                if isinstance(chart_data_raw, list) and len(chart_data_raw) > 0:
                    chart_data = format_chart_data(chart_data_raw, chart_type)
                    # Nếu sau khi format mà không có data thì không hiển thị chart
                    if not chart_data or len(chart_data) == 0:
                        chart_type = "none"
                        chart_data = None

            # Nếu AI không trả chart_type hoặc trả "none", dùng intent analysis
            if not parsed_data.get("chart_type"):
                chart_type = intent_result["chart_type"]

            # FALLBACK: Nếu intent là DISTRIBUTION/COMPARISON nhưng AI không trả chart_data,
            # tự động extract từ hr_data
            if chart_type and chart_type != "none" and (not chart_data or len(chart_data) == 0):
                chart_data = _auto_extract_chart_data(hr_data, chart_type, question)
                if chart_data and len(chart_data) > 0:
                    logger.info(f"Auto-extracted {len(chart_data)} chart data points for {chart_type}: {chart_data[:3]}")

            logger.info(f"Final chart_type={chart_type}, chart_data_len={len(chart_data) if chart_data else 0}")

            return DataAnalystQueryResponse(
                success=True,
                answer=parsed_data.get("answer", content[:500]),
                chart_type=chart_type,
                chart_data=chart_data,
                chart_title=parsed_data.get("chart_title") if chart_type and chart_type != "none" else None,
                x_axis=parsed_data.get("x_axis") if chart_type and chart_type != "none" else None,
                y_axis=parsed_data.get("y_axis") if chart_type and chart_type != "none" else None,
                metrics=parsed_data.get("metrics", extract_metrics_from_data(hr_data)),
                insights=parsed_data.get("insights"),
                intent=intent_result["intent"],
                confidence=intent_result["confidence"],
                data_sources=list(k for k, v in hr_data.items() if v and k != "generated_at")
            )
        else:
            # Fallback: return raw content, try to extract chart data from hr_data
            chart_type = intent_result["chart_type"]
            chart_data = None
            if chart_type and chart_type != "none":
                chart_data = _auto_extract_chart_data(hr_data, chart_type, question)

            return DataAnalystQueryResponse(
                success=True,
                answer=content[:2000],
                chart_type=chart_type,
                chart_data=chart_data,
                metrics=extract_metrics_from_data(hr_data),
                intent=intent_result["intent"],
                confidence=intent_result["confidence"],
                data_sources=list(k for k, v in hr_data.items() if v and k != "generated_at")
            )

    except Exception:
        logger.error(f"Data analyst query error", exc_info=True)
        return DataAnalystQueryResponse(
            success=False,
            error="Có lỗi khi phân tích dữ liệu. Thử lại sau nhé."
        )


@router.post("/chart-recommend", response_model=ChartRecommendResponse)
async def recommend_chart(request: ChartRecommendRequest):
    """
    Chart Recommendation - Go i y loai bieu do phu hop cho cau hoi

    Dung de hien thi truoc khi nguoi dung gui cau hoi,
    hoac de xac dinh loai bieu do can hien thi.
    """
    try:
        question = request.question.strip()

        # Step 1: Analyze intent
        intent_result = analyze_intent(question)

        # Step 2: Generate chart title and axis labels
        provider_router = get_provider_router()

        title_prompt = f"""Từ câu hỏi: "{question}"
Và loại biểu đồ: {intent_result['chart_type']}

Hãy đề xuất:
1. Tiêu đề biểu đồ ngắn gọn (dưới 50 ký tự)
2. Nhãn trục X
3. Nhãn trục Y
4. Giải thích tại sao chọn loại biểu đồ này

Trả lời JSON:
{{
  "title": "Tiêu đề biểu đồ",
  "x_axis": "Nhãn X",
  "y_axis": "Nhãn Y",
  "reasoning": "Giải thích"
}}"""

        result = await provider_router.chat(
            [
                {"role": "system", "content": "Bạn là chuyên gia thiết kế biểu đồ. Trả lời bằng JSON."},
                {"role": "user", "content": title_prompt}
            ],
            temperature=0.3
        )

        content = result.get("content", "")
        parsed = None

        try:
            json_start = content.find("{")
            json_end = content.rfind("}") + 1
            if json_start != -1 and json_end > json_start:
                parsed = json.loads(content[json_start:json_end])
        except:
            pass

        return ChartRecommendResponse(
            success=True,
            chart_type=intent_result["chart_type"],
            title=parsed.get("title", f"Biểu đồ {intent_result['chart_type']}") if parsed else f"Biểu đồ {intent_result['chart_type']}",
            x_axis=parsed.get("x_axis", "Giá trị") if parsed else "Giá trị",
            y_axis=parsed.get("y_axis", "Số lượng") if parsed else "Số lượng",
            reasoning=parsed.get("reasoning", intent_result["reasoning"]) if parsed else intent_result["reasoning"],
            confidence=intent_result["confidence"]
        )

    except Exception as e:
        logger.error(f"Chart recommend error: {e}", exc_info=True)
        return ChartRecommendResponse(
            success=False,
            chart_type="none",
            title="",
            x_axis="",
            y_axis="",
            reasoning=str(e),
            confidence=0.0
        )


@router.post("/insights", response_model=DataAnalystQueryResponse)
async def get_deep_insights(request: DataAnalystQueryRequest):
    """
    Deep Insights - Phan tich chuyen sac va tra ve insights

    Chi tiết hon query thong thuong,
    tap trung vao insights, anomaly detection, va recommendations.
    """
    try:
        question = request.question.strip()

        # Get full HR data
        try:
            hr_data = await HRDataQueries.get_full_hr_snapshot()
        except Exception as db_err:
            logger.warning(f"DB error: {db_err}")
            hr_data = {}

        # Build deep analysis prompt
        system_prompt = PROMPTS["data_analyst.system"]
        data_str = json.dumps(hr_data, ensure_ascii=False, indent=2, default=str)

        user_prompt = f"""Câu hỏi: {question}

Dữ liệu HR đầy đủ:
{data_str}

Hãy phân tích chuyên sâu và trả về:
1. Câu trả lời trực tiếp
2. 3-5 insights nổi bật với metrics cụ thể
3. Các bất thường (anomalies) nếu có
4. Khuyến nghị hành động

Định dạng JSON:
{{
  "answer": "Câu trả lời",
  "insights": [
    {{
      "title": "Tiêu đề insight",
      "description": "Mô tả chi tiết với số liệu",
      "severity": "high|medium|low",
      "metric": "Giá trị metric",
      "recommendation": "Hành động đề xuất"
    }}
  ],
  "anomalies": [
    {{
      "description": "Mô tả bất thường",
      "severity": "high|medium|low"
    }}
  ]
}}"""

        provider_router = get_provider_router()
        result = await provider_router.chat(
            [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.4
        )

        if not result.get("success"):
            return DataAnalystQueryResponse(
                success=False,
                error=result.get("error") or "Có lỗi xảy ra. Thử lại sau nhé.",
            )

        content = result.get("content", "")
        parsed_data = None

        try:
            json_start = content.find("{")
            json_end = content.rfind("}") + 1
            if json_start != -1 and json_end > json_start:
                parsed_data = json.loads(content[json_start:json_end])
        except:
            pass

        if parsed_data:
            return DataAnalystQueryResponse(
                success=True,
                answer=parsed_data.get("answer", content[:500]),
                insights=parsed_data.get("insights", []),
                metrics=extract_metrics_from_data(hr_data),
                data_sources=list(k for k, v in hr_data.items() if v and k != "generated_at")
            )
        else:
            return DataAnalystQueryResponse(
                success=True,
                answer=content[:2000],
                metrics=extract_metrics_from_data(hr_data)
            )

    except Exception:
        logger.error(f"Deep insights error", exc_info=True)
        return DataAnalystQueryResponse(
            success=False,
            error="Có lỗi khi lấy insights. Thử lại sau nhé."
        )