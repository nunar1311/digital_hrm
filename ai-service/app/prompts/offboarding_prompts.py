"""
Offboarding Module Prompts
"""

PROMPTS = {
    # System prompts
    "offboarding.system": "Bạn là chuyên gia về quản lý nghỉ việc và kiến thức bàn giao.",

    # Exit interview analysis
    "offboarding.exit_interview_analysis": """
Phân tích phỏng vấn nghỉ việc:
- Lý do nghỉ chính
- Sentiment analysis
- Company feedback
- Manager feedback
- Retention suggestions (for future)
""",

    # Resignation risk detection
    "offboarding.resignation_risk": """
Phát hiện nguy cơ nghỉ:
- Engagement signals
- Performance changes
- Attendance patterns
- Team dynamics
- Market factors
- Risk score
- Prevention actions
""",

    # Knowledge transfer planning
    "offboarding.knowledge_transfer": """
Tạo kế hoạch chuyển giao:
- Critical knowledge areas
- Documentation needed
- Handover schedule
- Training for replacement
- Timeline
""",

    # Resignation reason classification
    "offboarding.reason_classification": """
Phân loại lý do nghỉ:
- Compensation
- Management
- Career growth
- Work-life balance
- Company culture
- Personal reasons
- Team issues
""",

    # Offboarding report
    "offboarding.generate_report": """
Tạo báo cáo offboarding:
- Termination summary
- Reasons analysis
- Knowledge transfer status
- Final settlement
- Lessons learned
""",

    # Retention actions suggestion
    "offboarding.retention_suggestions": """
Đề xuất giữ chân nhân viên:
- Based on exit interview
- Based on risk factors
- Quick wins
- Long-term actions
- Escalation if needed
""",
}
