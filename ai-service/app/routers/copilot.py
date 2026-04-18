"""
Copilot Router - Manager AI Copilot API (Phase 5)
Endpoints cho AI dong hanh voi Manager/Director
"""

import logging
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

from fastapi import APIRouter, Request
from app.services.copilot_service import CopilotService
from app.middleware.rbac import extract_user_context

logger = logging.getLogger(__name__)
router = APIRouter()


class TeamHealthRequest(BaseModel):
    """Team health analysis request"""
    pass  # Uses user context from headers


class OneOnOnePrepRequest(BaseModel):
    """1-on-1 meeting prep request"""
    employee_id: str = Field(..., description="ID nhân viên cần chuẩn bị 1-on-1")


class PerformanceNudgeRequest(BaseModel):
    """Performance feedback suggestions"""
    pass  # Uses user context from headers


class MeetingAgendaRequest(BaseModel):
    """Meeting agenda generation"""
    topic: Optional[str] = Field(None, description="Chủ đề cuộc họp (tùy chọn)")


class OrgInsightsRequest(BaseModel):
    """Org structure analysis"""
    pass  # Uses user context from headers


@router.post("/team-health")
async def team_health(request: TeamHealthRequest, raw_request: Request):
    """
    Phân tích sức khỏe team: chấm công, OT, nghỉ phép, đơn chờ duyệt.
    Trả về health score và AI summary.
    """
    try:
        user_ctx = extract_user_context(raw_request)
        copilot = CopilotService()
        result = await copilot.get_insight(
            "team_health",
            manager_id=user_ctx.user_id or "",
        )
        return result
    except Exception as e:
        logger.error(f"Team health error: {e}", exc_info=True)
        return {"success": False, "error": str(e)}


@router.post("/1on1-prep")
async def one_on_one_prep(request: OneOnOnePrepRequest, raw_request: Request):
    """
    Chuẩn bị cho cuộc họp 1-on-1 với nhân viên.
    Trả về thông tin nhân viên, chấm công, talking points.
    """
    try:
        user_ctx = extract_user_context(raw_request)
        copilot = CopilotService()
        result = await copilot.get_insight(
            "1on1_prep",
            manager_id=user_ctx.user_id or "",
            target_employee_id=request.employee_id,
        )
        return result
    except Exception as e:
        logger.error(f"1-on-1 prep error: {e}", exc_info=True)
        return {"success": False, "error": str(e)}


@router.post("/performance-nudge")
async def performance_nudge(request: PerformanceNudgeRequest, raw_request: Request):
    """
    Gợi ý feedback cho các thành viên team cần lưu ý.
    Dựa trên chấm công, OT, vắng mặt.
    """
    try:
        user_ctx = extract_user_context(raw_request)
        copilot = CopilotService()
        result = await copilot.get_insight(
            "performance_nudge",
            manager_id=user_ctx.user_id or "",
        )
        return result
    except Exception as e:
        logger.error(f"Performance nudge error: {e}", exc_info=True)
        return {"success": False, "error": str(e)}


@router.post("/meeting-agenda")
async def meeting_agenda(request: MeetingAgendaRequest, raw_request: Request):
    """
    Tạo agenda cuộc họp team tự động.
    Dựa trên context team hiện tại.
    """
    try:
        user_ctx = extract_user_context(raw_request)
        copilot = CopilotService()
        result = await copilot.get_insight(
            "meeting_agenda",
            manager_id=user_ctx.user_id or "",
        )
        return result
    except Exception as e:
        logger.error(f"Meeting agenda error: {e}", exc_info=True)
        return {"success": False, "error": str(e)}


@router.post("/org-insights")
async def org_insights(request: OrgInsightsRequest, raw_request: Request):
    """
    Phân tích cấu trúc tổ chức: phòng ban, số lượng, thâm niên.
    """
    try:
        user_ctx = extract_user_context(raw_request)
        copilot = CopilotService()
        result = await copilot.get_insight(
            "org_insights",
            manager_id=user_ctx.user_id or "",
        )
        return result
    except Exception as e:
        logger.error(f"Org insights error: {e}", exc_info=True)
        return {"success": False, "error": str(e)}
