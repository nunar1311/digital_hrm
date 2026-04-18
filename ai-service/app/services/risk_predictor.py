"""
Risk Predictor - Predictive Risk Analytics (Phase 3)
Du doan rui ro nhan su bang cach ket hop du lieu HR voi LLM analysis:
- Turnover risk: Nguy co nghi viec
- Burnout risk: Nguy co kiet suc
- Talent flight: Nhan vien gioi co nguy co roi di
- Hiring forecast: Du bao nhu cau tuyen dung

Su dung scoring engine + LLM cho phan tich dinh tinh.
"""

import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, date

from app.database import get_db_pool
from app.services.db_queries import _serialize_rows, _serialize_row
from app.services.provider_router import get_provider_router

logger = logging.getLogger(__name__)


class RiskPredictor:
    """Du doan va cham diem rui ro nhan su"""

    # Weights cho cac risk factors
    TURNOVER_WEIGHTS = {
        "short_tenure": 15,         # < 1 nam
        "long_tenure_no_promo": 10, # > 3 nam khong thang chuc
        "high_ot": 15,              # OT cao lien tuc
        "low_attendance": 10,       # Cham cong kem
        "no_leave_taken": 10,       # Khong nghi phep (burnout risk)
        "contract_expiring": 20,    # Hop dong sap het han
        "recent_discipline": 10,    # Bi ky luat gan day
        "salary_below_avg": 10,     # Luong duoi trung binh
    }

    async def assess_employee_risk(self, user_id: str) -> Dict[str, Any]:
        """Danh gia rui ro toan dien cho mot nhan vien"""
        pool = get_db_pool()
        if not pool:
            return {"error": "Không thể kết nối database"}

        try:
            async with pool.acquire() as conn:
                # Thu thap du lieu
                factors = await self._collect_risk_factors(conn, user_id)
                if not factors:
                    return {"error": "Không tìm thấy nhân viên"}

                # Tinh turnover risk score
                turnover = self._calculate_turnover_score(factors)

                # Tinh burnout risk score
                burnout = self._calculate_burnout_score(factors)

                # AI analysis
                ai_insight = await self._get_ai_risk_insight(factors)

                return {
                    "user_id": user_id,
                    "employee_name": factors.get("name"),
                    "department": factors.get("department_name"),
                    "turnover_risk": {
                        "score": turnover["score"],
                        "level": turnover["level"],
                        "factors": turnover["factors"],
                    },
                    "burnout_risk": {
                        "score": burnout["score"],
                        "level": burnout["level"],
                        "factors": burnout["factors"],
                    },
                    "ai_insight": ai_insight,
                    "suggested_actions": self._suggest_actions(turnover, burnout),
                    "assessed_at": datetime.now().isoformat(),
                }

        except Exception as e:
            logger.error(f"Risk assessment error for {user_id}: {e}", exc_info=True)
            return {"error": str(e)}

    async def assess_department_risk(self, department_id: str) -> Dict[str, Any]:
        """Danh gia rui ro cho toan phong ban"""
        pool = get_db_pool()
        if not pool:
            return {"error": "Không thể kết nối database"}

        try:
            async with pool.acquire() as conn:
                # Lay danh sach nhan vien trong phong ban
                employees = await conn.fetch(
                    """
                    SELECT u.id, u.name, u."username"
                    FROM users u
                    WHERE u."departmentId" = $1
                    AND u."employeeStatus" = 'ACTIVE'
                    """,
                    department_id,
                )

                if not employees:
                    return {"error": "Không tìm thấy phòng ban hoặc chưa có nhân viên"}

                dept = await conn.fetchrow(
                    "SELECT name FROM departments WHERE id = $1",
                    department_id,
                )

                # Danh gia tung nhan vien
                risk_results = []
                high_risk_count = 0
                medium_risk_count = 0

                for emp in employees:
                    factors = await self._collect_risk_factors(conn, emp["id"])
                    if factors:
                        turnover = self._calculate_turnover_score(factors)
                        burnout = self._calculate_burnout_score(factors)
                        overall_level = "high" if turnover["score"] >= 70 or burnout["score"] >= 70 else (
                            "medium" if turnover["score"] >= 40 or burnout["score"] >= 40 else "low"
                        )
                        if overall_level == "high":
                            high_risk_count += 1
                        elif overall_level == "medium":
                            medium_risk_count += 1

                        risk_results.append({
                            "user_id": emp["id"],
                            "name": emp["name"],
                            "turnover_score": turnover["score"],
                            "burnout_score": burnout["score"],
                            "overall_level": overall_level,
                            "top_factors": (turnover["factors"] + burnout["factors"])[:3],
                        })

                # Sort by risk score
                risk_results.sort(
                    key=lambda x: max(x["turnover_score"], x["burnout_score"]),
                    reverse=True,
                )

                # OT trends
                ot_data = await conn.fetch(
                    """
                    SELECT a.month, a.year,
                           ROUND(AVG(a."totalOtHours")::numeric, 1) as avg_ot
                    FROM attendance_summaries a
                    JOIN users u ON a."userId" = u.id
                    WHERE u."departmentId" = $1
                    GROUP BY a.month, a.year
                    ORDER BY a.year DESC, a.month DESC
                    LIMIT 6
                    """,
                    department_id,
                )

                return {
                    "department_id": department_id,
                    "department_name": dept["name"] if dept else "Unknown",
                    "total_employees": len(employees),
                    "high_risk_count": high_risk_count,
                    "medium_risk_count": medium_risk_count,
                    "low_risk_count": len(employees) - high_risk_count - medium_risk_count,
                    "employees": risk_results,
                    "ot_trends": _serialize_rows(ot_data),
                    "assessed_at": datetime.now().isoformat(),
                }

        except Exception as e:
            logger.error(f"Department risk assessment error: {e}", exc_info=True)
            return {"error": str(e)}

    async def get_org_risk_overview(self) -> Dict[str, Any]:
        """Tong quan rui ro toan to chuc"""
        pool = get_db_pool()
        if not pool:
            return {"error": "Không thể kết nối database"}

        try:
            async with pool.acquire() as conn:
                # Hop dong sap het han
                expiring_contracts = await conn.fetch(
                    """
                    SELECT c.id, c."endDate", u.name, u."username",
                           d.name as department_name
                    FROM contracts c
                    JOIN users u ON c."userId" = u.id
                    LEFT JOIN departments d ON u."departmentId" = d.id
                    WHERE c.status = 'ACTIVE'
                    AND c."endDate" IS NOT NULL
                    AND c."endDate" BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '60 days'
                    ORDER BY c."endDate"
                    """,
                )

                # Nhan vien OT cao nhat
                high_ot = await conn.fetch(
                    """
                    SELECT u.id, u.name, u."username",
                           a."totalOtHours", d.name as department_name
                    FROM attendance_summaries a
                    JOIN users u ON a."userId" = u.id
                    LEFT JOIN departments d ON u."departmentId" = d.id
                    WHERE a.month = EXTRACT(MONTH FROM CURRENT_DATE)
                    AND a.year = EXTRACT(YEAR FROM CURRENT_DATE)
                    AND a."totalOtHours" > 20
                    ORDER BY a."totalOtHours" DESC
                    LIMIT 10
                    """,
                )

                # Nhan vien vang mat nhieu
                high_absent = await conn.fetch(
                    """
                    SELECT u.id, u.name, u."username",
                           a."absentDays", a."lateDays", d.name as department_name
                    FROM attendance_summaries a
                    JOIN users u ON a."userId" = u.id
                    LEFT JOIN departments d ON u."departmentId" = d.id
                    WHERE a.month = EXTRACT(MONTH FROM CURRENT_DATE)
                    AND a.year = EXTRACT(YEAR FROM CURRENT_DATE)
                    AND (a."absentDays" > 2 OR a."lateDays" > 5)
                    ORDER BY a."absentDays" DESC
                    LIMIT 10
                    """,
                )

                return {
                    "expiring_contracts": _serialize_rows(expiring_contracts),
                    "expiring_count": len(expiring_contracts),
                    "high_ot_employees": _serialize_rows(high_ot),
                    "high_absent_employees": _serialize_rows(high_absent),
                    "assessed_at": datetime.now().isoformat(),
                }

        except Exception as e:
            logger.error(f"Org risk overview error: {e}", exc_info=True)
            return {"error": str(e)}

    async def _collect_risk_factors(self, conn, user_id: str) -> Optional[Dict]:
        """Thu thap tat ca risk factors cho mot nhan vien"""
        try:
            # Info co ban
            emp = await conn.fetchrow(
                """
                SELECT u.id, u.name, u."username", u."hireDate",
                       u."employeeStatus", u."employmentType",
                       d.name as department_name,
                       p.name as position_name
                FROM users u
                LEFT JOIN departments d ON u."departmentId" = d.id
                LEFT JOIN positions p ON u."positionId" = p.id
                WHERE u.id = $1
                """,
                user_id,
            )

            if not emp:
                return None

            factors = _serialize_row(dict(emp))

            # Tenure
            if emp.get("hireDate"):
                tenure_days = (date.today() - emp["hireDate"]).days
                factors["tenure_years"] = round(tenure_days / 365.25, 1)
            else:
                factors["tenure_years"] = None

            # Attendance (thang hien tai)
            att = await conn.fetchrow(
                """
                SELECT "totalWorkDays", "lateDays", "absentDays",
                       "totalOtHours", "leaveDays"
                FROM attendance_summaries
                WHERE "userId" = $1
                ORDER BY year DESC, month DESC
                LIMIT 1
                """,
                user_id,
            )
            if att:
                factors.update(_serialize_row(dict(att)))
            else:
                factors["totalOtHours"] = 0
                factors["lateDays"] = 0
                factors["absentDays"] = 0
                factors["leaveDays"] = 0

            # Average OT last 3 months
            avg_ot = await conn.fetchval(
                """
                SELECT ROUND(AVG("totalOtHours")::numeric, 1)
                FROM attendance_summaries
                WHERE "userId" = $1
                ORDER BY year DESC, month DESC
                LIMIT 3
                """,
                user_id,
            )
            factors["avg_ot_3m"] = float(avg_ot) if avg_ot else 0

            # Contract expiry
            contract = await conn.fetchrow(
                """
                SELECT "endDate", status FROM contracts
                WHERE "userId" = $1 AND status = 'ACTIVE'
                ORDER BY "startDate" DESC LIMIT 1
                """,
                user_id,
            )
            if contract and contract.get("endDate"):
                days_to_expiry = (contract["endDate"] - date.today()).days
                factors["contract_days_to_expiry"] = days_to_expiry
            else:
                factors["contract_days_to_expiry"] = None

            # Salary vs department average
            salary = await conn.fetchrow(
                """
                SELECT s."baseSalary",
                       (SELECT ROUND(AVG(s2."baseSalary")::numeric, 0)
                        FROM salaries s2
                        JOIN users u2 ON s2."userId" = u2.id
                        WHERE u2."departmentId" = (
                            SELECT "departmentId" FROM users WHERE id = $1
                        )) as dept_avg
                FROM salaries s
                WHERE s."userId" = $1
                """,
                user_id,
            )
            if salary:
                factors["salary"] = float(salary["baseSalary"]) if salary["baseSalary"] else 0
                factors["dept_avg_salary"] = float(salary["dept_avg"]) if salary["dept_avg"] else 0
            else:
                factors["salary"] = 0
                factors["dept_avg_salary"] = 0

            # Rewards/disciplines
            rewards_count = await conn.fetchval(
                """
                SELECT COUNT(*) FROM rewards
                WHERE "userId" = $1 AND type = 'REWARD'
                AND "decisionDate" >= CURRENT_DATE - INTERVAL '12 months'
                """,
                user_id,
            )
            disciplines_count = await conn.fetchval(
                """
                SELECT COUNT(*) FROM rewards
                WHERE "userId" = $1 AND type = 'DISCIPLINE'
                AND "decisionDate" >= CURRENT_DATE - INTERVAL '12 months'
                """,
                user_id,
            )
            factors["recent_rewards"] = rewards_count or 0
            factors["recent_disciplines"] = disciplines_count or 0

            # Leave balance
            leave_taken_year = await conn.fetchval(
                """
                SELECT COALESCE(SUM("usedDays"), 0)
                FROM leave_balances
                WHERE "userId" = $1
                AND "policyYear" = EXTRACT(YEAR FROM CURRENT_DATE)
                """,
                user_id,
            )
            factors["leave_taken_this_year"] = float(leave_taken_year) if leave_taken_year else 0

            return factors

        except Exception as e:
            logger.error(f"Error collecting risk factors for {user_id}: {e}")
            return None

    def _calculate_turnover_score(self, factors: Dict) -> Dict[str, Any]:
        """Tinh diem rui ro nghi viec"""
        score = 0
        risk_factors = []

        # Short tenure
        tenure = factors.get("tenure_years")
        if tenure is not None and tenure < 1:
            score += self.TURNOVER_WEIGHTS["short_tenure"]
            risk_factors.append("Thâm niên ngắn (< 1 năm)")

        # Long tenure no promotion
        if tenure is not None and tenure > 3:
            score += self.TURNOVER_WEIGHTS["long_tenure_no_promo"]
            risk_factors.append("Thâm niên dài chưa thăng tiến")

        # High OT
        avg_ot = factors.get("avg_ot_3m", 0)
        if avg_ot > 30:
            score += self.TURNOVER_WEIGHTS["high_ot"]
            risk_factors.append(f"OT cao ({avg_ot}h/tháng TB)")

        # Low attendance
        if factors.get("absentDays", 0) > 3 or factors.get("lateDays", 0) > 5:
            score += self.TURNOVER_WEIGHTS["low_attendance"]
            risk_factors.append("Chấm công không đều")

        # Contract expiring
        days_exp = factors.get("contract_days_to_expiry")
        if days_exp is not None and days_exp < 60:
            score += self.TURNOVER_WEIGHTS["contract_expiring"]
            risk_factors.append(f"Hợp đồng hết hạn trong {days_exp} ngày")

        # Salary below avg
        if factors.get("salary", 0) > 0 and factors.get("dept_avg_salary", 0) > 0:
            if factors["salary"] < factors["dept_avg_salary"] * 0.85:
                score += self.TURNOVER_WEIGHTS["salary_below_avg"]
                risk_factors.append("Lương dưới TB phòng ban")

        # Recent discipline
        if factors.get("recent_disciplines", 0) > 0:
            score += self.TURNOVER_WEIGHTS["recent_discipline"]
            risk_factors.append("Có kỷ luật gần đây")

        level = "high" if score >= 60 else ("medium" if score >= 30 else "low")

        return {"score": min(100, score), "level": level, "factors": risk_factors}

    def _calculate_burnout_score(self, factors: Dict) -> Dict[str, Any]:
        """Tinh diem rui ro kiet suc"""
        score = 0
        risk_factors = []

        # High OT (burnout-specific)
        avg_ot = factors.get("avg_ot_3m", 0)
        if avg_ot > 40:
            score += 30
            risk_factors.append(f"OT rất cao ({avg_ot}h/tháng)")
        elif avg_ot > 20:
            score += 15
            risk_factors.append(f"OT cao ({avg_ot}h/tháng)")

        # No leave taken
        if factors.get("leave_taken_this_year", 0) < 2:
            score += 20
            risk_factors.append("Hầu như không nghỉ phép")

        # Late frequently
        if factors.get("lateDays", 0) > 3:
            score += 15
            risk_factors.append(f"Đi muộn nhiều ({factors.get('lateDays')} ngày)")

        # High absent
        if factors.get("absentDays", 0) > 2:
            score += 20
            risk_factors.append(f"Vắng mặt nhiều ({factors.get('absentDays')} ngày)")

        level = "high" if score >= 60 else ("medium" if score >= 30 else "low")

        return {"score": min(100, score), "level": level, "factors": risk_factors}

    def _suggest_actions(
        self, turnover: Dict, burnout: Dict
    ) -> List[str]:
        """Goi y hanh dong cho manager"""
        actions = []

        if turnover["level"] == "high":
            actions.append("[Cao] Lên lịch gặp 1-on-1 sớm để thảo luận về career path")
            actions.append("[Cao] Xem xét điều chỉnh lương/phúc lợi")

        if burnout["level"] == "high":
            actions.append("[Cao] Phân bổ lại công việc để giảm tải")
            actions.append("[Cao] Khuyến khích nghỉ phép")

        if turnover["level"] == "medium":
            actions.append("[Trung bình] Theo dõi tình trạng nhân viên trong tháng tới")

        if burnout["level"] == "medium":
            actions.append("[Trung bình] Kiểm tra khối lượng công việc và OT")

        if not actions:
            actions.append("[Thấp] Nhân viên ổn định, tiếp tục theo dõi định kỳ")

        return actions

    async def _get_ai_risk_insight(self, factors: Dict) -> Optional[str]:
        """LLM phan tich risk factors va dua ra insight"""
        try:
            provider_router = get_provider_router()

            prompt = f"""Phân tích ngắn gọn rủi ro cho nhân viên sau (3-4 dòng):

Tên: {factors.get('name')} | Phòng ban: {factors.get('department_name')}
Thâm niên: {factors.get('tenure_years')} năm | Vị trí: {factors.get('position_name')}
OT trung bình 3 tháng: {factors.get('avg_ot_3m')}h | Ngày nghỉ đã dùng: {factors.get('leave_taken_this_year')}
Đi muộn: {factors.get('lateDays')} ngày | Vắng: {factors.get('absentDays')} ngày
Lương: {factors.get('salary'):,.0f} VNĐ | TB phòng ban: {factors.get('dept_avg_salary'):,.0f} VNĐ
Hợp đồng hết hạn: {factors.get('contract_days_to_expiry', 'N/A')} ngày nữa
Khen thưởng 12 tháng: {factors.get('recent_rewards')} | Kỷ luật: {factors.get('recent_disciplines')}

Đưa ra đánh giá rủi ro tổng quan và 1-2 gợi ý hành động cụ thể."""

            result = await provider_router.chat_completion(
                system_prompt="Bạn là chuyên gia HR analytics. Phân tích rủi ro nhân sự ngắn gọn, bằng tiếng Việt.",
                user_message=prompt,
                temperature=0.3,
            )

            return result.get("content") if result.get("success") else None
        except Exception:
            return None
