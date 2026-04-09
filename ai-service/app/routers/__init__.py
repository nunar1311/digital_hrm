"""
AI Service Routers - API endpoint handlers
"""

from app.routers.chat import router as chat_router
from app.routers.analyze import router as analyze_router
from app.routers.extract import router as extract_router
from app.routers.generate import router as generate_router
from app.routers.summarize import router as summarize_router
from app.routers.recommend import router as recommend_router
from app.routers.dashboard import router as dashboard_router

__all__ = [
    "chat_router",
    "analyze_router",
    "extract_router",
    "generate_router",
    "summarize_router",
    "recommend_router",
    "dashboard_router",
]
