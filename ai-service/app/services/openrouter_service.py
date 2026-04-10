"""
Vitexa Gateway Service - Kết nối với gate.vitexa.app (OpenAI-compatible format)
Các model hỗ trợ: gpt-5.3-codex, gpt-5.4, gpt-5.4-mini, grok-4-1-fast-*, grok-code-fast-1
Endpoint: https://gate.vitexa.app/v1
"""

import logging
import httpx
from typing import Optional, Dict, Any, List

from app.config import settings

logger = logging.getLogger(__name__)

OPENROUTER_BASE_URL = "https://gate.vitexa.app/v1"


class OpenRouterService:
    """Vitexa Gateway Service - OpenAI-compatible gateway tại gate.vitexa.app"""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.openrouter_api_key
        self.enabled = bool(self.api_key)
        self.base_url = OPENROUTER_BASE_URL
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    async def chat(
        self,
        messages: List[Dict[str, str]],
        model: str = "gpt-5.3-codex",
        temperature: float = 0.7,
        max_tokens: int = 4096,
        **kwargs,
    ) -> Dict[str, Any]:
        """
        Gửi chat request tới Vitexa Gateway

        Args:
            messages: Danh sách messages [{"role": "user/system/assistant", "content": "..."}]
            model: Model ID (gpt-5.3-codex, gpt-5.4, gpt-5.4-mini, grok-4-1-fast-non-reasoning, ...)
            temperature: Nhiệt độ sampling (0-2)
            max_tokens: Số token tối đa output
            **kwargs: Tham số bổ sung

        Returns:
            Dict với success, content, usage, model
        """
        if not self.enabled:
            return {
                "success": False,
                "error": "Vitexa Gateway API key chưa được cấu hình (OPENROUTER_API_KEY)",
                "content": None,
                "usage": None,
            }

        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True,  # Bắt buộc dùng streaming vì Vitexa Gateway trả null nếu gọi sync
            **kwargs,
        }

        try:
            import json
            full_content = ""
            final_usage = {}
            
            async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
                async with client.stream(
                    "POST",
                    f"{self.base_url}/chat/completions",
                    headers=self.headers,
                    json=payload,
                ) as response:
                    response.raise_for_status()
                    
                    async for line in response.aiter_lines():
                        if line.startswith("data: ") and line != "data: [DONE]":
                            try:
                                data = json.loads(line[6:])
                                if "choices" in data and len(data["choices"]) > 0:
                                    delta = data["choices"][0].get("delta", {})
                                    if "content" in delta and delta["content"]:
                                        full_content += delta["content"]
                                    # Fallback to reasoning_content if applicable
                                    if "reasoning_content" in delta and delta["reasoning_content"]:
                                        full_content += delta["reasoning_content"]
                                
                                if "usage" in data and data["usage"]:
                                    final_usage = data["usage"]
                            except json.JSONDecodeError:
                                pass

            logger.info(f"Vitexa Gateway chat completed: model={model}, tokens={final_usage.get('total_tokens', 0)}")

            return {
                "success": True,
                "content": full_content,
                "usage": {
                    "prompt_tokens": final_usage.get("prompt_tokens", 0),
                    "completion_tokens": final_usage.get("completion_tokens", 0),
                    "total_tokens": final_usage.get("total_tokens", 0),
                },
                "model": model,
            }

        except httpx.HTTPStatusError as e:
            error_body = e.response.text
            logger.error(f"Vitexa Gateway HTTP error {e.response.status_code}: {error_body}")
            return {
                "success": False,
                "error": f"HTTP {e.response.status_code}: {error_body}",
                "content": None,
                "usage": None,
            }
        except Exception as e:
            error_str = str(e)
            logger.error(f"Vitexa Gateway chat error: {error_str}")
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
        model: str = "gpt-5.3-codex",
    ) -> Dict[str, Any]:
        """Phân tích dữ liệu HR qua Vitexa Gateway"""
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
        model: str = "gpt-5.3-codex",
    ) -> Dict[str, Any]:
        """Trích xuất thông tin có cấu trúc từ văn bản"""
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
        model: str = "gpt-5.3-codex",
    ) -> Dict[str, Any]:
        """Sinh nội dung HR qua Vitexa Gateway"""
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
        model: str = "gpt-5.3-codex",
    ) -> Dict[str, Any]:
        """Tóm tắt nội dung qua Vitexa Gateway"""
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
        model: str = "gpt-5.3-codex",
        temperature: float = 0.7,
    ) -> Dict[str, Any]:
        """Chat completion đơn giản"""
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ]
        return await self.chat(messages, model=model, temperature=temperature)

    async def list_models(self) -> Dict[str, Any]:
        """
        Lấy danh sách model có sẵn trên Vitexa Gateway

        Returns:
            Dict chứa danh sách models
        """
        if not self.enabled:
            return {"success": False, "error": "Vitexa Gateway API key chưa được cấu hình", "models": []}

        try:
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.get(
                    f"{self.base_url}/models",
                    headers=self.headers,
                )
                response.raise_for_status()
                data = response.json()

            return {"success": True, "models": data.get("data", [])}

        except Exception as e:
            logger.error(f"Vitexa Gateway list models error: {e}")
            return {"success": False, "error": str(e), "models": []}


# Singleton instance
_openrouter_service: Optional[OpenRouterService] = None


def get_openrouter_service() -> OpenRouterService:
    """Get OpenRouter service singleton"""
    global _openrouter_service
    if _openrouter_service is None:
        _openrouter_service = OpenRouterService()
    return _openrouter_service


def reset_openrouter_service():
    """Reset OpenRouter service singleton"""
    global _openrouter_service
    _openrouter_service = None
