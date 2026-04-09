"""
Cache Middleware - Response caching using Redis
"""

import logging
import json
import hashlib
from typing import Optional, Any
from functools import lru_cache

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import settings

logger = logging.getLogger(__name__)


class CacheMiddleware(BaseHTTPMiddleware):
    """Middleware for caching AI responses"""

    def __init__(self, app, cache_ttl: int = None):
        super().__init__(app)
        self.cache_ttl = cache_ttl or settings.cache_ttl_seconds
        self.redis_client = None
        self._init_redis()

    def _init_redis(self):
        """Initialize Redis client"""
        if not settings.redis_enabled:
            return

        try:
            import redis.asyncio as redis

            self.redis_client = redis.from_url(
                settings.redis_url,
                encoding="utf-8",
                decode_responses=True,
            )
            logger.info("Redis cache middleware initialized")
        except Exception as e:
            logger.warning(f"Redis not available for caching: {e}")
            self.redis_client = None

    def _generate_cache_key(self, prefix: str, data: dict) -> str:
        """Generate cache key from request data"""
        # Create deterministic hash of request data
        data_str = json.dumps(data, sort_keys=True, ensure_ascii=False)
        hash_obj = hashlib.sha256(data_str.encode())
        return f"ai_cache:{prefix}:{hash_obj.hexdigest()[:16]}"

    async def get_cached(self, key: str) -> Optional[dict]:
        """Get cached response"""
        if not self.redis_client:
            return None

        try:
            cached = await self.redis_client.get(key)
            if cached:
                logger.debug(f"Cache hit: {key}")
                return json.loads(cached)
        except Exception as e:
            logger.error(f"Cache get error: {e}")

        return None

    async def set_cached(self, key: str, value: dict, ttl: int = None):
        """Set cached response"""
        if not self.redis_client:
            return

        try:
            ttl = ttl or self.cache_ttl
            await self.redis_client.setex(key, ttl, json.dumps(value, ensure_ascii=False))
            logger.debug(f"Cache set: {key} (TTL: {ttl}s)")
        except Exception as e:
            logger.error(f"Cache set error: {e}")

    async def invalidate_cache(self, pattern: str):
        """Invalidate cache entries matching pattern"""
        if not self.redis_client:
            return

        try:
            keys = []
            async for key in self.redis_client.scan_iter(match=f"ai_cache:{pattern}*"):
                keys.append(key)

            if keys:
                await self.redis_client.delete(*keys)
                logger.info(f"Cache invalidated: {len(keys)} keys")
        except Exception as e:
            logger.error(f"Cache invalidate error: {e}")

    async def dispatch(self, request: Request, call_next):
        # Only cache GET requests to specific endpoints
        if request.method != "GET":
            return await call_next(request)

        response = await call_next(request)
        return response


# Utility functions for manual caching
async def get_cached_response(cache_key: str) -> Optional[dict]:
    """Get cached AI response"""
    if not settings.redis_enabled:
        return None

    try:
        import redis.asyncio as redis

        client = redis.from_url(settings.redis_url, encoding="utf-8", decode_responses=True)
        cached = await client.get(cache_key)
        await client.close()
        return json.loads(cached) if cached else None
    except Exception as e:
        logger.error(f"Cache get error: {e}")
        return None


async def set_cached_response(cache_key: str, value: dict, ttl: int = None):
    """Set cached AI response"""
    if not settings.redis_enabled:
        return

    try:
        import redis.asyncio as redis

        client = redis.from_url(settings.redis_url, encoding="utf-8", decode_responses=True)
        await client.setex(cache_key, ttl or settings.cache_ttl_seconds, json.dumps(value, ensure_ascii=False))
        await client.close()
    except Exception as e:
        logger.error(f"Cache set error: {e}")


def generate_cache_key(prefix: str, **kwargs) -> str:
    """Generate cache key from keyword arguments"""
    data_str = json.dumps(kwargs, sort_keys=True, ensure_ascii=False)
    hash_obj = hashlib.sha256(data_str.encode())
    return f"ai_cache:{prefix}:{hash_obj.hexdigest()[:16]}"


class CacheManager:
    """Cache manager for AI responses"""

    def __init__(self, ttl: int = None):
        self.ttl = ttl or settings.cache_ttl_seconds
        self.redis_client = None
        self._init_redis()

    def _init_redis(self):
        if not settings.redis_enabled:
            return

        try:
            import redis.asyncio as redis

            self.redis_client = redis.from_url(
                settings.redis_url,
                encoding="utf-8",
                decode_responses=True,
            )
        except Exception as e:
            logger.warning(f"Redis not available: {e}")

    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if not self.redis_client:
            return None

        try:
            value = await self.redis_client.get(key)
            return json.loads(value) if value else None
        except Exception as e:
            logger.error(f"Cache get error: {e}")
            return None

    async def set(self, key: str, value: Any, ttl: int = None):
        """Set value in cache"""
        if not self.redis_client:
            return

        try:
            await self.redis_client.setex(
                key,
                ttl or self.ttl,
                json.dumps(value, ensure_ascii=False),
            )
        except Exception as e:
            logger.error(f"Cache set error: {e}")

    async def delete(self, key: str):
        """Delete value from cache"""
        if not self.redis_client:
            return

        try:
            await self.redis_client.delete(key)
        except Exception as e:
            logger.error(f"Cache delete error: {e}")

    async def close(self):
        """Close Redis connection"""
        if self.redis_client:
            await self.redis_client.close()


# Singleton
_cache_manager: Optional[CacheManager] = None


def get_cache_middleware(ttl: int = None) -> CacheMiddleware:
    """Get cache middleware (creates new instance)"""
    return CacheMiddleware(None, ttl)


def get_cache_manager() -> CacheManager:
    """Get cache manager singleton"""
    global _cache_manager
    if _cache_manager is None:
        _cache_manager = CacheManager()
    return _cache_manager
