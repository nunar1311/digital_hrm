"""
Approval Router - Intelligent Approval Engine API (Phase 2)
Endpoints de AI phan tich va khuyen nghi duyet/tu choi don
"""

import logging
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

from fastapi import APIRouter, Request
from app.services.approval_agent import ApprovalAgent
from app.middleware.rbac import extract_user_context

logger = logging.getLogger(__name__)
router = APIRouter()


class AnalyzeRequest(BaseModel):
    """Phan tich mot don yeu cau"""
    request_id: str = Field(..., description="ID đơn cần phân tích")


class BulkAnalyzeRequest(BaseModel):
    """Phan tich nhieu don"""
    request_ids: List[str] = Field(..., description="Danh sách ID đơn cần phân tích")


class PredictRequest(BaseModel):
    """Du doan ket qua duyet"""
    request_id: str = Field(..., description="ID đơn cần dự đoán")


@router.post("/analyze")
async def analyze_approval(request: AnalyzeRequest, raw_request: Request):
    """
    Phân tích đơn yêu cầu và đưa ra khuyến nghị AI.

    Trả về:
    - verdict: auto_approve / recommend_approve / escalate / recommend_reject
    - confidence: 0-100
    - matched_rules: Các rules đã match
    - ai_analysis: Phân tích AI (nếu có)
    - recommendation_text: Văn bản khuyến nghị
    """
    try:
        user_ctx = extract_user_context(raw_request)
        agent = ApprovalAgent()
        result = await agent.analyze_request(request.request_id, user_ctx.user_id or "")

        return {
            "success": True,
            **result,
        }
    except Exception as e:
        logger.error(f"Approval analysis error: {e}", exc_info=True)
        return {"success": False, "error": str(e)}


@router.post("/bulk-analyze")
async def bulk_analyze(request: BulkAnalyzeRequest, raw_request: Request):
    """
    Phân tích nhiều đơn yêu cầu cùng lúc.
    Hữu ích cho việc duyệt hàng loạt.
    """
    try:
        user_ctx = extract_user_context(raw_request)
        agent = ApprovalAgent()
        results = await agent.bulk_analyze(
            request.request_ids, user_ctx.user_id or ""
        )

        # Summary
        auto_count = sum(1 for r in results if r.get("verdict") == "auto_approve")
        approve_count = sum(1 for r in results if r.get("verdict") == "recommend_approve")
        escalate_count = sum(1 for r in results if r.get("verdict") == "escalate")
        reject_count = sum(1 for r in results if r.get("verdict") == "recommend_reject")

        return {
            "success": True,
            "results": results,
            "summary": {
                "total": len(results),
                "auto_approve": auto_count,
                "recommend_approve": approve_count,
                "escalate": escalate_count,
                "recommend_reject": reject_count,
            },
        }
    except Exception as e:
        logger.error(f"Bulk approval analysis error: {e}", exc_info=True)
        return {"success": False, "error": str(e)}


@router.post("/predict")
async def predict_approval(request: PredictRequest, raw_request: Request):
    """
    Dự đoán xác suất đơn được duyệt.
    Trả về verdict ngắn gọn.
    """
    try:
        user_ctx = extract_user_context(raw_request)
        agent = ApprovalAgent()
        result = await agent.analyze_request(request.request_id, user_ctx.user_id or "")

        # Simplified prediction
        return {
            "success": True,
            "request_id": request.request_id,
            "prediction": {
                "verdict": result.get("verdict"),
                "confidence": result.get("confidence"),
                "summary": result.get("recommendation_text", ""),
            },
        }
    except Exception as e:
        logger.error(f"Approval prediction error: {e}", exc_info=True)
        return {"success": False, "error": str(e)}
