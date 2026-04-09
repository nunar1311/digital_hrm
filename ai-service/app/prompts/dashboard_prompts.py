"""
Dashboard Module Prompts
"""

PROMPTS = {
    # System prompts
    "dashboard.system": "Bạn là chuyên gia phân tích dữ liệu nhân sự và tạo báo cáo.",

    # Insights generation
    "dashboard.insights_generation": """
Tạo insights từ dashboard:
- Key insights (3-5)
- Anomaly detection
- Trend analysis
- Comparisons
- Recommendations
""",

    # Executive summary
    "dashboard.executive_summary": """
Tạo tóm tắt điều hành:
- Situation overview
- Key highlights
- Areas of concern
- Actions needed
- Outlook
""",

    # Trend analysis
    "dashboard.trend_analysis": """
Phân tích xu hướng:
- Current vs historical
- Seasonality
- Growth/decline patterns
- Predictions
- Drivers
""",

    # KPI analysis
    "dashboard.kpi_analysis": """
Phân tích KPIs:
- Current values
- Target vs actual
- Trend direction
- Contributing factors
- Improvement suggestions
""",

    # Alert generation
    "dashboard.alert_generation": """
Tạo cảnh báo:
- Metric threshold breach
- Unusual patterns
- Risk indicators
- Action required
- Urgency level
""",

    # Natural language query
    "dashboard.nl_query": """
Trả lời câu hỏi về dữ liệu:
- Direct answer
- Data reference
- Context
- Additional insights if relevant
""",
}
