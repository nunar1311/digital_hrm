"""
Redis Service - Async Redis connection pool + Caching layer
Cung cap cache cho DB queries va AI responses, giam tai cho database va AI API.
Graceful degradation: neu Redis khong kha dung, he thong van chay binh thuong (khong cache).
"""

import json
import hashlib
import logging
import time
from typing import Optional, Any, Callable
from functools import wraps

from app.config import get_settings

logger = logging.getLogger(__name__)

# Global Redis client
_redis_client = None
_redis_available = False


async def init_redis() -> bool:
    """Khoi tao Redis connection pool"""
    global _redis_client, _redis_available
    settings = get_settings()

    if not settings.redis_enabled:
        logger.info("Redis disabled in config")
        return False

    try:
        import redis.asyncio as aioredis

        _redis_client = aioredis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True,
            max_connections=20,
            socket_connect_timeout=5,
            socket_timeout=5,
            retry_on_timeout=True,
        )

        # Test connection
        await _redis_client.ping()
        _redis_available = True
        logger.info(f"Redis connected successfully: {settings.redis_url}")
        return True

    except Exception as e:
        logger.warning(f"Redis not available, running without cache: {e}")
        _redis_client = None
        _redis_available = False
        return False


async def close_redis():
    """Dong Redis connection"""
    global _redis_client, _redis_available
    if _redis_client:
        try:
            await _redis_client.close()
        except Exception:
            pass
        _redis_client = None
        _redis_available = False
        logger.info("Redis connection closed")


def get_redis():
    """Lay Redis client hien tai (co the None)"""
    return _redis_client


def is_redis_available() -> bool:
    """Kiem tra Redis co kha dung khong"""
    return _redis_available and _redis_client is not None


async def check_redis_health() -> dict:
    """Kiem tra trang thai Redis"""
    if not _redis_client:
        return {
            "status": "disconnected",
            "message": "Redis not initialized",
        }

    try:
        start = time.time()
        await _redis_client.ping()
        latency_ms = round((time.time() - start) * 1000, 2)

        info = await _redis_client.info("memory")
        used_memory = info.get("used_memory_human", "N/A")

        # Get cache stats
        stats = await get_cache_stats()

        return {
            "status": "healthy",
            "latency_ms": latency_ms,
            "used_memory": used_memory,
            "cache_stats": stats,
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
        }


# =====================
# Caching Utilities
# =====================

def _make_cache_key(prefix: str, *args, **kwargs) -> str:
    """Tao cache key tu prefix + arguments"""
    key_data = json.dumps({"args": args, "kwargs": kwargs}, sort_keys=True, default=str)
    key_hash = hashlib.md5(key_data.encode()).hexdigest()[:12]
    return f"hrm:{prefix}:{key_hash}"


async def cache_get(key: str) -> Optional[Any]:
    """Lay gia tri tu cache"""
    if not is_redis_available():
        return None

    try:
        data = await _redis_client.get(key)
        if data:
            return json.loads(data)
        return None
    except Exception as e:
        logger.debug(f"Cache get error for {key}: {e}")
        return None


async def cache_set(key: str, value: Any, ttl: int = 300) -> bool:
    """Luu gia tri vao cache"""
    if not is_redis_available():
        return False

    try:
        serialized = json.dumps(value, default=str, ensure_ascii=False)
        await _redis_client.set(key, serialized, ex=ttl)
        return True
    except Exception as e:
        logger.debug(f"Cache set error for {key}: {e}")
        return False


async def cache_delete(key: str) -> bool:
    """Xoa cache entry"""
    if not is_redis_available():
        return False

    try:
        await _redis_client.delete(key)
        return True
    except Exception as e:
        logger.debug(f"Cache delete error for {key}: {e}")
        return False


async def cache_clear_prefix(prefix: str) -> int:
    """Xoa tat ca cache co prefix nhat dinh"""
    if not is_redis_available():
        return 0

    try:
        keys = []
        async for key in _redis_client.scan_iter(match=f"hrm:{prefix}:*", count=100):
            keys.append(key)

        if keys:
            await _redis_client.delete(*keys)

        return len(keys)
    except Exception as e:
        logger.debug(f"Cache clear error for prefix {prefix}: {e}")
        return 0


# =====================
# Cache Decorator
# =====================

