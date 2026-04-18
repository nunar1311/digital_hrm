"""
Approval Agent - Intelligent Approval Engine (Phase 2)
AI tu dong phan tich don nghi phep/OT va dua ra khuyen nghi:
- Auto-approve: Don don gian, it rui ro
- Escalate: Don phuc tap can manager review
- Reject suggestion: Don co van de ro rang

Su dung LLM de phan tich, khong can ML model rieng.
"""

import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, date
from enum import Enum

from app.database import get_db_pool
from app.services.db_queries import _serialize_rows, _serialize_row
from app.services.provider_router import get_provider_router

logger = logging.getLogger(__name__)


class ApprovalVerdict(str, Enum):
    AUTO_APPROVE = "auto_approve"
    RECOMMEND_APPROVE = "recommend_approve"
    ESCALATE = "escalate"
    RECOMMEND_REJECT = "recommend_reject"


class ApprovalAgent:
    """Engine phan tich va khuyen nghi duyet/tu choi don"""

    # Rules cho auto-approve
    AUTO_APPROVE_RULES = [
        {
            "name": "short_leave_no_conflict",
            "description": "Nghỉ phép ≤ 1 ngày, còn đủ phép, không trùng deadline",
            "conditions": lambda ctx: (
                ctx.get("total_days", 0) <= 1
                and ctx.get("remaining_balance", 0) >= ctx.get("total_days", 0)
                and ctx.get("team_conflict_count", 0) == 0
            ),
        },
        {
            "name": "sick_leave_with_note",
            "description": "Nghỉ ốm ≤ 2 ngày có lý do rõ ràng",
            "conditions": lambda ctx: (
                ctx.get("leave_type", "").lower() in ("nghỉ ốm", "sick", "ốm")
                and ctx.get("total_days", 0) <= 2
                and len(ctx.get("reason", "")) > 10
            ),
        },
    ]

    # Rules cho escalation
    ESCALATE_RULES = [
        {
            "name": "long_leave",
            "description": "Nghỉ phép > 3 ngày cần manager review",
            "conditions": lambda ctx: ctx.get("total_days", 0) > 3,
        },
        {
            "name": "low_balance",
            "description": "Số dư phép còn lại sau nghỉ < 2 ngày",
            "conditions": lambda ctx: (
                ctx.get("remaining_balance", 0) - ctx.get("total_days", 0) < 2
            ),
        },
        {
            "name": "team_conflict",
            "description": "Có ≥ 2 người cùng team nghỉ cùng lúc",
            "conditions": lambda ctx: ctx.get("team_conflict_count", 0) >= 2,
        },
    ]

    async def analyze_request(
        self, request_id: str, reviewer_id: str
    ) -> Dict[str, Any]:
        """Phan tich day du mot don nghi phep va tra ve khuyen nghi"""
        # 1. Lay context du lieu
        context = await self._build_request_context(request_id)
        if not context:
            return {
                "verdict": "error",
                "message": "Không tìm thấy đơn yêu cầu.",
                "request_id": request_id,
            }

        # 2. Chay rule engine
        verdict, matched_rules = self._evaluate_rules(context)

        # 3. Tinh confidence score
        confidence = self._calculate_confidence(context, matched_rules)

        # 4. Neu can phan tich sau hon, goi LLM
        ai_analysis = None
        if verdict in (ApprovalVerdict.ESCALATE, ApprovalVerdict.RECOMMEND_REJECT):
            ai_analysis = await self._get_ai_analysis(context)

        # Build human-readable display text
        display_text = self._build_display_text(verdict, context, matched_rules, confidence, ai_analysis)

        return {
            "request_id": request_id,
            "verdict": verdict.value,
            "confidence": confidence,
            "display_text": display_text,
            "recommendation_text": self._generate_recommendation_text(
                verdict, context, matched_rules, ai_analysis
            ),
        }

    async def bulk_analyze(
        self, request_ids: List[str], reviewer_id: str
    ) -> List[Dict[str, Any]]:
        """Phan tich nhieu don cung luc"""
        results = []
        for req_id in request_ids:
            result = await self.analyze_request(req_id, reviewer_id)
            results.append(result)
        return results

    async def _build_request_context(self, request_id: str) -> Optional[Dict[str, Any]]:
        """Thu thap tat ca du lieu lien quan den don yeu cau"""
        pool = get_db_pool()
        if not pool:
            return None

        try:
            async with pool.acquire() as conn:
                # Don nghi phep
                request = await conn.fetchrow(
                    """
                    SELECT lr.id, lr."userId", lr."startDate", lr."endDate",
                           lr."totalDays", lr.reason, lr.status,
                           lt.name as leave_type,
                           u.name as employee_name, u."username",
                           u."departmentId", u."managerId",
                           d.name as department_name
                    FROM leave_requests lr
                    JOIN leave_types lt ON lr."leaveTypeId" = lt.id
                    JOIN users u ON lr."userId" = u.id
                    LEFT JOIN departments d ON u."departmentId" = d.id
                    WHERE lr.id = $1
                    """,
                    request_id,
                )

                if not request:
                    return None

                req = dict(request)

                # So du phep
                balance = await conn.fetchrow(
                    """
                    SELECT "totalDays", "usedDays", "pendingDays",
                           ("totalDays" - "usedDays" - COALESCE("pendingDays", 0)) as remaining
                    FROM leave_balances lb
                    WHERE lb."userId" = $1
                    AND lb."leaveTypeId" = (
                        SELECT "leaveTypeId" FROM leave_requests WHERE id = $2
                    )
                    AND lb."policyYear" = EXTRACT(YEAR FROM CURRENT_DATE)
                    """,
                    req["userId"],
                    request_id,
                )

                # Xung dot team (nguoi cung team cung nghi)
                conflicts = await conn.fetchval(
                    """
                    SELECT COUNT(DISTINCT lr2."userId")
                    FROM leave_requests lr2
                    JOIN users u2 ON lr2."userId" = u2.id
                    WHERE u2."departmentId" = $1
                    AND lr2.id != $2
                    AND lr2.status IN ('PENDING', 'APPROVED')
                    AND lr2."startDate" <= $4
                    AND lr2."endDate" >= $3
                    """,
                    req.get("departmentId"),
                    request_id,
                    req.get("startDate"),
                    req.get("endDate"),
                )

                # Lich su nghi phep gan day
                recent_leaves = await conn.fetchval(
                    """
                    SELECT COUNT(*)
                    FROM leave_requests
                    WHERE "userId" = $1
                    AND status = 'APPROVED'
                    AND "createdAt" >= CURRENT_DATE - INTERVAL '30 days'
                    """,
                    req["userId"],
                )

                context = _serialize_row(req)
                context["remaining_balance"] = float(balance["remaining"]) if balance else 0
                context["total_balance"] = float(balance["totalDays"]) if balance else 0
                context["team_conflict_count"] = conflicts or 0
                context["recent_leaves_30_days"] = recent_leaves or 0

                # Add snake_case aliases for rule engine compatibility
                context["total_days"] = context.get("totalDays", 0)
                context["start_date"] = context.get("startDate")
                context["end_date"] = context.get("endDate")

                return context

        except Exception as e:
            logger.error(f"Error building request context: {e}", exc_info=True)
            return None

    def _evaluate_rules(self, context: Dict[str, Any]) -> tuple:
        """Danh gia cac rules va tra ve verdict + matched rules"""
        # Check auto-approve rules first
        auto_approve_matches = []
        for rule in self.AUTO_APPROVE_RULES:
            try:
                if rule["conditions"](context):
                    auto_approve_matches.append(rule)
            except Exception:
                continue

        if auto_approve_matches:
            return ApprovalVerdict.AUTO_APPROVE, auto_approve_matches

        # Check escalation rules
        escalate_matches = []
        for rule in self.ESCALATE_RULES:
            try:
                if rule["conditions"](context):
                    escalate_matches.append(rule)
            except Exception:
                continue

        if escalate_matches:
            return ApprovalVerdict.ESCALATE, escalate_matches

        # Default: recommend approve
        return ApprovalVerdict.RECOMMEND_APPROVE, []

    def _calculate_confidence(
        self, context: Dict[str, Any], matched_rules: List[Dict]
    ) -> int:
        """Tinh confidence score (0-100)"""
        score = 70  # Base

        # Tang diem neu co balance du
        if context.get("remaining_balance", 0) > context.get("total_days", 0):
            score += 10

        # Tang diem neu khong co xung dot team
        if context.get("team_conflict_count", 0) == 0:
            score += 10

        # Giam diem neu co nhieu rules matched (phuc tap)
        score -= len(matched_rules) * 5

        # Giam diem neu nghi nhieu gan day
        if context.get("recent_leaves_30_days", 0) > 2:
            score -= 10

        return max(10, min(100, score))

    async def _get_ai_analysis(self, context: Dict[str, Any]) -> Optional[str]:
        """Goi LLM de phan tich sau don phuc tap"""
        try:
            provider_router = get_provider_router()
            prompt = f"""Phân tích đơn nghỉ phép sau và đưa khuyến nghị ngắn gọn (3-5 dòng):

Nhân viên: {context.get('employee_name')} ({context.get('username')})
Phòng ban: {context.get('department_name')}
Loại nghỉ: {context.get('leave_type')}
Thời gian: {context.get('startDate', context.get('start_date'))} đến {context.get('endDate', context.get('end_date'))} ({context.get('totalDays', context.get('total_days'))} ngày)
Lý do: {context.get('reason')}
Số dư phép còn: {context.get('remaining_balance')} ngày
Người cùng team nghỉ: {context.get('team_conflict_count')} người
Số lần nghỉ 30 ngày qua: {context.get('recent_leaves_30_days')}

Hãy phân tích rủi ro và đưa ra khuyến nghị: APPROVE, REJECT, hoặc ESCALATE (cần xem xét thêm)."""

            result = await provider_router.chat_completion(
                system_prompt="Bạn là chuyên gia HR. Phân tích và khuyến nghị ngắn gọn bằng tiếng Việt.",
                user_message=prompt,
                temperature=0.3,
            )

            return result.get("content") if result.get("success") else None
        except Exception as e:
            logger.error(f"AI analysis failed: {e}")
            return None

    def _generate_recommendation_text(
        self,
        verdict: ApprovalVerdict,
        context: Dict[str, Any],
        matched_rules: List[Dict],
        ai_analysis: Optional[str],
    ) -> str:
        """Tao van ban khuyen nghi de hien thi"""
        lines = []

        if verdict == ApprovalVerdict.AUTO_APPROVE:
            lines.append("**Khuyến nghị: Tự động duyệt**")
            lines.append("Đơn đáp ứng các điều kiện duyệt nhanh:")
            for r in matched_rules:
                lines.append(f"  • {r['description']}")

        elif verdict == ApprovalVerdict.RECOMMEND_APPROVE:
            lines.append("**Khuyến nghị: Duyệt**")
            lines.append("Không phát hiện rủi ro đáng kể.")

        elif verdict == ApprovalVerdict.ESCALATE:
            lines.append("**Khuyến nghị: Cần xem xét thêm**")
            lines.append("Các yếu tố cần lưu ý:")
            for r in matched_rules:
                lines.append(f"  • {r['description']}")

        elif verdict == ApprovalVerdict.RECOMMEND_REJECT:
            lines.append("**Khuyến nghị: Từ chối**")

        if ai_analysis:
            lines.append(f"\n**Phân tích AI:**\n{ai_analysis}")

        return "\n".join(lines)

    def _build_display_text(
        self,
        verdict: ApprovalVerdict,
        context: Dict[str, Any],
        matched_rules: List[Dict],
        confidence: int,
        ai_analysis: Optional[str],
    ) -> str:
        """Tao van ban hien thi toan bo phan tich — khong tra JSON"""
        lines = []

        # Header
        verdict_labels = {
            ApprovalVerdict.AUTO_APPROVE: "TỰ ĐỘNG DUYỆT",
            ApprovalVerdict.RECOMMEND_APPROVE: "KHUYẾN NGHỊ DUYỆT",
            ApprovalVerdict.ESCALATE: "CẦN XEM XÉT THÊM",
            ApprovalVerdict.RECOMMEND_REJECT: "KHUYẾN NGHỊ TỪ CHỐI",
        }
        lines.append(f"### {verdict_labels.get(verdict, 'Phân tích đơn')}")
        lines.append(f"**Độ tin cậy:** {confidence}%\n")

        # Request details — use camelCase keys from DB serialization
        lines.append("**Thông tin đơn:**")
        lines.append(f"- **Nhân viên:** {context.get('employee_name', 'N/A')} ({context.get('username', '')})")
        lines.append(f"- **Phòng ban:** {context.get('department_name', 'N/A')}")
        lines.append(f"- **Loại nghỉ:** {context.get('leave_type', 'N/A')}")

        start = context.get("startDate", context.get("start_date", "N/A"))
        end = context.get("endDate", context.get("end_date", "N/A"))
        total = context.get("totalDays", context.get("total_days", "N/A"))
        lines.append(f"- **Thời gian:** {start} → {end} ({total} ngày)")
        lines.append(f"- **Lý do:** {context.get('reason', 'Không có')}")
        lines.append("")

        # Leave balance
        remaining = context.get("remaining_balance", 0)
        total_bal = context.get("total_balance", 0)
        lines.append("**Số dư phép:**")
        lines.append(f"- Tổng phép năm: {total_bal} ngày")
        lines.append(f"- Còn lại sau đơn này: {remaining} ngày")
        lines.append("")

        # Team conflicts
        conflicts = context.get("team_conflict_count", 0)
        if conflicts > 0:
            lines.append(f"**Xung đột team:** {conflicts} người cùng phòng nghỉ trùng ngày")
        else:
            lines.append("**Xung đột team:** Không có")

        recent = context.get("recent_leaves_30_days", 0)
        if recent > 0:
            lines.append(f"**Nghỉ gần đây:** {recent} lần trong 30 ngày qua")
        lines.append("")

        # Recommendation
        lines.append("---")
        lines.append(self._generate_recommendation_text(verdict, context, matched_rules, ai_analysis))

        return "\n".join(lines)

