"""
Extract Router - Document extraction endpoints
"""

import logging
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

from fastapi import APIRouter

from app.services.provider_router import get_provider_router
from app.utils.response_formatter import ResponseFormatter

logger = logging.getLogger(__name__)
router = APIRouter()


class DocumentExtractRequest(BaseModel):
    """Document extraction request"""
    text: str = Field(..., description="Document text content")
    extraction_type: str = Field(..., description="Type: employee_id, resume, contract, etc.")
    schema: Optional[Dict[str, Any]] = Field(None, description="Expected output schema")


class DocumentExtractResponse(BaseModel):
    """Document extraction response"""
    success: bool
    data: Optional[Dict[str, Any]] = None
    confidence: Optional[float] = None
    warnings: Optional[list] = None
    error: Optional[str] = None


@router.post("/document", response_model=DocumentExtractResponse)
async def extract_document(request: DocumentExtractRequest):
    """
    Extract structured information from documents

    Supported types:
    - employee_id: CMND/CCCD extraction
    - resume: Resume/CV parsing
    - contract: Contract data extraction
    - certificate: Certificate parsing
    """
    try:
        provider_router = get_provider_router()

        extraction_prompts = {
            "employee_id": """
Trích xuất thông tin từ CMND/CCCD:
- Họ và tên
- Ngày sinh
- Giới tính
- Quốc tịch
- Nơi đăng ký HKTT
- Ngày cấp
- Số CMND/CCCD

Nếu không tìm thấy trường nào, để trống.
""",
            "resume": """
Trích xuất thông tin từ CV/Lý lịch:
- Thông tin cá nhân (tên, email, SĐT, địa chỉ)
- Mục tiêu nghề nghiệp
- Học vấn
- Kinh nghiệm làm việc
- Kỹ năng
- Chứng chỉ
- Ngôn ngữ

""",
            "contract": """
Trích xuất thông tin từ hợp đồng lao động:
- Loại hợp đồng
- Thời hạn hợp đồng
- Lương và phúc lợi
- Ngày bắt đầu
- Ngày kết thúc
- Điều khoản quan trọng

""",
            "certificate": """
Trích xuất thông tin từ chứng chỉ/bằng cấp:
- Tên chứng chỉ
- Cơ quan cấp
- Ngày cấp
- Mã số
- Lĩnh vực

""",
        }

        prompt = extraction_prompts.get(
            request.extraction_type,
            f"Trích xuất thông tin từ tài liệu loại: {request.extraction_type}"
        )

        schema_instruction = ""
        if request.schema:
            schema_instruction = f"\n\nTrả về theo schema:\n{request.schema}"

        full_prompt = f"""
{prompt}
{schema_instruction}

NỘI DUNG TÀI LIỆU:
{request.text}

Trả lời bằng tiếng Việt, format JSON.
"""

        messages = [
            {"role": "system", "content": "Bạn là chuyên gia trích xuất thông tin từ tài liệu với độ chính xác cao."},
            {"role": "user", "content": full_prompt},
        ]

        result = await provider_router.chat(messages, temperature=0.1)

        if not result.get("success"):
            return DocumentExtractResponse(success=False, error=result.get("error") or "Có lỗi xảy ra. Thử lại sau nhé.")

        # Try to parse JSON from response
        content = result.get("content", "")

        try:
            import json

            json_start = content.find("{")
            json_end = content.rfind("}") + 1
            if json_start != -1 and json_end > json_start:
                json_str = content[json_start:json_end]
                data = json.loads(json_str)

                return DocumentExtractResponse(
                    success=True,
                    data=data,
                    confidence=0.85,  # Estimated confidence
                )
        except (json.JSONDecodeError, ValueError):
            pass

        # Fallback: return as text
        return DocumentExtractResponse(
            success=True,
            data={"text": content},
            confidence=0.5,
            warnings=["Could not parse structured data, returning raw text"],
        )

    except Exception:
        logger.error(f"Document extraction error", exc_info=True)
        return DocumentExtractResponse(success=False, error="Có lỗi xảy ra. Thử lại sau nhé.")


class IDCardExtractRequest(BaseModel):
    """ID card extraction request"""
    front_text: str = Field(..., description="Front of ID card text")
    back_text: Optional[str] = Field(None, description="Back of ID card text")


