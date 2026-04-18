"""
Configuration settings cho AI Service
Doc cac bien moi truong tu .env
"""

import os
from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Cau hinh AI Service - doc tu environment variables"""

    # API Keys
    openai_api_key: str = Field(default="", description="OpenAI API Key")
    anthropic_api_key: str = Field(
        default="", description="Anthropic Claude API Key")
    google_api_key: str = Field(
        default="", description="Google Gemini API Key")
    openrouter_api_key: str = Field(
        default="", description="OpenRouter API Key")
    openrouter_default_model: str = Field(
        default="google/gemini-2.0-flash-001", description="Default model cho OpenRouter")

    # Service Config
    service_host: str = Field(default="0.0.0.0", description="Service host")
    service_port: int = Field(default=8000, description="Service port")
    log_level: str = Field(default="INFO", description="Log level")

    # Redis
    redis_url: str = Field(
        default="redis://localhost:6379/0", description="Redis URL")
    redis_enabled: bool = Field(
        default=True, description="Enable Redis caching")
    redis_cache_ttl: int = Field(
        default=300, description="Default cache TTL in seconds (5 min)")
    redis_ai_cache_ttl: int = Field(
        default=600, description="AI response cache TTL in seconds (10 min)")

    # Rate Limiting
    rate_limit_per_minute: int = Field(
        default=60, description="Rate limit per minute per user")
    rate_limit_per_day: int = Field(
        default=1000, description="Rate limit per day per user")

    # Cache TTL (seconds)
    cache_ttl_seconds: int = Field(
        default=3600, description="Cache TTL in seconds")

    # AI Provider Defaults
    default_provider: str = Field(
        default="openai", description="Default AI provider")
    default_model: str = Field(default="gpt-4o", description="Default model")

    # Timeout
    request_timeout_seconds: int = Field(
        default=120, description="Request timeout")

    # Concurrency Control
    max_concurrent_ai_calls: int = Field(
        default=20, description="Max concurrent AI API calls")
    queue_timeout_seconds: int = Field(
        default=90, description="Max seconds to wait in AI queue")

    # Internal Auth (for Next.js calls)
    internal_api_key: str = Field(
        default="", description="Internal API key for Next.js auth")
    next_public_api_url: str = Field(
        default="http://localhost:3000", description="Next.js API URL")

    # Database (Direct PostgreSQL connection for AI analysis)
    database_url: str = Field(
        default="", description="PostgreSQL connection URL for AI data analysis")
    db_pool_min_size: int = Field(
        default=5, description="Minimum DB connection pool size")
    db_pool_max_size: int = Field(
        default=30, description="Maximum DB connection pool size")

    # Cost Tracking
    enable_cost_tracking: bool = Field(
        default=True, description="Enable cost tracking")
    max_cost_per_month_usd: float = Field(
        default=500.0, description="Max cost per month in USD")

    # Prompts
    prompts_dir: str = Field(default="app/prompts",
                             description="Prompts directory")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


def get_settings_instance() -> Settings:
    """Get a fresh settings instance (not cached)"""
    return Settings()


# Module-level singleton for convenience imports: from app.config import settings
settings = get_settings()
