"""
Document Intelligence - AI-Powered Document Processing (Phase 4)
Xu ly tai lieu HR tu dong:
- CV Parser: Upload CV → Extract structured data
- Contract Analyzer: Upload hop dong → Phan tich dieu khoan, flag rui ro
- Document Generator: Tao JD, offer letter, thong bao, bien ban
"""

import logging
from typing import Optional, Dict, Any
from datetime import datetime

from app.services.provider_router import get_provider_router

logger = logging.getLogger(__name__)


class DocumentIntelligence:
    """AI-powered document processing service"""

    async def parse_cv(self, cv_text: str) -> Dict[str, Any]:
        """Parse CV text → structured employee profile data"""
        provider_router = get_provider_router()

        prompt = f"""Phân tích CV sau và trích xuất thông tin thành JSON có cấu trúc.

CV TEXT:
{cv_text[:5000]}

Trả về JSON với các trường sau (để null nếu không có):
{{
  "full_name": "",
  "email": "",
  "phone": "",
  "date_of_birth": "",
  "gender": "",
  "address": "",
  "education": [
    {{"university": "", "degree": "", "major": "", "graduation_year": ""}}
  ],
  "work_experience": [
    {{"company": "", "position": "", "start_date": "", "end_date": "", "description": ""}}
  ],
  "skills": [],
  "certifications": [],
  "languages": [],
  "summary": ""
}}

CHỈ TRẢ VỀ JSON, KHÔNG CÓ TEXT GIẢI THÍCH."""

        result = await provider_router.chat_completion(
            system_prompt="Bạn là AI chuyên phân tích CV. Trả về JSON chính xác.",
            user_message=prompt,
            temperature=0.2,
        )

        if result.get("success"):
            content = result["content"]
            # Try to parse JSON from response
            import json, re
            json_match = re.search(r'\{[\s\S]*\}', content)
            if json_match:
                try:
                    parsed = json.loads(json_match.group())
                    return {
                        "success": True,
                        "parsed_data": parsed,
                        "confidence": 85,
                        "provider": result.get("provider"),
                    }
                except json.JSONDecodeError:
                    pass

            return {
                "success": True,
                "parsed_data": None,
                "raw_analysis": content,
                "confidence": 50,
            }

        return {"success": False, "error": result.get("error")}

    async def analyze_contract(self, contract_text: str) -> Dict[str, Any]:
        """Phan tich hop dong lao dong → tim rui ro va van de"""
        provider_router = get_provider_router()

        prompt = f"""Phân tích hợp đồng lao động sau. Trả về JSON:

HỢP ĐỒNG:
{contract_text[:5000]}

Trả về JSON:
{{
  "contract_type": "Loại hợp đồng",
  "parties": {{"employer": "", "employee": ""}},
  "key_terms": {{
    "start_date": "",
    "end_date": "",
    "position": "",
    "salary": "",
    "probation_period": "",
    "working_hours": "",
    "benefits": []
  }},
  "risks": [
    {{"risk_level": "high|medium|low", "clause": "Điều khoản", "description": "Mô tả rủi ro", "suggestion": "Gợi ý sửa đổi"}}
  ],
  "missing_clauses": [],
  "overall_assessment": "Đánh giá tổng quan",
  "compliance_score": 0-100
}}

CHỈ TRẢ VỀ JSON."""

        result = await provider_router.chat_completion(
            system_prompt="Bạn là luật sư chuyên về luật lao động Việt Nam. Phân tích hợp đồng kỹ lưỡng.",
            user_message=prompt,
            temperature=0.2,
        )

        if result.get("success"):
            content = result["content"]
            import json, re
            json_match = re.search(r'\{[\s\S]*\}', content)
            if json_match:
                try:
                    parsed = json.loads(json_match.group())
                    return {"success": True, "analysis": parsed, "provider": result.get("provider")}
                except json.JSONDecodeError:
                    pass

            return {"success": True, "raw_analysis": content}

        return {"success": False, "error": result.get("error")}

    async def generate(
        self, doc_type: str, context: str, user_id: str
    ) -> Dict[str, Any]:
        """Tao tai lieu HR theo yeu cau"""
        templates = {
            "jd": self._generate_jd,
            "offer_letter": self._generate_offer_letter,
            "announcement": self._generate_announcement,
            "meeting_minutes": self._generate_meeting_minutes,
        }

        generator = templates.get(doc_type)
        if not generator:
            return {
                "success": False,
                "error": f"Loại tài liệu '{doc_type}' không được hỗ trợ. Có thể tạo: {', '.join(templates.keys())}",
            }

        return await generator(context)

    async def _generate_jd(self, context: str) -> Dict[str, Any]:
        """Tao Job Description"""
        provider_router = get_provider_router()

        prompt = f"""Tạo Job Description (JD) chuyên nghiệp dựa trên yêu cầu sau:

{context}

Format JD bao gồm:
1. Tên vị trí
2. Mô tả công việc
3. Yêu cầu ứng viên (học vấn, kinh nghiệm, kỹ năng)
4. Quyền lợi
5. Thông tin liên hệ

Viết bằng tiếng Việt, chuyên nghiệp, hấp dẫn."""

        result = await provider_router.chat_completion(
            system_prompt="Bạn là chuyên gia tuyển dụng. Tạo JD chuyên nghiệp, hấp dẫn ứng viên.",
            user_message=prompt,
            temperature=0.6,
        )

        return {
            "success": result.get("success", False),
            "doc_type": "jd",
            "content": result.get("content"),
            "provider": result.get("provider"),
        }

    async def _generate_offer_letter(self, context: str) -> Dict[str, Any]:
        """Tao Offer Letter"""
        provider_router = get_provider_router()

        prompt = f"""Tạo thư mời nhận việc (Offer Letter) dựa trên thông tin sau:

{context}

Format:
- Header: Tên công ty, logo placeholder
- Tiêu đề: THƯ MỜI NHẬN VIỆC
- Nội dung: Vị trí, phòng ban, ngày bắt đầu, mức lương, quyền lợi
- Điều kiện
- Chữ ký

Viết bằng tiếng Việt, trang trọng."""

        result = await provider_router.chat_completion(
            system_prompt="Bạn là HR chuyên nghiệp. Tạo offer letter trang trọng bằng tiếng Việt.",
            user_message=prompt,
            temperature=0.5,
        )

        return {
            "success": result.get("success", False),
            "doc_type": "offer_letter",
            "content": result.get("content"),
            "provider": result.get("provider"),
        }

    async def _generate_announcement(self, context: str) -> Dict[str, Any]:
        """Tao thong bao noi bo"""
        provider_router = get_provider_router()

        prompt = f"""Soạn thảo thông báo nội bộ dựa trên nội dung sau:

{context}

Format thông báo:
- Tiêu đề
- Kính gửi
- Nội dung chính
- Yêu cầu/lưu ý
- Ngày hiệu lực
- Ký tên

Viết bằng tiếng Việt, rõ ràng, chuyên nghiệp."""

        result = await provider_router.chat_completion(
            system_prompt="Bạn là trợ lý HR. Soạn thông báo nội bộ chuyên nghiệp bằng tiếng Việt.",
            user_message=prompt,
            temperature=0.5,
        )

        return {
            "success": result.get("success", False),
            "doc_type": "announcement",
            "content": result.get("content"),
            "provider": result.get("provider"),
        }

    async def _generate_meeting_minutes(self, context: str) -> Dict[str, Any]:
        """Tao bien ban cuoc hop"""
        provider_router = get_provider_router()

        prompt = f"""Tạo biên bản cuộc họp dựa trên nội dung sau:

{context}

Format biên bản:
- Tiêu đề cuộc họp
- Thời gian, địa điểm
- Thành phần tham dự
- Nội dung thảo luận (mục 1, 2, 3...)
- Kết luận và phân công
- Chữ ký

Viết bằng tiếng Việt, rõ ràng."""

        result = await provider_router.chat_completion(
            system_prompt="Bạn là thư ký chuyên nghiệp. Tạo biên bản cuộc họp bằng tiếng Việt.",
            user_message=prompt,
            temperature=0.5,
        )

        return {
            "success": result.get("success", False),
            "doc_type": "meeting_minutes",
            "content": result.get("content"),
            "provider": result.get("provider"),
        }

    async def answer_policy_question(
        self, policy_text: str, question: str
    ) -> Dict[str, Any]:
        """Hoi dap ve chinh sach dua tren tai lieu upload"""
        provider_router = get_provider_router()

        prompt = f"""Dựa trên tài liệu chính sách sau, trả lời câu hỏi của nhân viên.

TÀI LIỆU CHÍNH SÁCH:
{policy_text[:5000]}

CÂU HỎI:
{question}

Hãy trả lời chính xác dựa trên tài liệu. Nếu tài liệu không đề cập, nói rõ."""

        result = await provider_router.chat_completion(
            system_prompt="Bạn là trợ lý HR. Trả lời câu hỏi chính sách dựa trên tài liệu được cung cấp. Bằng tiếng Việt.",
            user_message=prompt,
            temperature=0.3,
        )

        return {
            "success": result.get("success", False),
            "answer": result.get("content"),
            "provider": result.get("provider"),
        }
