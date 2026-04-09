"""
OpenAI Service - GPT-4o, GPT-4, GPT-3.5 integration
"""

import logging
from typing import Optional, Dict, Any, List
from functools import lru_cache

import os
from openai import AsyncOpenAI
from openai.types.chat import ChatCompletion, ChatCompletionMessageParam

from app.config import settings

logger = logging.getLogger(__name__)


class OpenAIService:
    """OpenAI API service wrapper"""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.openai_api_key
        base_url = os.getenv("OPENAI_BASE_URL")
        
        if self.api_key:
            if base_url:
                self.client = AsyncOpenAI(api_key=self.api_key, base_url=base_url)
            else:
                self.client = AsyncOpenAI(api_key=self.api_key)
        else:
            self.client = None
            
        self.enabled = bool(self.api_key)

    async def chat(
        self,
        messages: List[ChatCompletionMessageParam],
        model: str = "gpt-4o",
        temperature: float = 0.7,
        max_tokens: int = 4096,
        **kwargs,
    ) -> Dict[str, Any]:
        """
        Send chat completion request to OpenAI

        Args:
            messages: List of chat messages
            model: Model name (gpt-4o, gpt-4-turbo, gpt-3.5-turbo)
            temperature: Sampling temperature (0-2)
            max_tokens: Maximum tokens to generate
            **kwargs: Additional parameters

        Returns:
            Dict with success, content, usage, etc.
        """
        if not self.enabled:
            return {
                "success": False,
                "error": "OpenAI API key not configured",
                "content": None,
                "usage": None,
            }

        try:
            response: ChatCompletion = await self.client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                **kwargs,
            )

            content = response.choices[0].message.content or ""
            usage = response.usage

            logger.info(
                f"OpenAI chat completed: model={model}, "
                f"prompt_tokens={usage.prompt_tokens}, "
                f"completion_tokens={usage.completion_tokens}"
            )

            return {
                "success": True,
                "content": content,
                "usage": {
                    "prompt_tokens": usage.prompt_tokens,
                    "completion_tokens": usage.completion_tokens,
                    "total_tokens": usage.total_tokens,
                },
                "model": model,
                "finish_reason": response.choices[0].finish_reason,
            }

        except Exception as e:
            logger.error(f"OpenAI chat error: {e}")
            return {
                "success": False,
                "error": str(e),
                "content": None,
                "usage": None,
            }

    async def analyze(
        self,
        prompt: str,
        data: Dict[str, Any],
        model: str = "gpt-4o",
    ) -> Dict[str, Any]:
        """
        Analyze data using OpenAI

        Args:
            prompt: Analysis prompt/instructions
            data: Data to analyze
            model: Model name

        Returns:
            Analysis results
        """
        messages = [
            {"role": "system", "content": "Bạn là một chuyên gia phân tích nhân sự (HR Analytics Expert). Phân tích dữ liệu một cách chính xác và đưa ra insights có giá trị."},
            {"role": "user", "content": f"{prompt}\n\nDữ liệu:\n{data}"},
        ]
        return await self.chat(messages, model=model, temperature=0.3)

    async def extract(
        self,
        text: str,
        extraction_type: str,
        schema: Optional[Dict] = None,
        model: str = "gpt-4o",
    ) -> Dict[str, Any]:
        """
        Extract structured information from text

        Args:
            text: Text to extract from
            extraction_type: Type of extraction (resume, id_card, etc.)
            schema: Expected output schema
            model: Model name

        Returns:
            Extracted data
        """
        schema_instruction = ""
        if schema:
            schema_instruction = f"\n\nTrả về kết quả theo schema sau (JSON):\n{schema}"

        messages = [
            {"role": "system", "content": f"Bạn là chuyên gia trích xuất thông tin từ tài liệu. Trích xuất chính xác thông tin theo yêu cầu.{schema_instruction}"},
            {"role": "user", "content": f"Trích xuất thông tin loại: {extraction_type}\n\nNội dung tài liệu:\n{text}"},
        ]
        return await self.chat(messages, model=model, temperature=0.1)

    async def generate(
        self,
        prompt: str,
        context: Optional[Dict[str, Any]] = None,
        model: str = "gpt-4o",
    ) -> Dict[str, Any]:
        """
        Generate content using OpenAI

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

        messages = [
            {"role": "system", "content": "Bạn là trợ lý AI chuyên về nhân sự (HR). Tạo nội dung chất lượng cao, phù hợp với ngữ cảnh doanh nghiệp Việt Nam."},
            {"role": "user", "content": f"{prompt}{context_str}"},
        ]
        return await self.chat(messages, model=model, temperature=0.7)

    async def summarize(
        self,
        content: str,
        summary_type: str = "general",
        max_length: int = 500,
        model: str = "gpt-4o",
    ) -> Dict[str, Any]:
        """
        Summarize content

        Args:
            content: Content to summarize
            summary_type: Type of summary (brief, detailed, bullet_points)
            max_length: Maximum length of summary
            model: Model name

        Returns:
            Summary
        """
        type_instructions = {
            "brief": "Tóm tắt ngắn gọn, đi thẳng vào vấn đề",
            "detailed": "Tóm tắt chi tiết, bao gồm các điểm quan trọng",
            "bullet_points": "Tóm tắt dạng bullet points, dễ đọc",
        }
        instruction = type_instructions.get(summary_type, "Tóm tắt ngắn gọn")

        messages = [
            {"role": "system", "content": f"Bạn là chuyên gia tóm tắt nội dung. {instruction}. Tối đa {max_length} từ."},
            {"role": "user", "content": f"Nội dung cần tóm tắt:\n{content}"},
        ]
        return await self.chat(messages, model=model, temperature=0.3, max_tokens=max_length)

    async def chat_completion(
        self,
        system_prompt: str,
        user_message: str,
        model: str = "gpt-4o",
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
_openai_service: Optional[OpenAIService] = None


def get_openai_service() -> OpenAIService:
    """Get OpenAI service singleton"""
    global _openai_service
    if _openai_service is None:
        _openai_service = OpenAIService()
    return _openai_service


def reset_openai_service():
    """Reset OpenAI service singleton (for testing)"""
    global _openai_service
    _openai_service = None
