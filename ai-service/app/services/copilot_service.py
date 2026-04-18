"""
Copilot Service - Manager AI Copilot (Phase 5)
Tro ly AI dong hanh cho Manager/Director:
- Team health analysis
- 1-on-1 meeting prep
- Performance feedback suggestions
- Meeting agenda generation
- Org structure insights
"""

import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, date

from app.database import get_db_pool
from app.services.db_queries import _serialize_rows, _serialize_row
from app.services.provider_router import get_provider_router

logger = logging.getLogger(__name__)


class CopilotService:
    """AI Copilot cho Manager"""

    async def get_insight(
        self,
        insight_type: str,
        manager_id: str,
        target_employee_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Dispatch insight request theo loai"""
        dispatch = {
            "team_health": self._team_health,
            "1on1_prep": self._one_on_one_prep,
            "performance_nudge": self._performance_nudge,
            "meeting_agenda": self._meeting_agenda,
            "org_insights": self._org_insights,
        }

        handler = dispatch.get(insight_type)
        if not handler:
            return {
                "success": False,
                "error": f"Loại insight '{insight_type}' không hỗ trợ. Có thể dùng: {', '.join(dispatch.keys())}",
            }

        return await handler(manager_id, target_employee_id)

    async def _team_health(
        self, manager_id: str, _: Optional[str] = None
    ) -> Dict[str, Any]:
        """Phan tich suc khoe team"""
        pool = get_db_pool()
        if not pool:
            return {"success": False, "error": "Database unavailable"}

        try:
            async with pool.acquire() as conn:
                # Team members
                members = await conn.fetch(
                    """
                    SELECT u.id, u.name, u."username",
                           u."hireDate", u."employeeStatus",
                           p.name as position_name,
                           d.name as department_name
                    FROM users u
                    LEFT JOIN positions p ON u."positionId" = p.id
                    LEFT JOIN departments d ON u."departmentId" = d.id
                    WHERE u."managerId" = $1
                    AND u."employeeStatus" = 'ACTIVE'
                    ORDER BY u.name
                    """,
                    manager_id,
                )

                if not members:
                    return {
                        "success": True,
                        "insight_type": "team_health",
                        "data": {"team_size": 0, "message": "Không tìm thấy thành viên team."},
                    }

                member_ids = [m["id"] for m in members]

                # Attendance summary
                now = datetime.now()
                att_data = await conn.fetch(
                    """
                    SELECT a."userId", u.name,
                           a."totalWorkDays", a."lateDays", a."absentDays",
                           a."totalOtHours", a."leaveDays"
                    FROM attendance_summaries a
                    JOIN users u ON a."userId" = u.id
                    WHERE a."userId" = ANY($1)
                    AND a.month = $2 AND a.year = $3
                    """,
                    member_ids, now.month, now.year,
                )

                # Pending leave requests
                pending = await conn.fetch(
                    """
                    SELECT lr.id, lr."startDate", lr."endDate", lr."totalDays",
                           lr.reason, u.name as employee_name,
                           lt.name as leave_type
                    FROM leave_requests lr
                    JOIN users u ON lr."userId" = u.id
                    JOIN leave_types lt ON lr."leaveTypeId" = lt.id
                    WHERE lr."userId" = ANY($1)
                    AND lr.status = 'PENDING'
                    ORDER BY lr."createdAt" DESC
                    """,
                    member_ids,
                )

                # Calculate team health metrics
                total_late = sum(a.get("lateDays", 0) for a in att_data)
                total_absent = sum(a.get("absentDays", 0) for a in att_data)
                total_ot = sum(a.get("totalOtHours", 0) for a in att_data)
                avg_ot = total_ot / len(att_data) if att_data else 0

                # Health score (simplified)
                health_score = 100
                if avg_ot > 30:
                    health_score -= 20
                elif avg_ot > 15:
                    health_score -= 10
                if total_late > len(members) * 2:
                    health_score -= 15
                if total_absent > len(members):
                    health_score -= 15

                # AI summary
                ai_summary = await self._get_team_ai_summary(
                    len(members), total_late, total_absent, avg_ot, len(pending)
                )

                return {
                    "success": True,
                    "insight_type": "team_health",
                    "data": {
                        "team_size": len(members),
                        "health_score": max(0, health_score),
                        "metrics": {
                            "total_late_days": total_late,
                            "total_absent_days": float(total_absent),
                            "avg_ot_hours": round(avg_ot, 1),
                            "total_ot_hours": float(total_ot),
                        },
                        "pending_requests": len(pending),
                        "pending_details": _serialize_rows(pending),
                        "member_attendance": _serialize_rows(att_data),
                        "ai_summary": ai_summary,
                    },
                }

        except Exception as e:
            logger.error(f"Team health error: {e}", exc_info=True)
            return {"success": False, "error": str(e)}

    async def _one_on_one_prep(
        self, manager_id: str, employee_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Chuan bi cho cuoc hop 1-on-1"""
        if not employee_id:
            return {
                "success": False,
                "error": "Cần cung cấp target_employee_id để chuẩn bị 1-on-1.",
            }

        pool = get_db_pool()
        if not pool:
            return {"success": False, "error": "Database unavailable"}

        try:
            async with pool.acquire() as conn:
                # Employee info
                emp = await conn.fetchrow(
                    """
                    SELECT u.id, u.name, u."username", u."hireDate",
                           p.name as position_name, d.name as department_name
                    FROM users u
                    LEFT JOIN positions p ON u."positionId" = p.id
                    LEFT JOIN departments d ON u."departmentId" = d.id
                    WHERE u.id = $1
                    """,
                    employee_id,
                )

                if not emp:
                    return {"success": False, "error": "Không tìm thấy nhân viên."}

                # Recent attendance
                att = await conn.fetchrow(
                    """
                    SELECT "totalWorkDays", "lateDays", "absentDays",
                           "totalOtHours", "leaveDays"
                    FROM attendance_summaries
                    WHERE "userId" = $1
                    ORDER BY year DESC, month DESC
                    LIMIT 1
                    """,
                    employee_id,
                )

                # Recent leave requests
                leaves = await conn.fetch(
                    """
                    SELECT lr."startDate", lr."endDate", lr."totalDays",
                           lr.status, lt.name as leave_type
                    FROM leave_requests lr
                    JOIN leave_types lt ON lr."leaveTypeId" = lt.id
                    WHERE lr."userId" = $1
                    ORDER BY lr."createdAt" DESC
                    LIMIT 5
                    """,
                    employee_id,
                )

                # Rewards/disciplines
                rewards = await conn.fetch(
                    """
                    SELECT type, title, description, "decisionDate"
                    FROM rewards
                    WHERE "userId" = $1
                    ORDER BY "decisionDate" DESC
                    LIMIT 5
                    """,
                    employee_id,
                )

                # Tenure
                tenure_years = None
                if emp.get("hireDate"):
                    tenure_days = (date.today() - emp["hireDate"]).days
                    tenure_years = round(tenure_days / 365.25, 1)

                # AI generated talking points
                talking_points = await self._generate_1on1_points(
                    _serialize_row(dict(emp)),
                    _serialize_row(dict(att)) if att else {},
                    _serialize_rows(rewards),
                    tenure_years,
                )

                return {
                    "success": True,
                    "insight_type": "1on1_prep",
                    "data": {
                        "employee": _serialize_row(dict(emp)),
                        "tenure_years": tenure_years,
                        "recent_attendance": _serialize_row(dict(att)) if att else None,
                        "recent_leaves": _serialize_rows(leaves),
                        "recent_rewards": _serialize_rows(rewards),
                        "talking_points": talking_points,
                    },
                }

        except Exception as e:
            logger.error(f"1-on-1 prep error: {e}", exc_info=True)
            return {"success": False, "error": str(e)}

    async def _performance_nudge(
        self, manager_id: str, _: Optional[str] = None
    ) -> Dict[str, Any]:
        """Goi y feedback cho cac thanh vien team"""
        pool = get_db_pool()
        if not pool:
            return {"success": False, "error": "Database unavailable"}

        try:
            async with pool.acquire() as conn:
                # Team members voi du lieu cham cong
                now = datetime.now()
                members_with_data = await conn.fetch(
                    """
                    SELECT u.id, u.name, u."username",
                           a."totalWorkDays", a."lateDays", a."absentDays",
                           a."totalOtHours",
                           p.name as position_name
                    FROM users u
                    LEFT JOIN attendance_summaries a ON u.id = a."userId"
                        AND a.month = $2 AND a.year = $3
                    LEFT JOIN positions p ON u."positionId" = p.id
                    WHERE u."managerId" = $1
                    AND u."employeeStatus" = 'ACTIVE'
                    ORDER BY u.name
                    """,
                    manager_id, now.month, now.year,
                )

                nudges = []
                for m in members_with_data:
                    reasons = []
                    if m.get("totalOtHours") and m["totalOtHours"] > 25:
                        reasons.append(f"OT cao ({m['totalOtHours']}h) — cân nhắc hỏi thăm và giảm tải")
                    if m.get("lateDays") and m["lateDays"] > 3:
                        reasons.append(f"Đi muộn {m['lateDays']} ngày — theo dõi và hỗ trợ")
                    if m.get("absentDays") and float(m["absentDays"]) > 2:
                        reasons.append(f"Vắng mặt {m['absentDays']} ngày — kiểm tra tình trạng")

                    if reasons:
                        nudges.append({
                            "employee_id": m["id"],
                            "employee_name": m["name"],
                            "position": m.get("position_name"),
                            "reasons": reasons,
                            "priority": "high" if len(reasons) >= 2 else "medium",
                        })

                return {
                    "success": True,
                    "insight_type": "performance_nudge",
                    "data": {
                        "nudges": nudges,
                        "nudge_count": len(nudges),
                        "team_size": len(members_with_data),
                    },
                }

        except Exception as e:
            logger.error(f"Performance nudge error: {e}", exc_info=True)
            return {"success": False, "error": str(e)}

    async def _meeting_agenda(
        self, manager_id: str, _: Optional[str] = None
    ) -> Dict[str, Any]:
        """Tao agenda meeting tu dong"""
        pool = get_db_pool()
        if not pool:
            return {"success": False, "error": "Database unavailable"}

        try:
            async with pool.acquire() as conn:
                # Gather context
                team_size = await conn.fetchval(
                    """
                    SELECT COUNT(*) FROM users
                    WHERE "managerId" = $1 AND "employeeStatus" = 'ACTIVE'
                    """,
                    manager_id,
                )

                pending_count = await conn.fetchval(
                    """
                    SELECT COUNT(*)
                    FROM leave_requests lr
                    JOIN users u ON lr."userId" = u.id
                    WHERE u."managerId" = $1 AND lr.status = 'PENDING'
                    """,
                    manager_id,
                )

                manager = await conn.fetchrow(
                    """
                    SELECT u.name, d.name as department_name
                    FROM users u
                    LEFT JOIN departments d ON u."departmentId" = d.id
                    WHERE u.id = $1
                    """,
                    manager_id,
                )

            # Generate agenda via AI
            provider_router = get_provider_router()
            prompt = f"""Tạo agenda cuộc họp team ngắn gọn cho:
Manager: {manager['name'] if manager else 'N/A'}
Phòng ban: {manager['department_name'] if manager else 'N/A'}
Số thành viên: {team_size}
Đơn chờ duyệt: {pending_count}
Ngày họp: {date.today().isoformat()}

Tạo agenda gồm 5-7 mục, mỗi mục có thời lượng ước tính."""

            result = await provider_router.chat_completion(
                system_prompt="Bạn là trợ lý quản lý. Tạo agenda họp team ngắn gọn, thực tế. Tiếng Việt.",
                user_message=prompt,
                temperature=0.5,
            )

            return {
                "success": True,
                "insight_type": "meeting_agenda",
                "data": {
                    "agenda": result.get("content") if result.get("success") else "Không thể tạo agenda.",
                    "context": {
                        "team_size": team_size,
                        "pending_requests": pending_count,
                    },
                },
            }

        except Exception as e:
            logger.error(f"Meeting agenda error: {e}", exc_info=True)
            return {"success": False, "error": str(e)}

    async def _org_insights(
        self, manager_id: str, _: Optional[str] = None
    ) -> Dict[str, Any]:
        """Phan tich cau truc to chuc"""
        pool = get_db_pool()
        if not pool:
            return {"success": False, "error": "Database unavailable"}

        try:
            async with pool.acquire() as conn:
                # Department distribution
                dept_stats = await conn.fetch(
                    """
                    SELECT d.name, COUNT(u.id) as count,
                           ROUND(AVG(EXTRACT(YEAR FROM AGE(CURRENT_DATE, u."hireDate")))::numeric, 1) as avg_tenure
                    FROM departments d
                    LEFT JOIN users u ON u."departmentId" = d.id
                    WHERE u."employeeStatus" = 'ACTIVE'
                    GROUP BY d.name
                    ORDER BY count DESC
                    """,
                )

                # Total headcount
                total = await conn.fetchval(
                    "SELECT COUNT(*) FROM users WHERE \"employeeStatus\" = 'ACTIVE'"
                )

                return {
                    "success": True,
                    "insight_type": "org_insights",
                    "data": {
                        "total_headcount": total or 0,
                        "departments": _serialize_rows(dept_stats),
                    },
                }

        except Exception as e:
            logger.error(f"Org insights error: {e}", exc_info=True)
            return {"success": False, "error": str(e)}

    # ========== AI Helper Methods ==========

    async def _get_team_ai_summary(
        self, team_size: int, total_late: int, total_absent: int,
        avg_ot: float, pending_count: int
    ) -> Optional[str]:
        """AI tao summary suc khoe team"""
        try:
            provider_router = get_provider_router()
            prompt = f"""Tóm tắt ngắn gọn sức khỏe team (3-4 dòng):
- Quy mô: {team_size} người
- Tổng ngày đi muộn: {total_late}
- Tổng ngày vắng: {total_absent}
- OT trung bình: {avg_ot:.1f} giờ/người
- Đơn chờ duyệt: {pending_count}

Đưa ra 1-2 gợi ý cho manager."""

            result = await provider_router.chat_completion(
                system_prompt="Bạn là HR analytics advisor. Tóm tắt ngắn gọn bằng tiếng Việt.",
                user_message=prompt,
                temperature=0.4,
            )
            return result.get("content") if result.get("success") else None
        except Exception:
            return None

    async def _generate_1on1_points(
        self, emp: Dict, att: Dict, rewards: List, tenure: Optional[float]
    ) -> Optional[str]:
        """AI tao talking points cho 1-on-1"""
        try:
            provider_router = get_provider_router()
            prompt = f"""Tạo 5 talking points cho cuộc họp 1-on-1:

Nhân viên: {emp.get('name')} | Vị trí: {emp.get('position_name')}
Thâm niên: {tenure} năm
Chấm công: Đi muộn {att.get('lateDays', 'N/A')} ngày, OT {att.get('totalOtHours', 'N/A')}h
Khen thưởng/kỷ luật gần đây: {len(rewards)} record

Tạo 5 câu hỏi/topic cụ thể, thực tế cho manager."""

            result = await provider_router.chat_completion(
                system_prompt="Bạn là coach quản lý. Tạo talking points cụ thể cho 1-on-1. Tiếng Việt.",
                user_message=prompt,
                temperature=0.5,
            )
            return result.get("content") if result.get("success") else None
        except Exception:
            return None
