"""
Recruitment Module Prompts
"""

PROMPTS = {
    # System prompts
    "recruitment.system": "Bạn là chuyên gia tuyển dụng với kinh nghiệm sâu về đánh giá ứng viên.",

    # Resume analysis
    "recruitment.resume_analysis": """
Phân tích CV ứng viên:
1. Chấm điểm phù hợp (0-100)
2. Điểm mạnh nổi bật
3. Điểm cần lưu ý
4. Skills match analysis
5. Experience relevance
6. Recommendation
""",

    # Interview questions generation
    "recruitment.interview_questions": """
Tạo câu hỏi phỏng vấn:
- Technical questions (5-7)
- Behavioral questions (STAR format)
- Situational questions
- Culture fit questions
- Priority marking
""",

    # Interview feedback summary
    "recruitment.feedback_summary": """
Tổng hợp feedback phỏng vấn:
1. Đánh giá tổng quan
2. Điểm mạnh được đề cập
3. Mối quan tâm từ interviewers
4. Hiring recommendation
5. Scoring (1-10)
""",

    # Candidate recommendation
    "recruitment.candidate_recommendation": """
Đề xuất ứng viên phù hợp:
- Ranking by match score
- Skills alignment
- Experience fit
- Cultural fit potential
- Risk factors
""",

    # Job description optimization
    "recruitment.jd_optimization": """
Tối ưu mô tả công việc:
- Cấu trúc rõ ràng
- Ngôn ngữ hấp dẫn
- Requirements realistic
- Benefits highlighted
- Inclusive language
""",

    # Offer acceptance prediction
    "recruitment.offer_prediction": """
Dự đoán khả năng chấp nhận offer:
- Phân tích factors ảnh hưởng
- Salary competitiveness
- Market conditions
- Candidate's situation
- Recommendation
""",

    # Candidate skills extraction
    "recruitment.skills_extraction": """
Trích xuất và phân loại kỹ năng:
- Hard skills
- Soft skills
- Tools/Technologies
- Certifications
- Languages
""",

    # Candidate ranking
    "recruitment.candidate_ranking": """
Xếp hạng ứng viên:
- Match score với requirements
- Experience relevance
- Skills depth
- Salary expectations alignment
- Overall fit
""",

    # Recruitment report
    "recruitment.generate_report": """
Tạo báo cáo tuyển dụng:
- Pipeline overview
- Time to hire
- Quality of hire
- Source effectiveness
- Recommendations
""",
}
