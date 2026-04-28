"""
Anthropic Claude Service - Claude 3.5 Sonnet, Claude 3 Opus integration
"""

import logging
from typing import Optional, Dict, Any, List
from functools import lru_cache

from anthropic import AsyncAnthropic

from app.config import settings

logger = logging.getLogger(__name__)


class AnthropicService:
    """Anthropic Claude API service wrapper"""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.anthropic_api_key
        base_url = settings.anthropic_base_url
        
        if self.api_key:
            if base_url:
                self.client = AsyncAnthropic(api_key=self.api_key, base_url=base_url)
            else:
                self.client = AsyncAnthropic(api_key=self.api_key)
        else:
            self.client = None
            
        self.enabled = bool(self.api_key)

    async def chat(
        self,
        messages: List[Dict[str, str]],
        model: str = "claude-3-5-sonnet-20241022",
        max_tokens: int = 4096,
        temperature: float = 0.7,
        system: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """
        Send message to Claude

        Args:
            messages: List of messages with role and content
            model: Model name (claude-3-5-sonnet-20241022, claude-3-opus-20240229)
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature (0-2)
            system: System prompt
            **kwargs: Additional parameters

        Returns:
            Dict with success, content, usage, etc.
        """
        if not self.enabled:
            return {
                "success": False,
                "error": "Anthropic API key not configured",
                "content": None,
                "usage": None,
            }

        try:
            # Convert messages format for Anthropic
            anthropic_messages = []
            for msg in messages:
                if msg["role"] == "system":
                    system = msg["content"]
                else:
                    anthropic_messages.append({
                        "role": msg["role"],
                        "content": msg["content"],
                    })

            response = await self.client.messages.create(
                model=model,
                max_tokens=max_tokens,
                temperature=temperature,
                system=system,
                messages=anthropic_messages,
                **kwargs,
            )

            content = response.content[0].text if response.content else ""
            usage = response.usage

            logger.info(
                f"Anthropic chat completed: model={model}, "
                f"input_tokens={usage.input_tokens}, "
                f"output_tokens={usage.output_tokens}"
            )

            return {
                "success": True,
                "content": content,
                "usage": {
                    "prompt_tokens": usage.input_tokens,
                    "completion_tokens": usage.output_tokens,
                    "total_tokens": usage.input_tokens + usage.output_tokens,
                },
                "model": model,
                "stop_reason": response.stop_reason,
            }

        except Exception as e:
            logger.error(f"Anthropic chat error: {e}")
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
        model: str = "claude-3-5-sonnet-20241022",
    ) -> Dict[str, Any]:
        """
        Analyze data using Claude

        Args:
            prompt: Analysis prompt/instructions
            data: Data to analyze
            model: Model name

        Returns:
            Analysis results
        """
        system = "Bạn là một chuyên gia phân tích nhân sự (HR Analytics Expert) với kinh nghiệm sâu rộng. Phân tích dữ liệu một cách chính xác, khách quan và đưa ra insights có giá trị cho doanh nghiệp."
        messages = [
            {"role": "user", "content": f"{prompt}\n\nDữ liệu:\n{data}"},
        ]
        return await self.chat(messages, model=model, temperature=0.3, system=system)

    async def extract(
        self,
        text: str,
        extraction_type: str,
        schema: Optional[Dict] = None,
        model: str = "claude-3-5-sonnet-20241022",
    ) -> Dict[str, Any]:
        """
        Extract structured information from text using Claude

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

        system = f"Bạn là chuyên gia trích xuất thông tin từ tài liệu với độ chính xác cao.{schema_instruction}"
        messages = [
            {"role": "user", "content": f"Trích xuất thông tin loại: {extraction_type}\n\nNội dung tài liệu:\n{text}"},
        ]
        return await self.chat(messages, model=model, temperature=0.1, system=system)

    async def generate(
        self,
        prompt: str,
        context: Optional[Dict[str, Any]] = None,
        model: str = "claude-3-5-sonnet-20241022",
    ) -> Dict[str, Any]:
        """
        Generate content using Claude

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

        system = "Bạn là trợ lý AI chuyên về nhân sự (HR) cho doanh nghiệp Việt Nam. Tạo nội dung chất lượng cao, chuyên nghiệp, phù hợp với văn hóa và luật lao động Việt Nam."
        messages = [
            {"role": "user", "content": f"{prompt}{context_str}"},
        ]
        return await self.chat(messages, model=model, temperature=0.7, system=system)

    async def summarize(
        self,
        content: str,
        summary_type: str = "general",
        max_length: int = 500,
        model: str = "claude-3-5-sonnet-20241022",
    ) -> Dict[str, Any]:
        """
        Summarize content using Claude

        Args:
            content: Content to summarize
            summary_type: Type of summary
            max_length: Maximum length
            model: Model name

        Returns:
            Summary
        """
        type_instructions = {
            "brief": "Tóm tắt ngắn gọn, súc tích, đi thẳng vào vấn đề chính",
            "detailed": "Tóm tắt chi tiết, bao gồm tất cả các điểm quan trọng và bối cảnh",
            "bullet_points": "Tóm tắt dạng bullet points rõ ràng, dễ đọc và quét",
        }
        instruction = type_instructions.get(summary_type, "Tóm tắt ngắn gọn, rõ ràng")

        system = f"Bạn là chuyên gia tóm tắt nội dung. {instruction}. Giới hạn tối đa {max_length} từ."
        messages = [
            {"role": "user", "content": f"Nội dung cần tóm tắt:\n{content}"},
        ]
        return await self.chat(messages, model=model, temperature=0.3, system=system, max_tokens=max_length)

    async def chat_completion(
        self,
        system_prompt: str,
        user_message: str,
        model: str = "claude-3-5-sonnet-20241022",
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
            {"role": "user", "content": user_message},
        ]
        return await self.chat(messages, model=model, temperature=temperature, system=system_prompt)


# Singleton instance
_anthropic_service: Optional[AnthropicService] = None


def get_anthropic_service() -> AnthropicService:
    """Get Anthropic service singleton"""
    global _anthropic_service
    if _anthropic_service is None:
        _anthropic_service = AnthropicService()
    return _anthropic_service


def reset_anthropic_service():
    """Reset Anthropic service singleton"""
    global _anthropic_service
    _anthropic_service = None
