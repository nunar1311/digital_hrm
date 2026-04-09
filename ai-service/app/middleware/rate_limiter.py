"""
Rate Limiter Middleware - Request rate limiting using Redis
"""

import logging
import time
from typing import Optional, Dict, Any
from collections import defaultdict

from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.config import settings

logger = logging.getLogger(__name__)


class RateLimiter:
    """In-memory rate limiter with Redis backend support"""

    def __init__(self):
        self.requests_per_minute = settings.rate_limit_per_minute
        self.requests_per_day = settings.rate_limit_per_day

        # In-memory storage (for when Redis is unavailable)
        self.minute_counts: Dict[str, list] = defaultdict(list)
        self.day_counts: Dict[str, int] = defaultdict(int)
        self.day_start: Dict[str, float] = defaultdict(float)

        # Redis client (optional)
        self.redis_client = None
        self._init_redis()

    def _init_redis(self):
        """Initialize Redis client if available"""
        if not settings.redis_enabled:
            return

        try:
            import redis.asyncio as redis

            self.redis_client = redis.from_url(
                settings.redis_url,
                encoding="utf-8",
                decode_responses=True,
            )
            logger.info("Redis rate limiter initialized")
        except Exception as e:
            logger.warning(f"Redis not available, using in-memory rate limiting: {e}")
            self.redis_client = None

    def _get_client_key(self, request: Request) -> str:
        """Get client identifier from request"""
        # Try to get user ID from auth header
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            # Use user ID from token
            return f"user:{auth_header[7:20]}"  # Simplified

        # Fallback to IP
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            ip = forwarded.split(",")[0].strip()
        else:
            ip = request.client.host if request.client else "unknown"

        return f"ip:{ip}"

    async def check_rate_limit(self, request: Request) -> Dict[str, Any]:
        """
        Check if request is within rate limit

        Returns:
            Dict with allowed, remaining, reset_time
        """
        client_key = self._get_client_key(request)
        current_time = time.time()

        # Try Redis first
        if self.redis_client:
            return await self._check_redis(client_key, current_time)

        # Fallback to in-memory
        return self._check_memory(client_key, current_time)

    async def _check_redis(self, client_key: str, current_time: float) -> Dict[str, Any]:
        """Check rate limit using Redis"""
        try:
            minute_key = f"ratelimit:{client_key}:minute"
            day_key = f"ratelimit:{client_key}:day"

            # Atomic check and increment for minute
            minute_count = await self.redis_client.incr(minute_key)
            if minute_count == 1:
                await self.redis_client.expire(minute_key, 60)

            # Atomic check and increment for day
            day_count = await self.redis_client.incr(day_key)
            if day_count == 1:
                await self.redis_client.expire(day_key, 86400)

            minute_remaining = max(0, self.requests_per_minute - minute_count)
            day_remaining = max(0, self.requests_per_day - day_count)

            if minute_count > self.requests_per_minute:
                ttl = await self.redis_client.ttl(minute_key)
                return {
                    "allowed": False,
                    "remaining_minute": 0,
                    "remaining_day": day_remaining,
                    "reset_in_seconds": ttl,
                    "reason": "Rate limit exceeded (per minute)",
                }

            if day_count > self.requests_per_day:
                ttl = await self.redis_client.ttl(day_key)
                return {
                    "allowed": False,
                    "remaining_minute": minute_remaining,
                    "remaining_day": 0,
                    "reset_in_seconds": ttl,
                    "reason": "Rate limit exceeded (per day)",
                }

            return {
                "allowed": True,
                "remaining_minute": minute_remaining,
                "remaining_day": day_remaining,
                "reset_in_seconds": 60,
            }

        except Exception as e:
            logger.error(f"Redis rate limit check failed: {e}")
            # Fail open - allow request
            return {"allowed": True, "remaining_minute": self.requests_per_minute, "remaining_day": self.requests_per_day}

    def _check_memory(self, client_key: str, current_time: float) -> Dict[str, Any]:
        """Check rate limit using in-memory storage"""
        current_minute = int(current_time // 60)
        current_day = int(current_time // 86400)

        # Clean old entries
        self.minute_counts[client_key] = [
            t for t in self.minute_counts[client_key] if current_time - t < 60
        ]

        # Check minute limit
        if len(self.minute_counts[client_key]) >= self.requests_per_minute:
            oldest = self.minute_counts[client_key][0]
            reset_in = int(60 - (current_time - oldest))
            return {
                "allowed": False,
                "remaining_minute": 0,
                "remaining_day": max(0, self.requests_per_day - self.day_counts[client_key]),
                "reset_in_seconds": reset_in,
                "reason": "Rate limit exceeded (per minute)",
            }

        # Check day limit
        if self.day_counts.get(client_key, 0) >= self.requests_per_day:
            reset_in = int(86400 - (current_time - self.day_start.get(client_key, current_time)))
            return {
                "allowed": False,
                "remaining_minute": self.requests_per_minute - len(self.minute_counts[client_key]),
                "remaining_day": 0,
                "reset_in_seconds": reset_in,
                "reason": "Rate limit exceeded (per day)",
            }

        # Record request
        self.minute_counts[client_key].append(current_time)

        if self.day_start.get(client_key, 0) < (current_day * 86400):
            self.day_counts[client_key] = 0
            self.day_start[client_key] = current_day * 86400

        self.day_counts[client_key] += 1

        return {
            "allowed": True,
            "remaining_minute": self.requests_per_minute - len(self.minute_counts[client_key]),
            "remaining_day": self.requests_per_day - self.day_counts[client_key],
            "reset_in_seconds": 60,
        }

    async def close(self):
        """Close Redis connection"""
        if self.redis_client:
            await self.redis_client.close()


class RateLimiterMiddleware(BaseHTTPMiddleware):
    """FastAPI middleware for rate limiting"""

    def __init__(self, app, rate_limiter: Optional[RateLimiter] = None):
        super().__init__(app)
        self.rate_limiter = rate_limiter or get_rate_limiter()

    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks
        if request.url.path in ["/health", "/", "/docs", "/openapi.json"]:
            return await call_next(request)

        # Check rate limit
        result = await self.rate_limiter.check_rate_limit(request)

        # Add rate limit headers
        headers = {
            "X-RateLimit-Remaining-Minute": str(result["remaining_minute"]),
            "X-RateLimit-Remaining-Day": str(result["remaining_day"]),
            "X-RateLimit-Reset-In": str(result["reset_in_seconds"]),
        }

        if not result["allowed"]:
            return JSONResponse(
                status_code=429,
                content={
                    "success": False,
                    "error": "Rate Limit Exceeded",
                    "message": result["reason"],
                    "retry_after_seconds": result["reset_in_seconds"],
                },
                headers=headers,
            )

        response = await call_next(request)

        # Add headers to successful responses
        for key, value in headers.items():
            response.headers[key] = value

        return response


# Singleton instance
_rate_limiter: Optional[RateLimiter] = None


def get_rate_limiter() -> RateLimiter:
    """Get rate limiter singleton"""
    global _rate_limiter
    if _rate_limiter is None:
        _rate_limiter = RateLimiter()
    return _rate_limiter


def reset_rate_limiter():
    """Reset rate limiter singleton"""
    global _rate_limiter
    if _rate_limiter:
        import asyncio

        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                loop.create_task(_rate_limiter.close())
            else:
                asyncio.run(_rate_limiter.close())
        except Exception:
            pass
    _rate_limiter = None
