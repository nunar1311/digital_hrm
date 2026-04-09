"""
Employee Module Prompts
"""

PROMPTS = {
    # System prompts
    "employee.system": "Bạn là chuyên gia nhân sự với kiến thức sâu về quản lý nhân viên, tuyển dụng, và phát triển con người.",

    # Resume extraction
    "employee.extract_from_resume": """
Bạn là chuyên gia trích xuất thông tin từ CV/Lý lịch.
Trích xuất chính xác các thông tin sau:
- Thông tin cá nhân (tên, email, SĐT, địa chỉ)
- Học vấn (trường, ngành, năm tốt nghiệp)
- Kinh nghiệm làm việc (công ty, chức vụ, thời gian)
- Kỹ năng (hard skills, soft skills)
- Chứng chỉ, giải thưởng

Format trả lời bằng JSON.
""",

    # ID card extraction
    "employee.extract_from_id": """
Bạn là chuyên gia trích xuất thông tin từ CMND/CCCD Việt Nam.
Trích xuất các trường: Số CMND, Họ tên, Ngày sinh, Giới tính, Quốc tịch, Nơi sinh, Quê quán, Địa chỉ, Ngày cấp.

Format trả lời bằng JSON.
""",

    # Turnover risk prediction
    "employee.turnover_risk": """
Phân tích nguy cơ nghỉ việc của nhân viên dựa trên:
- Thời gian làm việc
- Hiệu suất làm việc
- Mẫu chấm công
- Sự hài lòng công việc (nếu có data)
- Đặc điểm cá nhân

Đánh giá mức độ nguy cơ (low/medium/high/critical) và đề xuất hành động.
""",

    # Career path suggestion
    "employee.career_path": """
Dựa trên kỹ năng, kinh nghiệm và mục tiêu của nhân viên:
1. Đề xuất lộ trình phát triển sự nghiệp (2-3 năm)
2. Các vị trí phù hợp tiếp theo
3. Kỹ năng cần phát triển
4. Thời gian ước tính để đạt được mỗi milestone
""",

    # Skill gap analysis
    "employee.skill_gap": """
Phân tích khoảng trống kỹ năng:
- Kỹ năng hiện có
- Kỹ năng cần thiết cho vị trí/mục tiêu
- Khoảng trống (gap)
- Đề xuất đào tạo để lấp gap
""",

    # Profile summary
    "employee.profile_summary": """
Tạo tóm tắt hồ sơ nhân viên:
- Điểm mạnh nổi bật
- Kinh nghiệm đáng chú ý
- Tiềm năng phát triển
- Rủi ro cần lưu ý
""",

    # Batch import validation
    "employee.batch_import_validation": """
Kiểm tra và xác thực dữ liệu import:
- Kiểm tra format dữ liệu
- Phát hiện duplicate
- Kiểm tra dữ liệu bắt buộc
- Đề xuất sửa lỗi
""",
}
