"""
Google Gemini Service - Gemini 2.0, Gemini 1.5 integration
"""

import logging
from typing import Optional, Dict, Any, List
from functools import lru_cache

from google.genai import Client
from google.genai.types import GenerateContentConfig, HarmCategory, HarmBlockThreshold, SafetySetting

from app.config import settings

logger = logging.getLogger(__name__)


class GoogleAIService:
    """Google Gemini API service wrapper"""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.google_api_key
        self.client = Client(api_key=self.api_key) if self.api_key else None
        self.enabled = bool(self.api_key)

    async def chat(
        self,
        messages: List[Dict[str, str]],
        model: str = "gemini-2.5-flash",
        temperature: float = 0.7,
        max_tokens: int = 4096,
        **kwargs,
    ) -> Dict[str, Any]:
        """
        Send chat to Gemini

        Args:
            messages: List of messages
            model: Model name (gemini-2.5-flash, gemini-1.5-pro, etc.)
            temperature: Sampling temperature (0-2)
            max_tokens: Maximum tokens to generate
            **kwargs: Additional parameters

        Returns:
            Dict with success, content, usage, etc.
        """
        if not self.enabled:
            return {
                "success": False,
                "error": "Google API key not configured",
                "content": None,
                "usage": None,
            }

        system_prompt = ""
        try:
            # Combine messages into single prompt (Gemini uses single prompt)
            combined_prompt = ""
            for msg in messages:
                if msg["role"] == "system":
                    system_prompt = msg["content"] + "\n\n"
                else:
                    combined_prompt += f"{msg['role'].upper()}: {msg['content']}\n\n"

            full_prompt = system_prompt + combined_prompt

            response = await self.client.aio.models.generate_content(
                model=model,
                contents=full_prompt,
                config=GenerateContentConfig(
                    temperature=temperature,
                    max_output_tokens=max_tokens,
                    safety_settings=[
                        SafetySetting(category=HarmCategory.HARM_CATEGORY_HARASSMENT, threshold=HarmBlockThreshold.BLOCK_NONE),
                        SafetySetting(category=HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold=HarmBlockThreshold.BLOCK_NONE),
                        SafetySetting(category=HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold=HarmBlockThreshold.BLOCK_NONE),
                        SafetySetting(category=HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold=HarmBlockThreshold.BLOCK_NONE),
                    ],
                    **kwargs,
                ),
            )

            content = response.text if response.text else ""

            logger.info(f"Google Gemini chat completed: model={model}")

            return {
                "success": True,
                "content": content,
                "usage": {
                    "prompt_tokens": getattr(response.usage_metadata, "prompt_token_count", 0),
                    "completion_tokens": getattr(response.usage_metadata, "candidates_token_count", 0),
                    "total_tokens": getattr(response.usage_metadata, "total_token_count", 0),
                },
                "model": model,
            }

        except Exception as e:
            error_str = str(e)
            logger.error(f"Google Gemini chat error: {error_str}")
            return {
                "success": False,
                "error": error_str,
                "content": None,
                "usage": None,
            }

    async def analyze(
        self,
        prompt: str,
        data: Dict[str, Any],
        model: str = "gemini-2.5-flash",
    ) -> Dict[str, Any]:
        """
        Analyze data using Gemini

        Args:
            prompt: Analysis prompt
            data: Data to analyze
            model: Model name

        Returns:
            Analysis results
        """
        system = "Bạn là một chuyên gia phân tích nhân sự (HR Analytics Expert). Phân tích dữ liệu một cách chính xác và đưa ra insights có giá trị."
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": f"{prompt}\n\nDữ liệu:\n{data}"},
        ]
        return await self.chat(messages, model=model, temperature=0.3)

    async def extract(
        self,
        text: str,
        extraction_type: str,
        schema: Optional[Dict] = None,
        model: str = "gemini-2.5-flash",
    ) -> Dict[str, Any]:
        """
        Extract structured information from text

        Args:
            text: Text to extract from
            extraction_type: Type of extraction
            schema: Expected output schema
            model: Model name

        Returns:
            Extracted data
        """
        schema_instruction = ""
        if schema:
            schema_instruction = f"\n\nTrả về kết quả theo schema JSON sau:\n{schema}"

        system = f"Bạn là chuyên gia trích xuất thông tin từ tài liệu.{schema_instruction}"
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": f"Trích xuất thông tin loại: {extraction_type}\n\nNội dung tài liệu:\n{text}"},
        ]
        return await self.chat(messages, model=model, temperature=0.1)

    async def generate(
        self,
        prompt: str,
        context: Optional[Dict[str, Any]] = None,
        model: str = "gemini-2.5-flash",
    ) -> Dict[str, Any]:
        """
        Generate content using Gemini

        Args:
            prompt: Generation prompt
            context: Additional context
            model: Model name

        Returns:
            Generated content
        """
        context_str = ""
        if context:
            context_str = f"\n\nNgữ cảnh bổ sung:\n{context}"

        system = "Bạn là trợ lý AI chuyên về nhân sự (HR) cho doanh nghiệp Việt Nam. Tạo nội dung chất lượng cao."
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": f"{prompt}{context_str}"},
        ]
        return await self.chat(messages, model=model, temperature=0.7)

    async def summarize(
        self,
        content: str,
        summary_type: str = "general",
        max_length: int = 500,
        model: str = "gemini-2.5-flash",
    ) -> Dict[str, Any]:
        """
        Summarize content using Gemini

        Args:
            content: Content to summarize
            summary_type: Type of summary
            max_length: Maximum length
            model: Model name

        Returns:
            Summary
        """
        type_instructions = {
            "brief": "Tóm tắt ngắn gọn, súc tích",
            "detailed": "Tóm tắt chi tiết, bao gồm các điểm quan trọng",
            "bullet_points": "Tóm tắt dạng bullet points",
        }
        instruction = type_instructions.get(summary_type, "Tóm tắt ngắn gọn")

        system = f"Bạn là chuyên gia tóm tắt nội dung. {instruction}. Tối đa {max_length} từ."
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": f"Nội dung cần tóm tắt:\n{content}"},
        ]
        return await self.chat(messages, model=model, temperature=0.3, max_tokens=max_length)

    async def chat_completion(
        self,
        system_prompt: str,
        user_message: str,
        model: str = "gemini-2.5-flash",
        temperature: float = 0.7,
    ) -> Dict[str, Any]:
        """
        Simple chat completion

        Args:
            system_prompt: System prompt
            user_message: User message
            model: Model name
            temperature: Temperature

        Returns:
            Response
        """
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ]
        return await self.chat(messages, model=model, temperature=temperature)


# Singleton instance
_google_ai_service: Optional[GoogleAIService] = None


def get_google_ai_service() -> GoogleAIService:
    """Get Google AI service singleton"""
    global _google_ai_service
    if _google_ai_service is None:
        _google_ai_service = GoogleAIService()
    return _google_ai_service


def reset_google_ai_service():
    """Reset Google AI service singleton"""
    global _google_ai_service
    _google_ai_service = None
