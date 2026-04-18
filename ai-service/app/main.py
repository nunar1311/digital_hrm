"""
Digital HRM AI Service - FastAPI Application Entry Point
Python Microservice cho AI integration vao He thong HRM
"""

# Windows multiprocessing fix - MUST be at the very top before any other imports
import sys
if sys.platform == "win32":
    import multiprocessing
    multiprocessing.freeze_support()
    # Set spawn method for Windows
    try:
        multiprocessing.set_start_method('spawn', force=True)
    except RuntimeError:
        pass  # Already set

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

# Import config first
from app.config import get_settings
from app.routers import (
    chat_router,
    analyze_router,
    extract_router,
    generate_router,
    summarize_router,
    recommend_router,
    dashboard_router,
    approval_router,
    copilot_router,
    ws_chat_router,
    data_analyst_router,
)
from app.middleware.rate_limiter import get_rate_limiter
from app.services.provider_router import get_provider_router
from app.database import init_db_pool, close_db_pool, check_db_health
from app.services.redis_service import init_redis, close_redis, check_redis_health, get_active_sessions_count
from app.services.queue_manager import get_ai_queue

# Configure logging
settings = get_settings()
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("ai-service.log")
    ]
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - startup and shutdown"""
    # Startup
    logger.info("Starting Digital HRM AI Service...")
    logger.info(f"Default provider: {settings.default_provider}")
    logger.info(f"Default model: {settings.default_model}")
    logger.info(f"Redis enabled: {settings.redis_enabled}")
    logger.info(f"Rate limit: {settings.rate_limit_per_minute} req/min, {settings.rate_limit_per_day} req/day")

    # Initialize AI provider
    try:
        provider_router = get_provider_router()
        logger.info("AI Provider router initialized")
    except Exception as e:
        logger.error(f"Failed to initialize provider router: {e}")

    # Initialize Redis
    try:
        redis_ok = await init_redis()
        if redis_ok:
            logger.info("Redis cache layer initialized")
        else:
            logger.warning("Redis not available - running without cache (in-memory fallback)")
    except Exception as e:
        logger.error(f"Failed to initialize Redis: {e}")

    # Initialize Database connection pool
    try:
        pool = await init_db_pool()
        if pool:
            logger.info("Database connection pool initialized successfully")
        else:
            logger.warning("Database not configured - AI will work without direct DB access")
    except Exception as e:
        logger.error(f"Failed to initialize database pool: {e}")

    # Initialize AI Request Queue
    try:
        queue = get_ai_queue()
        logger.info(f"AI Request Queue initialized (max_concurrent={settings.max_concurrent_ai_calls})")
    except Exception as e:
        logger.error(f"Failed to initialize AI queue: {e}")

    yield

    # Shutdown
    logger.info("Shutting down Digital HRM AI Service...")
    await close_redis()
    await close_db_pool()
    logger.info("Cleanup complete")


# Create FastAPI app
app = FastAPI(
    title="Digital HRM AI Service",
    description="Python Microservice for AI Integration with Digital HRM System",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "error": "Validation Error",
            "details": exc.errors(),
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal Server Error",
            "message": str(exc) if settings.log_level == "DEBUG" else "An unexpected error occurred",
        },
    )


# Include routers
app.include_router(chat_router, prefix="/api/ai", tags=["AI Chat"])
app.include_router(data_analyst_router, prefix="/api/ai/data-analyst", tags=["AI Data Analyst"])
app.include_router(analyze_router, prefix="/api/ai/analyze", tags=["AI Analysis"])
app.include_router(extract_router, prefix="/api/ai/extract", tags=["AI Extraction"])
app.include_router(generate_router, prefix="/api/ai/generate", tags=["AI Generation"])
app.include_router(summarize_router, prefix="/api/ai/summarize", tags=["AI Summarization"])
app.include_router(recommend_router, prefix="/api/ai/recommend", tags=["AI Recommendations"])
app.include_router(dashboard_router, prefix="/api/ai/dashboard", tags=["AI Dashboard"])
app.include_router(approval_router, prefix="/api/ai/approval", tags=["AI Approval"])
app.include_router(copilot_router, prefix="/api/ai/copilot", tags=["AI Copilot"])
app.include_router(ws_chat_router, prefix="/ws/ai", tags=["AI WebSocket"])


# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint with Redis and queue status"""
    db_health = await check_db_health()
    redis_health = await check_redis_health()
    ai_queue = get_ai_queue()
    active_sessions = await get_active_sessions_count()

    return {
        "status": "healthy",
        "service": "digital-hrm-ai",
        "version": "1.1.0",
        "default_provider": settings.default_provider,
        "default_model": settings.default_model,
        "database": db_health,
        "redis": redis_health,
        "ai_queue": ai_queue.get_status(),
        "active_sessions": active_sessions,
    }


# Database status endpoint
@app.get("/api/ai/db-status", tags=["Health"])
async def db_status():
    """Database connection status"""
    db_health = await check_db_health()
    return {
        "success": True,
        "database": db_health,
    }


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {
        "message": "Digital HRM AI Service",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }


# Cost tracking endpoint
@app.get("/api/ai/stats", tags=["Stats"])
async def get_cost_stats():
    """Get cost statistics"""
    return {
        "success": True,
        "data": {
            "monthly_cost_usd": 0.0,
            "monthly_tokens": 0,
            "request_count": 0,
            "cache_hit_rate": 0.0,
        },
    }


if __name__ == "__main__":
    import uvicorn
    
    # Windows + Python 3.14 + multiprocessing = crash with --reload
    # Force disable reload on Windows
    is_windows = sys.platform == "win32"
    should_reload = False  # Always disable reload
    
    print(f"Starting AI Service on {settings.service_host}:{settings.service_port}")
    if is_windows:
        print("Windows detected - reload disabled to avoid multiprocessing crash")
    
    uvicorn.run(
        "app.main:app",
        host=settings.service_host,
        port=settings.service_port,
        reload=should_reload,
        log_level=settings.log_level.lower(),
    )
