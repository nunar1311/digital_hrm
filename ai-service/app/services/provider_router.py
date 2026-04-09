"""
Provider Router - Routes AI requests to appropriate provider
"""

import logging
from typing import Optional, Dict, Any, Literal
from functools import lru_cache

from app.config import settings
from app.services.openai_service import OpenAIService, get_openai_service
from app.services.anthropic_service import AnthropicService, get_anthropic_service
from app.services.google_ai_service import GoogleAIService, get_google_ai_service

logger = logging.getLogger(__name__)

# AI Provider types
ProviderType = Literal["openai", "anthropic", "google"]


class ProviderRouter:
    """Routes AI requests to the appropriate provider with fallback"""

    def __init__(self):
        self.openai = get_openai_service()
        self.anthropic = get_anthropic_service()
        self.google = get_google_ai_service()
        self.default_provider = settings.default_provider
        self.default_model = settings.default_model

    def get_provider(self, provider: Optional[str] = None) -> tuple:
        """
        Get the appropriate provider service

        Args:
            provider: Preferred provider (openai, anthropic, google)

        Returns:
            Tuple of (service_instance, provider_name, model)
        """
        # Try preferred provider first
        if provider == "openai" and self.openai.enabled:
            return (self.openai, "openai", "gpt-4o")
        elif provider == "anthropic" and self.anthropic.enabled:
            return (self.anthropic, "anthropic", "claude-3-5-sonnet-20241022")
        elif provider == "google" and self.google.enabled:
            return (self.google, "google", "gemini-2.5-flash")

        # Fallback to default provider
        if self.default_provider == "openai" and self.openai.enabled:
            return (self.openai, "openai", self.default_model if self.default_provider == "openai" else "gpt-4o")
        elif self.default_provider == "anthropic" and self.anthropic.enabled:
            return (self.anthropic, "anthropic", self.default_model if self.default_provider == "anthropic" else "claude-3-5-sonnet-20241022")
        elif self.default_provider == "google" and self.google.enabled:
            return (self.google, "google", self.default_model if self.default_provider == "google" else "gemini-2.5-flash")

        # Last resort - any available provider
        if self.openai.enabled:
            return (self.openai, "openai", "gpt-4o")
        if self.anthropic.enabled:
            return (self.anthropic, "anthropic", "claude-3-5-sonnet-20241022")
        if self.google.enabled:
            return (self.google, "google", "gemini-2.5-flash")

        # No provider available
        return (None, None, None)

    async def chat(
        self,
        messages: list,
        provider: Optional[str] = None,
        model: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """Route chat request to appropriate provider"""
        service, provider_name, default_model = self.get_provider(provider)

        if not service:
            return {
                "success": False,
                "error": "No AI provider available. Please configure at least one API key.",
                "content": None,
                "usage": None,
            }

        target_model = model or default_model
        result = await service.chat(messages, model=target_model, **kwargs)
        result["provider"] = provider_name
        return result

    async def analyze(
        self,
        prompt: str,
        data: Dict[str, Any],
        provider: Optional[str] = None,
        model: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Route analysis request"""
        service, provider_name, default_model = self.get_provider(provider)

        if not service:
            return {
                "success": False,
                "error": "No AI provider available",
                "content": None,
                "usage": None,
            }

        target_model = model or default_model
        result = await service.analyze(prompt, data, model=target_model)
        result["provider"] = provider_name
        return result

    async def extract(
        self,
        text: str,
        extraction_type: str,
        schema: Optional[Dict] = None,
        provider: Optional[str] = None,
        model: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Route extraction request"""
        service, provider_name, default_model = self.get_provider(provider)

        if not service:
            return {
                "success": False,
                "error": "No AI provider available",
                "content": None,
                "usage": None,
            }

        target_model = model or default_model
        result = await service.extract(text, extraction_type, schema, model=target_model)
        result["provider"] = provider_name
        return result

    async def generate(
        self,
        prompt: str,
        context: Optional[Dict[str, Any]] = None,
        provider: Optional[str] = None,
        model: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Route generation request"""
        service, provider_name, default_model = self.get_provider(provider)

        if not service:
            return {
                "success": False,
                "error": "No AI provider available",
                "content": None,
                "usage": None,
            }

        target_model = model or default_model
        result = await service.generate(prompt, context, model=target_model)
        result["provider"] = provider_name
        return result

    async def summarize(
        self,
        content: str,
        summary_type: str = "general",
        max_length: int = 500,
        provider: Optional[str] = None,
        model: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Route summarization request"""
        service, provider_name, default_model = self.get_provider(provider)

        if not service:
            return {
                "success": False,
                "error": "No AI provider available",
                "content": None,
                "usage": None,
            }

        target_model = model or default_model
        result = await service.summarize(content, summary_type, max_length, model=target_model)
        result["provider"] = provider_name
        return result

    async def chat_completion(
        self,
        system_prompt: str,
        user_message: str,
        provider: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.7,
    ) -> Dict[str, Any]:
        """Route simple chat completion"""
        service, provider_name, default_model = self.get_provider(provider)

        if not service:
            return {
                "success": False,
                "error": "No AI provider available",
                "content": None,
                "usage": None,
            }

        target_model = model or default_model
        result = await service.chat_completion(
            system_prompt, user_message, model=target_model, temperature=temperature
        )
        result["provider"] = provider_name
        return result

    def get_available_providers(self) -> Dict[str, bool]:
        """Get status of all providers"""
        return {
            "openai": self.openai.enabled,
            "anthropic": self.anthropic.enabled,
            "google": self.google.enabled,
        }

    def get_best_provider_for_task(self, task: str) -> str:
        """
        Get the best provider for a specific task

        Args:
            task: Task type (analysis, extraction, generation, summarization, chat)

        Returns:
            Best provider name
        """
        # Claude is best for long-form analysis and nuanced tasks
        if task in ["analysis", "extraction"] and self.anthropic.enabled:
            return "anthropic"
        # Gemini is fast and cost-effective for simple tasks
        if task in ["chat", "summarize"] and self.google.enabled:
            return "google"
        # Default to OpenAI
        if self.openai.enabled:
            return "openai"
        # Fallback to any available
        if self.anthropic.enabled:
            return "anthropic"
        if self.google.enabled:
            return "google"
        return "none"


# Singleton instance
_provider_router: Optional[ProviderRouter] = None


def get_provider_router() -> ProviderRouter:
    """Get provider router singleton"""
    global _provider_router
    if _provider_router is None:
        _provider_router = ProviderRouter()
    return _provider_router


def reset_provider_router():
    """Reset provider router singleton"""
    global _provider_router
    _provider_router = None
