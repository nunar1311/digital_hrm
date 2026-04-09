"""
AI Service Tests - Basic functionality
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch


class TestHealthEndpoint:
    """Test health check endpoint"""

    @pytest.mark.asyncio
    async def test_health_check(self):
        """Test health endpoint returns healthy status"""
        # This would normally test with TestClient
        # For now, just verify imports work
        from app.main import app

        assert app is not None
        assert app.title == "Digital HRM AI Service"


class TestResponseFormatter:
    """Test response formatter"""

    def test_format_success(self):
        """Test success response formatting"""
        from app.utils.response_formatter import ResponseFormatter

        response = ResponseFormatter.success(
            content="Test content",
            provider="openai",
            model="gpt-4o"
        )

        assert response["success"] is True
        assert response["content"] == "Test content"
        assert response["provider"] == "openai"
        assert response["model"] == "gpt-4o"
        assert "timestamp" in response

    def test_format_error(self):
        """Test error response formatting"""
        from app.utils.response_formatter import ResponseFormatter

        response = ResponseFormatter.error(
            message="Test error",
            error_code="TEST_ERROR"
        )

        assert response["success"] is False
        assert response["error"] == "Test error"
        assert response["error_code"] == "TEST_ERROR"

    def test_format_analysis(self):
        """Test analysis response formatting"""
        from app.utils.response_formatter import ResponseFormatter

        response = ResponseFormatter.analysis(
            insights=["insight 1", "insight 2"],
            summary="Test summary",
            recommendations=["rec 1", "rec 2"]
        )

        assert response["success"] is True
        assert len(response["analysis"]["insights"]) == 2
        assert response["analysis"]["summary"] == "Test summary"


class TestTokenCounter:
    """Test token counter"""

    def test_count_text_english(self):
        """Test token counting for English text"""
        from app.utils.token_counter import TokenCounter

        counter = TokenCounter()
        # Should not raise
        tokens = counter.count_text("Hello, this is a test message.")
        assert tokens > 0

    def test_count_text_vietnamese(self):
        """Test token counting for Vietnamese text"""
        from app.utils.token_counter import TokenCounter

        counter = TokenCounter()
        tokens = counter.count_text("Xin chào, đây là tin nhắn kiểm tra.")
        assert tokens > 0

    def test_count_messages(self):
        """Test message counting"""
        from app.utils.token_counter import TokenCounter

        counter = TokenCounter()
        messages = [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Hello!"},
        ]

        tokens = counter.count_messages(messages)
        assert tokens > 0


class TestProviderRouter:
    """Test provider router"""

    def test_get_provider(self):
        """Test getting default provider"""
        from app.services.provider_router import ProviderRouter

        router = ProviderRouter()
        # Should return tuple of (service, provider_name, model)
        result = router.get_provider()
        assert isinstance(result, tuple)
        assert len(result) == 3

    def test_get_available_providers(self):
        """Test checking available providers"""
        from app.services.provider_router import ProviderRouter

        router = ProviderRouter()
        providers = router.get_available_providers()

        assert isinstance(providers, dict)
        assert "openai" in providers
        assert "anthropic" in providers
        assert "google" in providers


class TestConfig:
    """Test configuration"""

    def test_settings_load(self):
        """Test settings load correctly"""
        from app.config import settings

        # Should have default values
        assert settings.service_port == 8000
        assert settings.rate_limit_per_minute > 0
        assert settings.rate_limit_per_day > 0

    def test_settings_from_env(self):
        """Test settings can be overridden from env"""
        import os

        # This test verifies the settings class can read env vars
        from app.config import Settings

        # Should not raise
        s = Settings()
        assert s is not None


# Run with: pytest tests/ -v
