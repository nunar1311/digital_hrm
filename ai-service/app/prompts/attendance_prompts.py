"""
Attendance Module Prompts
"""

PROMPTS = {
    # System prompts
    "attendance.system": "Bạn là chuyên gia về quản lý chấm công và thời gian làm việc.",

    # Anomaly detection
    "attendance.anomaly_detection": """
Phân tích dữ liệu chấm công để phát hiện bất thường:
- Pattern đi muộn/về sớm bất thường
- Thiếu dữ liệu chấm công nhiều
- Giờ làm việc không đều
- Dấu hiệu điểm danh hộ

Đánh dấu các trường hợp đáng ngờ và mức độ nghiêm trọng.
""",

    # Pattern analysis
    "attendance.pattern_analysis": """
Phân tích mẫu chấm công:
- Giờ check-in/check-out phổ biến
- Xu hướng đi muộn theo ngày trong tuần
- Mẫu OT theo dự án/thời gian
- Hiệu suất làm việc định giờ
""",

    # Overtime prediction
    "attendance.overtime_prediction": """
Dự đoán nhu cầu overtime:
- Dựa trên lịch sử OT
- Dựa trên deadline dự án
- Xu hướng theo mùa/tháng
- Đề xuất lịch OT hợp lý
""",

    # Shift optimization
    "attendance.shift_optimization": """
Đề xuất tối ưu ca làm việc:
- Cân bằng workload
- Phù hợp với sở thích nhân viên
- Tối ưu chi phí
- Đảm bảo coverage
""",

    # Leave request auto-process
    "attendance.leave_auto_process": """
Xử lý đơn nghỉ phép tự động:
- Kiểm tra số dư phép
- Đánh giá impact lên công việc
- Đề xuất chấp nhận/từ chối
- Viết phản hồi tự động
""",

    # Attendance report
    "attendance.generate_report": """
Tạo báo cáo chấm công:
- Tổng hợp metrics chính
- So sánh với tháng trước
- Điểm nổi bật
- Cảnh báo cần chú ý
- Đề xuất cải thiện
""",
}
