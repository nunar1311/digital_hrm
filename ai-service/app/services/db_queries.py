"""
Database Queries - Data Access Layer cho AI Service
Cac ham truy van du lieu tu PostgreSQL de phuc vu phan tich AI
Tat ca queries la READ-ONLY, khong thay doi du lieu
"""

import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, date

from app.database import get_db_pool

logger = logging.getLogger(__name__)


def _serialize_row(row: dict) -> dict:
    """Convert asyncpg Record/row values to JSON-serializable types"""
    result = {}
    for key, value in row.items():
        if isinstance(value, (datetime, date)):
            result[key] = value.isoformat()
        elif hasattr(value, '__float__'):
            # Decimal -> float
            result[key] = float(value)
        else:
            result[key] = value
    return result


def _serialize_rows(rows: list) -> list:
    """Convert a list of asyncpg Records to JSON-serializable dicts"""
    return [_serialize_row(dict(row)) for row in rows]


class HRDataQueries:
    """Truy van du lieu HR tu PostgreSQL cho phan tich AI"""

    @staticmethod
    async def get_employee_overview() -> Optional[Dict[str, Any]]:
        """Tong quan nhan su: so luong, phan bo, trang thai"""
        pool = get_db_pool()
        if not pool:
            return None

        try:
            async with pool.acquire() as conn:
                # Tong so nhan vien
                total = await conn.fetchval(
                    'SELECT COUNT(*) FROM users WHERE "employeeStatus" = $1', "ACTIVE"
                )

                # Phan bo theo gioi tinh
                gender_dist = await conn.fetch(
                    """
                    SELECT gender, COUNT(*) as count
                    FROM users
                    WHERE "employeeStatus" = 'ACTIVE' AND gender IS NOT NULL
                    GROUP BY gender
                    """
                )

                # Phan bo theo phong ban
                dept_dist = await conn.fetch(
                    """
                    SELECT d.name as department, COUNT(u.id) as count
                    FROM users u
                    JOIN departments d ON u."departmentId" = d.id
                    WHERE u."employeeStatus" = 'ACTIVE'
                    GROUP BY d.name
                    ORDER BY count DESC
                    """
                )

                # Phan bo theo loai hop dong
                employment_type = await conn.fetch(
                    """
                    SELECT "employmentType", COUNT(*) as count
                    FROM users
                    WHERE "employeeStatus" = 'ACTIVE' AND "employmentType" IS NOT NULL
                    GROUP BY "employmentType"
                    """
                )

                # Nhan vien moi (30 ngay gan day)
                new_hires = await conn.fetchval(
                    """
                    SELECT COUNT(*) FROM users
                    WHERE "hireDate" >= CURRENT_DATE - INTERVAL '30 days'
                    AND "employeeStatus" = 'ACTIVE'
                    """
                )

                # Nhan vien nghi viec (30 ngay gan day)
                resignations = await conn.fetchval(
                    """
                    SELECT COUNT(*) FROM users
                    WHERE "resignDate" >= CURRENT_DATE - INTERVAL '30 days'
                    """
                )

                # Tuoi trung binh
                avg_age = await conn.fetchval(
                    """
                    SELECT ROUND(AVG(EXTRACT(YEAR FROM AGE(CURRENT_DATE, "dateOfBirth"))))
                    FROM users
                    WHERE "employeeStatus" = 'ACTIVE' AND "dateOfBirth" IS NOT NULL
                    """
                )

                # Tham nien trung binh (nam)
                avg_tenure = await conn.fetchval(
                    """
                    SELECT ROUND(AVG(EXTRACT(YEAR FROM AGE(CURRENT_DATE, "hireDate")))::numeric, 1)
                    FROM users
                    WHERE "employeeStatus" = 'ACTIVE' AND "hireDate" IS NOT NULL
                    """
                )

                return {
                    "total_employees": total or 0,
                    "gender_distribution": _serialize_rows(gender_dist),
                    "department_distribution": _serialize_rows(dept_dist),
                    "employment_type_distribution": _serialize_rows(employment_type),
                    "new_hires_last_30_days": new_hires or 0,
                    "resignations_last_30_days": resignations or 0,
                    "average_age": float(avg_age) if avg_age else None,
                    "average_tenure_years": float(avg_tenure) if avg_tenure else None,
                    "snapshot_date": date.today().isoformat(),
                }
        except Exception as e:
            logger.error(f"Error fetching employee overview: {e}")
            return None

    @staticmethod
    async def get_attendance_summary(month: Optional[int] = None, year: Optional[int] = None) -> Optional[Dict[str, Any]]:
        """Tong hop cham cong: di muon, vang mat, OT"""
        pool = get_db_pool()
        if not pool:
            return None

        now = datetime.now()
        target_month = month or now.month
        target_year = year or now.year

        try:
            async with pool.acquire() as conn:
                # Tong hop tu bang attendance_summaries
                summaries = await conn.fetch(
                    """
                    SELECT
                        COUNT(*) as total_employees,
                        ROUND(AVG("totalWorkDays")::numeric, 1) as avg_work_days,
                        ROUND(AVG("standardDays")::numeric, 1) as standard_days,
                        SUM("lateDays") as total_late_days,
                        SUM("earlyLeaveDays") as total_early_leave_days,
                        SUM("absentDays")::numeric as total_absent_days,
                        SUM("leaveDays")::numeric as total_leave_days,
                        ROUND(AVG("totalOtHours")::numeric, 1) as avg_ot_hours,
                        SUM("totalOtHours")::numeric as total_ot_hours,
                        ROUND(AVG("totalWorkHours")::numeric, 1) as avg_work_hours
                    FROM attendance_summaries
                    WHERE month = $1 AND year = $2
                    """,
                    target_month, target_year,
                )

                # Nhan vien di muon nhieu nhat
                top_late = await conn.fetch(
                    """
                    SELECT u.name, u."employeeCode", a."lateDays"
                    FROM attendance_summaries a
                    JOIN users u ON a."userId" = u.id
                    WHERE a.month = $1 AND a.year = $2 AND a."lateDays" > 0
                    ORDER BY a."lateDays" DESC
                    LIMIT 5
                    """,
                    target_month, target_year,
                )

                # Ti le di muon
                total_with_summary = await conn.fetchval(
                    "SELECT COUNT(*) FROM attendance_summaries WHERE month = $1 AND year = $2",
                    target_month, target_year,
                )

                late_employees = await conn.fetchval(
                    "SELECT COUNT(*) FROM attendance_summaries WHERE month = $1 AND year = $2 AND \"lateDays\" > 0",
                    target_month, target_year,
                )

                summary = dict(summaries[0]) if summaries else {}

                return {
                    "month": target_month,
                    "year": target_year,
                    "summary": _serialize_row(summary),
                    "top_late_employees": _serialize_rows(top_late),
                    "late_rate_percent": round(
                        (late_employees / total_with_summary * 100) if total_with_summary else 0, 1
                    ),
                    "total_employees_tracked": total_with_summary or 0,
                }
        except Exception as e:
            logger.error(f"Error fetching attendance summary: {e}")
            return None

    @staticmethod
    async def get_payroll_summary(month: Optional[int] = None, year: Optional[int] = None) -> Optional[Dict[str, Any]]:
        """Tong hop luong: tong chi phi, phan bo"""
        pool = get_db_pool()
        if not pool:
            return None

        now = datetime.now()
        target_month = month or now.month
        target_year = year or now.year

        try:
            async with pool.acquire() as conn:
                # Tong hop tu payroll_records
                payroll = await conn.fetch(
                    """
                    SELECT
                        status,
                        "totalEmployees",
                        "totalGross",
                        "totalNet",
                        "totalTax",
                        "totalInsurance",
                        "totalDeductions"
                    FROM payroll_records
                    WHERE month = $1 AND year = $2
                    """,
                    target_month, target_year,
                )

                # Luong trung binh
                avg_salary = await conn.fetchval(
                    """
                    SELECT ROUND(AVG("baseSalary")::numeric, 0)
                    FROM salaries
                    """
                )

                # Phan bo luong theo phong ban
                salary_by_dept = await conn.fetch(
                    """
                    SELECT d.name as department,
                           COUNT(s.id) as employee_count,
                           ROUND(AVG(s."baseSalary")::numeric, 0) as avg_salary,
                           ROUND(MIN(s."baseSalary")::numeric, 0) as min_salary,
                           ROUND(MAX(s."baseSalary")::numeric, 0) as max_salary
                    FROM salaries s
                    JOIN users u ON s."userId" = u.id
                    JOIN departments d ON u."departmentId" = d.id
                    WHERE u."employeeStatus" = 'ACTIVE'
                    GROUP BY d.name
                    ORDER BY avg_salary DESC
                    """
                )

                return {
                    "month": target_month,
                    "year": target_year,
                    "payroll_records": _serialize_rows(payroll),
                    "average_base_salary": float(avg_salary) if avg_salary else 0,
                    "salary_by_department": _serialize_rows(salary_by_dept),
                }
        except Exception as e:
            logger.error(f"Error fetching payroll summary: {e}")
            return None

    @staticmethod
    async def get_leave_summary() -> Optional[Dict[str, Any]]:
        """Tong hop nghi phep"""
        pool = get_db_pool()
        if not pool:
            return None

        try:
            async with pool.acquire() as conn:
                # Don nghi phep theo trang thai
                leave_by_status = await conn.fetch(
                    """
                    SELECT status, COUNT(*) as count
                    FROM leave_requests
                    WHERE EXTRACT(YEAR FROM "createdAt") = EXTRACT(YEAR FROM CURRENT_DATE)
                    GROUP BY status
                    """
                )

                # Don nghi dang cho duyet
                pending = await conn.fetchval(
                    "SELECT COUNT(*) FROM leave_requests WHERE status = 'PENDING'"
                )

                # Loai nghi phep pho bien
                leave_types = await conn.fetch(
                    """
                    SELECT lt.name as leave_type, COUNT(lr.id) as count,
                           SUM(lr."totalDays")::numeric as total_days
                    FROM leave_requests lr
                    JOIN leave_types lt ON lr."leaveTypeId" = lt.id
                    WHERE EXTRACT(YEAR FROM lr."createdAt") = EXTRACT(YEAR FROM CURRENT_DATE)
                    GROUP BY lt.name
                    ORDER BY count DESC
                    """
                )

                # So du phep trung binh
                avg_balance = await conn.fetchval(
                    """
                    SELECT ROUND(AVG("totalDays" - "usedDays")::numeric, 1)
                    FROM leave_balances
                    WHERE "policyYear" = EXTRACT(YEAR FROM CURRENT_DATE)
                    """
                )

                return {
                    "leave_by_status": _serialize_rows(leave_by_status),
                    "pending_requests": pending or 0,
                    "leave_type_usage": _serialize_rows(leave_types),
                    "average_remaining_balance": float(avg_balance) if avg_balance else 0,
                }
        except Exception as e:
            logger.error(f"Error fetching leave summary: {e}")
            return None

    @staticmethod
    async def get_recruitment_summary() -> Optional[Dict[str, Any]]:
        """Tong hop tuyen dung"""
        pool = get_db_pool()
        if not pool:
            return None

        try:
            async with pool.acquire() as conn:
                # Tin tuyen dung theo trang thai
                jobs_by_status = await conn.fetch(
                    """
                    SELECT status, COUNT(*) as count
                    FROM job_postings
                    GROUP BY status
                    ORDER BY count DESC
                    """
                )

                # Ung vien theo giai doan
                candidates_by_stage = await conn.fetch(
                    """
                    SELECT stage, COUNT(*) as count
                    FROM candidates
                    GROUP BY stage
                    ORDER BY count DESC
                    """
                )

                # Tong so ung vien
                total_candidates = await conn.fetchval(
                    "SELECT COUNT(*) FROM candidates"
                )

                # So lich phong van sap toi
                upcoming_interviews = await conn.fetchval(
                    """
                    SELECT COUNT(*) FROM interviews
                    WHERE "scheduledDate" >= CURRENT_DATE
                    AND status = 'SCHEDULED'
                    """
                )

                # Ti le tuyen dung thanh cong
                hired = await conn.fetchval(
                    "SELECT COUNT(*) FROM candidates WHERE stage = 'HIRED'"
                )

                return {
                    "jobs_by_status": _serialize_rows(jobs_by_status),
                    "candidates_by_stage": _serialize_rows(candidates_by_stage),
                    "total_candidates": total_candidates or 0,
                    "upcoming_interviews": upcoming_interviews or 0,
                    "hired_count": hired or 0,
                    "hire_rate_percent": round(
                        (hired / total_candidates * 100) if total_candidates else 0, 1
                    ),
                }
        except Exception as e:
            logger.error(f"Error fetching recruitment summary: {e}")
            return None

    @staticmethod
    async def get_contract_summary() -> Optional[Dict[str, Any]]:
        """Tong hop hop dong"""
        pool = get_db_pool()
        if not pool:
            return None

        try:
            async with pool.acquire() as conn:
                # Hop dong theo trang thai
                contracts_by_status = await conn.fetch(
                    """
                    SELECT status, COUNT(*) as count
                    FROM contracts
                    GROUP BY status
                    ORDER BY count DESC
                    """
                )

                # Hop dong sap het han (30 ngay toi)
                expiring_soon = await conn.fetch(
                    """
                    SELECT c."contractNumber", c.title, c."endDate",
                           u.name as employee_name, u."employeeCode"
                    FROM contracts c
                    JOIN users u ON c."userId" = u.id
                    WHERE c.status = 'ACTIVE'
                    AND c."endDate" IS NOT NULL
                    AND c."endDate" BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
                    ORDER BY c."endDate" ASC
                    """
                )

                return {
                    "contracts_by_status": _serialize_rows(contracts_by_status),
                    "expiring_in_30_days": _serialize_rows(expiring_soon),
                    "expiring_count": len(expiring_soon),
                }
        except Exception as e:
            logger.error(f"Error fetching contract summary: {e}")
            return None

    @staticmethod
    async def get_department_analysis(department_id: str) -> Optional[Dict[str, Any]]:
        """Phan tich chi tiet phong ban"""
        pool = get_db_pool()
        if not pool:
            return None

        try:
            async with pool.acquire() as conn:
                # Thong tin phong ban
                dept = await conn.fetchrow(
                    """
                    SELECT d.id, d.name, d.code, d.description, d.status,
                           m.name as manager_name, m."employeeCode" as manager_code
                    FROM departments d
                    LEFT JOIN users m ON d."managerId" = m.id
                    WHERE d.id = $1
                    """,
                    department_id,
                )

                if not dept:
                    return None

                # Nhan vien trong phong ban
                employees = await conn.fetch(
                    """
                    SELECT u.id, u.name, u."employeeCode", u.gender,
                           u."hireDate", u."employmentType",
                           p.name as position_name
                    FROM users u
                    LEFT JOIN positions p ON u."positionId" = p.id
                    WHERE u."departmentId" = $1 AND u."employeeStatus" = 'ACTIVE'
                    ORDER BY u.name
                    """,
                    department_id,
                )

                # Tong hop cham cong phong ban (thang hien tai)
                now = datetime.now()
                attendance = await conn.fetchrow(
                    """
                    SELECT
                        COUNT(*) as employee_count,
                        ROUND(AVG("totalWorkDays")::numeric, 1) as avg_work_days,
                        SUM("lateDays") as total_late_days,
                        ROUND(AVG("totalOtHours")::numeric, 1) as avg_ot_hours
                    FROM attendance_summaries a
                    JOIN users u ON a."userId" = u.id
                    WHERE u."departmentId" = $1
                    AND a.month = $2 AND a.year = $3
                    """,
                    department_id, now.month, now.year,
                )

                # Phan bo luong phong ban
                salary_stats = await conn.fetchrow(
                    """
                    SELECT
                        COUNT(s.id) as employee_count,
                        ROUND(AVG(s."baseSalary")::numeric, 0) as avg_salary,
                        ROUND(MIN(s."baseSalary")::numeric, 0) as min_salary,
                        ROUND(MAX(s."baseSalary")::numeric, 0) as max_salary
                    FROM salaries s
                    JOIN users u ON s."userId" = u.id
                    WHERE u."departmentId" = $1 AND u."employeeStatus" = 'ACTIVE'
                    """,
                    department_id,
                )

                return {
                    "department": _serialize_row(dict(dept)),
                    "employee_count": len(employees),
                    "employees": _serialize_rows(employees),
                    "attendance_summary": _serialize_row(dict(attendance)) if attendance else {},
                    "salary_stats": _serialize_row(dict(salary_stats)) if salary_stats else {},
                }
        except Exception as e:
            logger.error(f"Error fetching department analysis: {e}")
            return None

    @staticmethod
    async def get_employee_360(user_id: str) -> Optional[Dict[str, Any]]:
        """Ho so 360 do cua nhan vien"""
        pool = get_db_pool()
        if not pool:
            return None

        try:
            async with pool.acquire() as conn:
                # Thong tin co ban
                employee = await conn.fetchrow(
                    """
                    SELECT u.id, u.name, u."employeeCode", u.email, u.gender,
                           u."dateOfBirth", u."hireDate", u."employmentType",
                           u."employeeStatus", u."educationLevel", u.university,
                           u.major, u.phone, u."maritalStatus",
                           d.name as department_name,
                           p.name as position_name,
                           m.name as manager_name
                    FROM users u
                    LEFT JOIN departments d ON u."departmentId" = d.id
                    LEFT JOIN positions p ON u."positionId" = p.id
                    LEFT JOIN users m ON u."managerId" = m.id
                    WHERE u.id = $1
                    """,
                    user_id,
                )

                if not employee:
                    return None

                # Luong hien tai
                salary = await conn.fetchrow(
                    'SELECT "baseSalary", "effectiveDate" FROM salaries WHERE "userId" = $1',
                    user_id,
                )

                # Lich su cham cong 3 thang gan nhat
                now = datetime.now()
                attendance_history = await conn.fetch(
                    """
                    SELECT month, year, "totalWorkDays", "standardDays",
                           "lateDays", "earlyLeaveDays", "absentDays",
                           "leaveDays", "totalOtHours", "totalWorkHours"
                    FROM attendance_summaries
                    WHERE "userId" = $1
                    ORDER BY year DESC, month DESC
                    LIMIT 3
                    """,
                    user_id,
                )

                # Hop dong hien tai
                contract = await conn.fetchrow(
                    """
                    SELECT "contractNumber", title, "startDate", "endDate",
                           status, salary as contract_salary
                    FROM contracts
                    WHERE "userId" = $1
                    ORDER BY "startDate" DESC
                    LIMIT 1
                    """,
                    user_id,
                )

                # Don nghi phep nam nay
                leave_balance = await conn.fetch(
                    """
                    SELECT lt.name as leave_type,
                           lb."totalDays", lb."usedDays", lb."pendingDays"
                    FROM leave_balances lb
                    JOIN leave_types lt ON lb."leaveTypeId" = lt.id
                    WHERE lb."userId" = $1
                    AND lb."policyYear" = EXTRACT(YEAR FROM CURRENT_DATE)
                    """,
                    user_id,
                )

                # Khen thuong / ky luat
                rewards = await conn.fetch(
                    """
                    SELECT type, title, description, amount, "decisionDate", status
                    FROM rewards
                    WHERE "userId" = $1
                    ORDER BY "decisionDate" DESC
                    LIMIT 10
                    """,
                    user_id,
                )

                # Timeline events
                timeline = await conn.fetch(
                    """
                    SELECT type, title, description, date
                    FROM employee_timelines
                    WHERE "userId" = $1
                    ORDER BY date DESC
                    LIMIT 10
                    """,
                    user_id,
                )

                return {
                    "employee": _serialize_row(dict(employee)),
                    "salary": _serialize_row(dict(salary)) if salary else None,
                    "attendance_history": _serialize_rows(attendance_history),
                    "current_contract": _serialize_row(dict(contract)) if contract else None,
                    "leave_balances": _serialize_rows(leave_balance),
                    "rewards": _serialize_rows(rewards),
                    "timeline": _serialize_rows(timeline),
                }
        except Exception as e:
            logger.error(f"Error fetching employee 360: {e}")
            return None

    @staticmethod
    async def get_full_hr_snapshot() -> Dict[str, Any]:
        """Chup nhanh toan bo du lieu HR cho AI phan tich"""
        employee_data = await HRDataQueries.get_employee_overview()
        attendance_data = await HRDataQueries.get_attendance_summary()
        payroll_data = await HRDataQueries.get_payroll_summary()
        leave_data = await HRDataQueries.get_leave_summary()
        recruitment_data = await HRDataQueries.get_recruitment_summary()
        contract_data = await HRDataQueries.get_contract_summary()

        return {
            "employees": employee_data,
            "attendance": attendance_data,
            "payroll": payroll_data,
            "leave": leave_data,
            "recruitment": recruitment_data,
            "contracts": contract_data,
            "generated_at": datetime.now().isoformat(),
        }

    @staticmethod
    async def search_data_for_query(query: str) -> Dict[str, Any]:
        """
        Thong minh tim kiem du lieu phu hop voi cau hoi cua nguoi dung.
        Phan tich keywords de quyet dinh query nao can chay.
        """
        query_lower = query.lower()
        result = {}

        # Keywords mapping
        employee_keywords = ["nhân viên", "nhan vien", "employee", "người", "tổng số", "bao nhiêu người", "headcount"]
        attendance_keywords = ["chấm công", "cham cong", "đi muộn", "di muon", "vắng", "attendance", "late", "absent"]
        payroll_keywords = ["lương", "luong", "salary", "payroll", "thu nhập", "chi phí"]
        leave_keywords = ["nghỉ phép", "nghi phep", "leave", "nghỉ", "phép"]
        recruitment_keywords = ["tuyển dụng", "tuyen dung", "ứng viên", "ung vien", "recruitment", "candidate"]
        contract_keywords = ["hợp đồng", "hop dong", "contract"]
        department_keywords = ["phòng ban", "phong ban", "department", "bộ phận"]

        # Luon lay tong quan nhan vien
        if any(k in query_lower for k in employee_keywords) or any(k in query_lower for k in department_keywords):
            result["employees"] = await HRDataQueries.get_employee_overview()

        if any(k in query_lower for k in attendance_keywords):
            result["attendance"] = await HRDataQueries.get_attendance_summary()

        if any(k in query_lower for k in payroll_keywords):
            result["payroll"] = await HRDataQueries.get_payroll_summary()

        if any(k in query_lower for k in leave_keywords):
            result["leave"] = await HRDataQueries.get_leave_summary()

        if any(k in query_lower for k in recruitment_keywords):
            result["recruitment"] = await HRDataQueries.get_recruitment_summary()

        if any(k in query_lower for k in contract_keywords):
            result["contracts"] = await HRDataQueries.get_contract_summary()

        # Neu khong match gi, lay toan bo snapshot
        if not result:
            result = await HRDataQueries.get_full_hr_snapshot()

        return result
