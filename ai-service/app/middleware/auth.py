"""
Auth Middleware - Internal API authentication for Next.js calls
"""

import logging
import hashlib
import hmac
from typing import Optional

from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.config import settings

logger = logging.getLogger(__name__)


class InternalAuthMiddleware(BaseHTTPMiddleware):
    """Middleware to authenticate internal calls from Next.js"""

    def __init__(self, app):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):
        # Skip auth for public endpoints
        public_paths = [
            "/health",
            "/",
            "/docs",
            "/redoc",
            "/openapi.json",
            "/api/ai/stats",
        ]

        if request.url.path in public_paths or request.url.path.startswith("/docs"):
            return await call_next(request)

        # Check for internal API key
        api_key = request.headers.get("X-Internal-API-Key")

        if settings.internal_api_key and api_key:
            if not self._verify_api_key(api_key):
                logger.warning(f"Invalid internal API key from {request.client.host}")
                return JSONResponse(
                    status_code=401,
                    content={
                        "success": False,
                        "error": "Unauthorized",
                        "message": "Invalid API key",
                    },
                )

        # Allow request to proceed
        # In production, you might want stricter authentication
        return await call_next(request)

    def _verify_api_key(self, provided_key: str) -> bool:
        """Verify the provided API key matches"""
        if not settings.internal_api_key:
            return True  # No auth required if not configured

        # Simple comparison (in production, use constant-time comparison)
        return hmac.compare_digest(provided_key, settings.internal_api_key)


def verify_internal_auth(api_key: Optional[str] = None) -> bool:
    """
    Verify internal authentication

    Args:
        api_key: API key to verify

    Returns:
        True if authorized
    """
    if not settings.internal_api_key:
        return True

    if not api_key:
        return False

    return hmac.compare_digest(api_key, settings.internal_api_key)


async def require_auth(request: Request):
    """Require authentication for a request"""
    api_key = request.headers.get("X-Internal-API-Key")

    if not verify_internal_auth(api_key):
        raise HTTPException(status_code=401, detail="Unauthorized")


def create_internal_api_key() -> str:
    """
    Create a new internal API key

    Returns:
        New API key string
    """
    import secrets

    return secrets.token_urlsafe(32)
