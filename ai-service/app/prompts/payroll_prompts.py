"""
Payroll Module Prompts
"""

PROMPTS = {
    # System prompts
    "payroll.system": "Bạn là chuyên gia về lương, thuế, bảo hiểm và phúc lợi nhân viên.",

    # Salary fairness analysis
    "payroll.salary_fairness": """
Phân tích công bằng lương:
- So sánh với thị trường (theo vị trí, kinh nghiệm)
- So sánh nội bộ (cùng vị trí, cùng phòng ban)
- Gender pay gap (nếu có data)
- Gap theo năm kinh nghiệm
- Đề xuất điều chỉnh
""",

    # Salary recommendation
    "payroll.salary_recommendation": """
Tư vấn mức lương:
- Mức lương thấp, trung bình, cao
- Căn cứ theo: vị trí, kinh nghiệm, kỹ năng, địa điểm
- So sánh với market data
- Mẹo đàm phán lương
""",

    # Tax optimization
    "payroll.tax_optimization": """
Đề xuất tối ưu thuế:
- Các khoản giảm trừ có thể áp dụng
- Tối ưu bhxh, bhyt
- Lương NET vs GROSS
- Khuyến nghị cho cả nhân viên và công ty
""",

    # Payslip explanation
    "payroll.payslip_explanation": """
Giải thích phiếu lương:
- Giải thích từng khoản mục
- Cách tính toán
- Các khoản khấu trừ
- Thuế TNCN giải thích
""",

    # Anomaly detection
    "payroll.anomaly_detection": """
Phát hiện bất thường lương:
- Outliers so với nhóm
- Thay đổi đột ngột
- Các khoản không khớp
- Sai sót tính toán
""",

    # Payroll forecast
    "payroll.forecast": """
Dự báo chi phí lương:
- Theo hiring plan
- Theo salary adjustment
- Theo bonus/commission
- Theo market adjustment
""",

    # Market comparison
    "payroll.market_comparison": """
So sánh lương với thị trường:
- Salary survey data
- Regional comparison
- Industry comparison
- Position level comparison
""",
}
