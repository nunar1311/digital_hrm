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
from app.routers.approval import router as approval_router
from app.routers.copilot import router as copilot_router
from app.routers.ws_chat import router as ws_chat_router
from app.routers.data_analyst import router as data_analyst_router


__all__ = [
    "chat_router",
    "analyze_router",
    "extract_router",
    "generate_router",
    "summarize_router",
    "recommend_router",
    "dashboard_router",
    "approval_router",
    "copilot_router",
    "ws_chat_router",
    "data_analyst_router",
]