def redis_cache(prefix: str, ttl: int = 300):
    """
    Decorator de cache ket qua function trong Redis.

    Usage:
        @redis_cache(prefix="leave_balance", ttl=300)
        async def get_leave_balance(employee_id: str):
            ...  # Query DB

    Neu Redis khong kha dung, function chay binh thuong (khong cache).
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Bypass cache if Redis is not available
            if not is_redis_available():
                return await func(*args, **kwargs)

            # Build cache key
            cache_key = _make_cache_key(prefix, *args, **kwargs)

            # Try to get from cache
            cached = await cache_get(cache_key)
            if cached is not None:
                logger.debug(f"Cache HIT: {cache_key}")
                return cached

            # Cache miss - execute function
            logger.debug(f"Cache MISS: {cache_key}")
            result = await func(*args, **kwargs)

            # Store in cache (fire and forget)
            if result is not None:
                await cache_set(cache_key, result, ttl)

            return result

        # Expose cache invalidation method
        wrapper.invalidate = lambda *args, **kwargs: cache_delete(
            _make_cache_key(prefix, *args, **kwargs)
        )
        wrapper.clear_all = lambda: cache_clear_prefix(prefix)

        return wrapper
    return decorator


# =====================
# AI Response Cache
# =====================

def _make_ai_cache_key(message: str, user_role: str, has_full_access: bool) -> str:
    """Tao cache key cho AI response"""
    key_data = json.dumps({
        "msg": message.strip().lower(),
        "role": user_role,
        "full": has_full_access,
    }, sort_keys=True)
    key_hash = hashlib.md5(key_data.encode()).hexdigest()[:16]
    return f"hrm:ai_resp:{key_hash}"


async def get_ai_response_cache(
    message: str,
    user_role: str,
    has_full_access: bool,
) -> Optional[dict]:
    """Lay AI response tu cache"""
    key = _make_ai_cache_key(message, user_role, has_full_access)
    return await cache_get(key)


async def set_ai_response_cache(
    message: str,
    user_role: str,
    has_full_access: bool,
    response: dict,
    ttl: Optional[int] = None,
) -> bool:
    """Cache AI response"""
    settings = get_settings()
    cache_ttl = ttl or settings.redis_ai_cache_ttl

    key = _make_ai_cache_key(message, user_role, has_full_access)
    return await cache_set(key, response, cache_ttl)


# =====================
# Request Deduplication
# =====================

async def check_dedup(user_id: str, message: str, window_seconds: int = 5) -> Optional[str]:
    """
    Kiem tra xem user da gui cung message trong N giay chua.
    Tra ve request_id cu neu trung lap, None neu la request moi.
    """
    if not is_redis_available():
        return None

    try:
        dedup_key = f"hrm:dedup:{user_id}:{hashlib.md5(message.encode()).hexdigest()[:10]}"
        existing = await _redis_client.get(dedup_key)
        return existing
    except Exception:
        return None


async def set_dedup(user_id: str, message: str, request_id: str, window_seconds: int = 5):
    """Danh dau request de dedup"""
    if not is_redis_available():
        return

    try:
        dedup_key = f"hrm:dedup:{user_id}:{hashlib.md5(message.encode()).hexdigest()[:10]}"
        await _redis_client.set(dedup_key, request_id, ex=window_seconds)
    except Exception:
        pass


# =====================
# Cache Statistics
# =====================

_cache_hits = 0
_cache_misses = 0


async def get_cache_stats() -> dict:
    """Lay thong ke cache"""
    if not is_redis_available():
        return {"status": "disabled"}

    try:
        # Count keys by prefix
        db_keys = 0
        ai_keys = 0
        dedup_keys = 0

        async for _ in _redis_client.scan_iter(match="hrm:hr_data:*", count=100):
            db_keys += 1
        async for _ in _redis_client.scan_iter(match="hrm:ai_resp:*", count=100):
            ai_keys += 1
        async for _ in _redis_client.scan_iter(match="hrm:dedup:*", count=100):
            dedup_keys += 1

        return {
            "status": "active",
            "db_cache_entries": db_keys,
            "ai_cache_entries": ai_keys,
            "dedup_entries": dedup_keys,
            "total_entries": db_keys + ai_keys + dedup_keys,
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}


# =====================
# Active Sessions Tracking
# =====================

async def track_active_session(user_id: str, session_id: str):
    """Track user active session"""
    if not is_redis_available():
        return

    try:
        await _redis_client.hset("hrm:active_sessions", user_id, session_id)
        await _redis_client.expire("hrm:active_sessions", 3600)  # 1 hour TTL
    except Exception:
        pass


async def get_active_sessions_count() -> int:
    """Dem so user dang active"""
    if not is_redis_available():
        return 0

    try:
        return await _redis_client.hlen("hrm:active_sessions")
    except Exception:
        return 0