@router.post("/id-card")
async def extract_id_card(request: IDCardExtractRequest):
    """
    Extract information from Vietnamese ID card (CMND/CCCD)

    Extracts both front and back information
    """
    try:
        provider_router = get_provider_router()

        prompt = f"""
TRÍCH XUẤT THÔNG TIN CMND/CCCD VIỆT NAM

MẶT TRƯỚC:
{request.front_text}

{'MẶT SAU:' if request.back_text else ''}
{request.back_text or ''}

Hãy trích xuất:
1. Số CMND/CCCD
2. Họ và tên
3. Ngày sinh
4. Giới tính
5. Quốc tịch
6. Nơi sinh
7. Quê quán
8. Địa chỉ thường trú
9. Ngày cấp
10. Ngày hết hạn (nếu có)
11. Dân tộc (nếu có)
12. Tôn giáo (nếu có)
13. Đặc điểm nhận dạng (nếu có)

Format JSON.
"""

        messages = [
            {"role": "system", "content": "Bạn là chuyên gia trích xuất thông tin từ giấy tờ tùy thân Việt Nam."},
            {"role": "user", "content": prompt},
        ]

        result = await provider_router.chat(messages, temperature=0.1)

        if not result.get("success"):
            return ResponseFormatter.error(result.get("error"))

        # Parse response
        content = result.get("content", "")
        data = None

        try:
            import json

            json_start = content.find("{")
            json_end = content.rfind("}") + 1
            if json_start != -1 and json_end > json_start:
                data = json.loads(content[json_start:json_end])
        except Exception:
            data = {"raw_text": content}

        return ResponseFormatter.extraction(
            extracted_data=data or {},
            confidence=0.9 if data else 0.5,
            metadata={"type": "id_card"},
        )

    except Exception as e:
        logger.error(f"ID card extraction error: {e}", exc_info=True)
        return ResponseFormatter.error(str(e))


class ResumeExtractRequest(BaseModel):
    """Resume parsing request"""
    resume_text: str = Field(..., description="Resume text content")
    include_sections: Optional[list] = Field(None, description="Sections to include")


@router.post("/resume")
async def extract_resume(request: ResumeExtractRequest):
    """
    Parse and extract structured data from resumes

    Extracts:
    - Personal info
    - Education
    - Work experience
    - Skills
    - Certifications
    - Languages
    """
    try:
        provider_router = get_provider_router()

        sections = request.include_sections or [
            "personal_info",
            "summary",
            "education",
            "experience",
            "skills",
            "certifications",
            "languages",
        ]

        prompt = f"""
TRÍCH XUẤT THÔNG TIN TỪ CV/LÝ LỊCH

CV NỘI DUNG:
{request.resume_text}

Hãy trích xuất các phần sau và format JSON:
- personal_info: Tên, email, SĐT, địa chỉ, LinkedIn
- summary: Tóm tắt bản thân/mục tiêu nghề nghiệp
- education: Học vấn (trường, ngành, năm, bằng cấp)
- experience: Kinh nghiệm làm việc (công ty, chức vụ, thời gian, mô tả)
- skills: Kỹ năng (hard skills, soft skills)
- certifications: Chứng chỉ, giải thưởng
- languages: Ngoại ngữ

"""

        messages = [
            {"role": "system", "content": "Bạn là chuyên gia phân tích và trích xuất thông tin từ CV."},
            {"role": "user", "content": prompt},
        ]

        result = await provider_router.chat(messages, temperature=0.1)

        if not result.get("success"):
            return ResponseFormatter.error(result.get("error"))

        # Parse response
        content = result.get("content", "")
        data = None

        try:
            import json

            json_start = content.find("{")
            json_end = content.rfind("}") + 1
            if json_start != -1 and json_end > json_start:
                data = json.loads(content[json_start:json_end])
        except Exception:
            data = {"raw_text": content}

        return ResponseFormatter.extraction(
            extracted_data=data or {},
            confidence=0.85 if data else 0.5,
            metadata={"type": "resume"},
        )

    except Exception as e:
        logger.error(f"Resume extraction error: {e}", exc_info=True)
        return ResponseFormatter.error(str(e))
