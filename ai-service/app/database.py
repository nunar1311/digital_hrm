"""
Database Connection Pool - Async PostgreSQL cho AI Service
Ket noi truc tiep vao PostgreSQL de lay du lieu HR cho phan tich AI
"""

import logging
from typing import Optional
import asyncpg

from app.config import get_settings

logger = logging.getLogger(__name__)

# Global connection pool
_pool: Optional[asyncpg.Pool] = None


async def init_db_pool(max_retries: int = 3) -> Optional[asyncpg.Pool]:
    """Khoi tao connection pool den PostgreSQL voi retry logic"""
    global _pool
    settings = get_settings()

    if not settings.database_url:
        logger.warning("DATABASE_URL not configured - AI Service will work without direct DB access")
        return None

    import asyncio

    for attempt in range(1, max_retries + 1):
        try:
            _pool = await asyncpg.create_pool(
                dsn=settings.database_url,
                min_size=settings.db_pool_min_size,
                max_size=settings.db_pool_max_size,
                command_timeout=30,
            )
            # Test connection
            async with _pool.acquire() as conn:
                version = await conn.fetchval("SELECT version()")
                logger.info(
                    f"Database connected (pool min={settings.db_pool_min_size}, "
                    f"max={settings.db_pool_max_size}): {version[:50]}..."
                )

            return _pool
        except Exception as e:
            logger.error(f"DB connection attempt {attempt}/{max_retries} failed: {e}")
            _pool = None
            if attempt < max_retries:
                wait = 2 ** attempt
                logger.info(f"Retrying in {wait}s...")
                await asyncio.sleep(wait)

    logger.error(f"Failed to connect to database after {max_retries} attempts")
    return None


async def close_db_pool():
    """Dong connection pool"""
    global _pool
    if _pool:
        await _pool.close()
        _pool = None
        logger.info("Database connection pool closed")


def get_db_pool() -> Optional[asyncpg.Pool]:
    """Lay connection pool hien tai"""
    return _pool


async def check_db_health() -> dict:
    """Kiem tra trang thai database connection"""
    if not _pool:
        return {
            "status": "disconnected",
            "message": "Database pool not initialized",
        }

    try:
        async with _pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
        return {
            "status": "healthy",
            "pool_size": _pool.get_size(),
            "pool_free": _pool.get_idle_size(),
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
        }
