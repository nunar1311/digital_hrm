"""
Company Context - Lấy thông tin công ty để inject vào AI system prompt
"""

import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)


async def get_company_context() -> str:
    """
    Lấy thông tin công ty từ database để inject vào system prompt.
    Trả về chuỗi context hoặc empty string nếu không lấy được.
    """
    try:
        from app.database import get_db_pool

        pool = get_db_pool()
        if not pool:
            return ""

        async with pool.acquire() as conn:
            # Lấy thông tin công ty
            company_rows = await conn.fetch("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = 'companies'
                LIMIT 1
            """)

            if not company_rows:
                return ""

            # Thử lấy thông tin từ bảng companies
            company_info = await conn.fetchrow("""
                SELECT name, industry, size, address, phone, email
                FROM companies
                LIMIT 1
            """)

            if not company_info:
                return ""

            parts = []
            if company_info.get("name"):
                parts.append(f"- **Tên công ty:** {company_info['name']}")
            if company_info.get("industry"):
                parts.append(f"- **Ngành:** {company_info['industry']}")
            if company_info.get("size"):
                parts.append(f"- **Quy mô:** {company_info['size']} nhân viên")
            if company_info.get("address"):
                parts.append(f"- **Địa chỉ:** {company_info['address']}")

            # Lấy chính sách nghỉ phép
            leave_policies = await conn.fetch("""
                SELECT lt.name as leave_type, lb."totalDays" as default_days
                FROM leave_types lt
                LEFT JOIN leave_balances lb ON lt.id = lb."leaveTypeId" AND lb."policyYear" = EXTRACT(YEAR FROM CURRENT_DATE)
                WHERE lt."isActive" = true
                LIMIT 10
            """)

            if leave_policies:
                parts.append("\n**Chính sách nghỉ phép:**")
                for pol in leave_policies:
                    days = pol.get("default_days") or "?"
                    parts.append(f"- {pol['leave_type']}: {days} ngày/năm")

            # Lấy danh sách phòng ban
            departments = await conn.fetch("""
                SELECT d.name, COUNT(u.id) as employee_count
                FROM departments d
                LEFT JOIN users u ON u."departmentId" = d.id AND u."employeeStatus" = 'ACTIVE'
                GROUP BY d.id, d.name
                ORDER BY d.name
                LIMIT 10
            """)

            if departments:
                parts.append("\n**Phòng ban:**")
                for dept in departments:
                    count = dept.get("employee_count") or 0
                    parts.append(f"- {dept['name']}: {count} nhân viên")

            if parts:
                return "\n".join(parts)

            return ""

    except Exception as e:
        logger.warning(f"Could not fetch company context: {e}")
        return ""
