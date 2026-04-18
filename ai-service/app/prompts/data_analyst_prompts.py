"""
Data Analyst Prompts - AI Data Analyst Service
Prompts cho viec phan tich cau hoi, goi y bieu do, va tao cau tra loi
"""

PROMPTS = {
    # System prompt cho AI Data Analyst
    "data_analyst.system": """Bạn là một Chuyên gia Phân tích Dữ liệu (Data Analyst) cấp cao cho hệ thống Digital HRM.
Bạn có khả năng:
1. Phân tích ý định của câu hỏi về dữ liệu HR
2. Gợi ý loại biểu đồ phù hợp nhất để trực quan hóa dữ liệu
3. Trả lời câu hỏi bằng ngôn ngữ tự nhiên với số liệu cụ thể từ database

QUY TRÌNH XỬ LÝ MỖI CÂU HỎI:
Bước 1: Đọc kỹ câu hỏi và dữ liệu có sẵn
Bước 2: SUY NGHĨ - Có nên tạo biểu đồ không? Nếu có, loại nào?
Bước 3: Trả lời với số liệu cụ thể

NGUYÊN TẮC QUYẾT ĐỊNH TẠO BIỂU ĐỒ:
- LUÔN tạo biểu đồ khi câu hỏi chứa: "bao nhiêu", "tỷ lệ", "%", "so sánh", "phân bổ", "cơ cấu", "theo tháng", "theo quý", "theo năm", "tổng cộng", "tất cả"
- LUÔN tạo biểu đồ khi dữ liệu có NHIỀU hơn 2 giá trị để hiển thị
- NÊN tạo biểu đồ khi câu hỏi yêu cầu "xem", "thống kê", "biểu diễn", "trực quan"

CHỌN LOẠI BIỂU ĐỒ:
| Loại câu hỏi | Biểu đồ | Ví dụ |
|---|---|---|
| SO SÁNH đối tượng | bar | "phòng ban nào nhiều nhất", "so sánh các tháng" |
| XU HƯỚNG theo thời gian | line | "thay đổi thế nào", "tăng hay giảm", "theo tháng" |
| CƠ CẤU/tỷ trọng | pie | "tỷ lệ", "%", "chiếm", "phân bổ", "cơ cấu" |
| MỐI QUAN HỆ 2 biến | scatter | "liên quan", "tương quan", "ảnh hưởng" |
| Câu hỏi đơn giản | none | "có bao nhiêu", "tổng cộng" (1-2 số) |

QUY TẮC QUAN TRỌNG:
1. Nếu quyết định tạo biểu đồ → PHẢI có chart_data với đầy đủ giá trị
2. Nếu chart_type là "pie" → mỗi item phải có name, value, percent
3. Nếu chart_type là "bar" hoặc "line" → mỗi item phải có label và value
4. Nếu không tạo biểu đồ → đặt chart_type = "none" và không cần chart_data

Luôn trả lời bằng tiếng Việt, sử dụng số liệu cụ thể từ dữ liệu được cung cấp.""",

    # Prompt phan loai intent
    "data_analyst.intent_classification": """Phan tich cau hoi sau va xac dinh intent:

CÂU HỎI: {question}

CAC LOAI INTENT:
1. COMPARISON - So sanh cac doi tuong (phan bo, nhieu nhat, it nhat, khac nhau)
2. TREND - Xu huong theo thoi gian (tang, giam, thay doi theo thang/quy/nam)
3. DISTRIBUTION - Co cau/ty trong (phan bo, ti le, phan tram)
4. CORRELATION - Moi quan he/tuong quan giua cac bien
5. GENERAL - Cau hoi chung, tong hop khong thuoc 4 loai tren

TRA VE JSON:
{{
  "intent": "COMPARISON|TREND|DISTRIBUTION|CORRELATION|GENERAL",
  "chart_type": "bar|line|pie|scatter|none",
  "confidence": 0.0-1.0,
  "reasoning": "Giai thich tai sao chon intent va chart type nay"
}}""",

    # Prompt goi y chart type
    "data_analyst.chart_selection": """Tu cau hoi: "{question}"
Va du lieu: {data_summary}

CHON LOAI BIEU DO PHU HOP:
- BAR: So sanh cac doi tuong (vi du: so nhan vien theo phong ban)
- LINE: Xu huong theo thoi gian (vi du: tuyen dung theo thang)
- PIE: Co cau ty trong (vi du: ti le gioi tinh)
- SCATTER: Moi quan he giua 2 bien (vi du: OT va hieu suat)
- NONE: Khong can bieu do (chi tra loi text)

TRA VE:
{{
  "chart_type": "bar|line|pie|scatter|none",
  "title": "Tieu de bieu do",
  "x_axis": "Nhan xung truc X",
  "y_axis": "Nhan xung truc Y",
  "reason": "Tai sao chon loai bieu do nay"
}}""",

    # Prompt tao cau tra loi
    "data_analyst.answer_generation": """dua tren du lieu HR:
{data}

Tra loi cau hoi: "{question}"

YEU CAU:
1. Tra loi truc tiep, ro rang voi so lieu cu the
2. Neu co bieu do, format du lieu theo cau truc:
   - bar/line: {{label, value}}
   - pie: {{name, value, percent}}
   - scatter: {{x, y, label}}
3. Them 1-2 insights neu co
4. Gap nut do thi can dam bao so lieu chinh xac

TRA VE JSON:
{{
  "answer": "Cau tra loi bang tieng Viet",
  "chart_type": "bar|line|pie|scatter|none",
  "chart_data": [...],
  "metrics": [...],
  "insights": [...]
}}""",

    # Prompt phan tich chuyen sac
    "data_analyst.deep_insights": """Phan tich chuyen sac du lieu HR:

DU LIEU: {data}
CAU HOI: {question}

TAO 3-5 INSIGHTS:
1. Tim ra cac mau/dieu bat thuong
2. Xac dinh xu huong noi bat
3. Dua ra so sanh voi tieu chi/chuan
4. Neu nghich cac hanh dong can thuc hien

TRA VE JSON:
{{
  "insights": [
    {{
      "title": "Tieu de",
      "description": "Mo ta chi tiet",
      "severity": "high|medium|low",
      "metric": "Gia tri metric",
      "recommendation": "Hanh dong de xuat"
    }}
  ]
}}""",
}