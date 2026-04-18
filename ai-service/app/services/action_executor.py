"""
HR Command Executor - Action Execution Layer cho AI Agent
Cung cap cac tools de AI thuc hien hanh dong thuc te trong he thong HR.
Moi tool tra ve ket qua co cau truc de hien thi cho user xac nhan.

Write operations goi qua Next.js API de dam bao validation + authorization.
Read operations truy van truc tiep database.
"""

import logging
import json
from typing import Optional, Dict, Any, List
from enum import Enum
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta, date as date_cls
import re
import time
import random
import string

from app.config import settings
from app.services.db_queries import HRDataQueries, EmployeePersonalQueries


def _generate_cuid() -> str:
    """Generate a CUID-compatible ID for Prisma models"""
    timestamp = int(time.time() * 1000)
    ts_part = ""
    while timestamp > 0:
        ts_part = string.ascii_lowercase[timestamp % 26] + ts_part
        timestamp //= 26
    rand_part = ''.join(random.choices(string.ascii_lowercase + string.digits, k=12))
    return f"cm{ts_part[-8:]}{rand_part}"

logger = logging.getLogger(__name__)

LEAVE_TYPE_MAP = {
    "ANNUAL": "Phép năm",
    "SICK": "Nghỉ ốm",
    "PERSONAL": "Nghỉ việc riêng",
    "MATERNITY": "Nghỉ thai sản",
    "PATERNITY": "Nghỉ chăm vợ đẻ",
    "WEDDING": "Nghỉ kết hôn",
    "FUNERAL": "Nghỉ tang lễ",
    "UNPAID": "Nghỉ không lương",
}
# Tool phan loai: safe = auto-execute, dangerous = canh bao truoc khi thuc hien
DANGEROUS_TOOLS: set[str] = set()  # chi co query_database voi SQL write moi danger

# Safe write tools — tu dong execute KHONG can xac nhan
SAFE_WRITE_TOOLS: set[str] = {
    "create_leave_request",
    "approve_leave_request",
    "reject_leave_request",
    "send_notification",
}

# Read-only tools — luon tu dong execute
READ_ONLY_TOOLS: set[str] = {
    "query_employee_data",
    "get_leave_balance",
    "get_attendance_report",
    "get_team_overview",
    "get_risk_assessment",
    "get_copilot_insight",
    "generate_document",
}


def is_tool_dangerous(tool_name: str, params: dict[str, Any] | None = None) -> bool:
    """Kiem tra tool co phai lai nguy hiem hay khong"""
    if tool_name != "query_database":
        return False
    if not params:
        return False
    query = params.get("query", "").lower()
    write_keywords = ["insert", "update", "delete", "drop", "truncate", "alter", "grant", "revoke", "commit", "rollback"]
    return any(kw in query for kw in write_keywords)


class ToolStatus(str, Enum):
    SUCCESS = "success"
    PENDING_CONFIRMATION = "pending_confirmation"
    ERROR = "error"
    REQUIRES_INFO = "requires_info"


@dataclass
class ToolResult:
    """Ket qua tra ve tu moi tool execution"""
    tool_name: str
    status: ToolStatus
    data: Optional[Dict[str, Any]] = None
    display_message: str = ""
    confirmation_required: bool = False
    confirmation_data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        result = asdict(self)
        result["status"] = self.status.value
        return result


# Dinh nghia cac tools co san cho AI
AVAILABLE_TOOLS = [
    {
        "name": "create_leave_request",
        "description": "Tạo đơn xin nghỉ phép cho nhân viên. Cần thông tin: loại nghỉ, ngày bắt đầu, ngày kết thúc, lý do.",
        "parameters": {
            "leave_type": "Loại nghỉ phép (ANNUAL, SICK, PERSONAL, MATERNITY, PATERNITY, WEDDING, FUNERAL, UNPAID)",
            "start_date": "Ngày bắt đầu nghỉ (YYYY-MM-DD)",
            "end_date": "Ngày kết thúc nghỉ (YYYY-MM-DD)",
            "reason": "Lý do xin nghỉ",
        },
    },
    {
        "name": "approve_leave_request",
        "description": "Duyệt đơn xin nghỉ phép. Chỉ manager/HR mới có quyền.",
        "parameters": {
            "request_id": "ID của đơn nghỉ phép cần duyệt",
            "comment": "Ghi chú khi duyệt (tùy chọn)",
        },
    },
    {
        "name": "reject_leave_request",
        "description": "Từ chối đơn xin nghỉ phép. BẮT BUỘC cung cấp lý do cụ thể, lịch sự và giải thích rõ ràng dựa trên hoàn cảnh (ví dụ: tiến độ dự án, thiếu nhân sự...).",
        "parameters": {
            "request_id": "ID của đơn nghỉ phép cần từ chối",
            "reason": "Lý do từ chối (bắt buộc: 1-2 câu chuyên nghiệp, giải thích cho nhân viên hiểu, KHÔNG dùng câu chung chung như 'Từ chối bởi manager')",
        },
    },
    {
        "name": "send_notification",
        "description": "Gửi thông báo đến một hoặc nhiều nhân viên.",
        "parameters": {
            "recipient_ids": "Danh sách ID người nhận (mảng)",
            "title": "Tiêu đề thông báo",
            "message": "Nội dung thông báo",
        },
    },
    {
        "name": "query_employee_data",
        "description": "Truy vấn thông tin chi tiết nhân viên theo tên hoặc mã nhân viên.",
        "parameters": {
            "search_term": "Tên hoặc mã nhân viên cần tìm",
        },
    },
    {
        "name": "get_leave_balance",
        "description": "Xem số ngày nghỉ phép còn lại của nhân viên.",
        "parameters": {
            "user_id": "Tên nhân viên, Mã NV, Email hoặc ID (tùy chọn, mặc định là chính mình)",
        },
    },
    {
        "name": "get_attendance_report",
        "description": "Xem báo cáo chấm công của nhân viên hoặc phòng ban.",
        "parameters": {
            "scope": "Phạm vi: 'personal' hoặc 'department'",
            "month": "Tháng (1-12, tùy chọn)",
            "year": "Năm (tùy chọn)",
        },
    },
    {
        "name": "get_team_overview",
        "description": "Xem tổng quan team/phòng ban: danh sách thành viên, chấm công, nghỉ phép.",
        "parameters": {
            "manager_id": "ID của manager (tùy chọn, mặc định là chính mình)",
        },
    },
    {
        "name": "analyze_approval_request",
        "description": "Phân tích đơn nghỉ phép/OT và đưa ra khuyến nghị duyệt/từ chối.",
        "parameters": {
            "request_id": "ID của đơn cần phân tích",
        },
    },
    {
        "name": "get_risk_assessment",
        "description": "Đánh giá rủi ro nghỉ việc, burnout của nhân viên hoặc phòng ban.",
        "parameters": {
            "scope": "Phạm vi: 'employee' hoặc 'department'",
            "target_id": "ID nhân viên hoặc phòng ban",
        },
    },
    {
        "name": "generate_document",
        "description": "Tạo tài liệu HR: JD, offer letter, thông báo, biên bản.",
        "parameters": {
            "doc_type": "Loại tài liệu: 'jd', 'offer_letter', 'announcement', 'meeting_minutes'",
            "context": "Thông tin ngữ cảnh để tạo tài liệu",
        },
    },
    {
        "name": "get_copilot_insight",
        "description": "Lấy insight cho manager: team health, chuẩn bị 1-on-1, gợi ý feedback.",
        "parameters": {
            "insight_type": "Loại insight: 'team_health', '1on1_prep', 'performance_nudge', 'meeting_agenda'",
            "target_employee_id": "ID nhân viên (cho 1on1_prep hoặc performance_nudge)",
        },
    },
    {
        "name": "query_database",
        "description": "Thực hiện truy vấn SQL tự do (Bao gồm SELECT, UPDATE, INSERT, DELETE) để điều tra hoặc can thiệp trực tiếp vào database. YÊU CẦU QUAN TRỌNG: 1. Sử dụng đúng tên cột (khéo léo dùng dấu ngoặc kép đôi với tên cột camelCase như \"departmentId\", \"positionId\", \"hireDate\", \"employeeStatus\"). 2. Bảng nhân viên là 'users' (KHÔNG phải employees), phòng ban 'departments', chức vụ 'positions', đơn phép 'leave_requests' (có \"leaveTypeId\", \"userId\"), số dư phép 'leave_balances', chấm công 'attendance_summaries'.",
        "parameters": {
            "query": "Câu lệnh SQL SELECT cần thực thi (vd: SELECT * FROM users LIMIT 5)",
        },
    },
]


def get_tools_prompt() -> str:
    """Tao phan mo ta tools de chen vao system prompt cho AI"""
    tools_desc = []
    for tool in AVAILABLE_TOOLS:
        params = ", ".join([f"{k}: {v}" for k, v in tool["parameters"].items()])
        tools_desc.append(
            f"- **{tool['name']}**: {tool['description']}\n  Tham số: {params}"
        )

    return """
BẠN LÀ CHUYÊN GIA HR TOÀN QUYỀN.
Bạn có khả năng TỰ QUYẾT ĐỊNH và TỰ THỰC HIỆN NGAY các tác vụ HR mà KHÔNG cần hỏi lại người dùng.
Khi người dùng yêu cầu thực hiện một hành động, HÃY THỰC HIỆN NGAY — không cần xác nhận.

KHI NGƯỜI DÙNG YÊU CẦU THỰC HIỆN HÀNH ĐỘNG, hãy trả về một khối JSON hành động:
```action
{
  "tool": "tên_tool",
  "params": { "param1": "value1", "param2": "value2" },
  "description": "Mô tả hành động đã thực hiện bằng tiếng Việt"
}
```

CÁC TOOLS CÓ SẴN (tất cả đều TỰ ĐỘNG THỰC HIỆN ngay khi được gọi):
""" + "\n".join(tools_desc) + """

QUY TẮC QUAN TRỌNG:
1. Khi người dùng yêu cầu hành động → GỌI TOOL NGAY, KHÔNG hỏi xác nhận
2. Luôn MÔ TẢ hành động trước, rồi mới đưa ra khối action
3. Nếu thiếu thông tin → TỰ HOÀN THIỆN từ dữ liệu có sẵn, hoặc hỏi nhanh 1 câu
4. Có thể đề xuất NHIỀU action trong cùng một tin nhắn
5. Luôn đi kèm kết quả thực tế sau khi thực hiện tool
6. Khi cần SQL INSERT/UPDATE/DELETE — GỌI tool query_database NGAY, hệ thống sẽ tự xử lý
"""


class HRCommandExecutor:
    """Thuc hien cac hanh dong HR tu AI Agent"""

    def __init__(self, user_id: str, user_role: str):
        self.user_id = user_id
        self.user_role = user_role
        self.nextjs_api_url = settings.next_public_api_url

    async def execute(self, tool_name: str, params: Dict[str, Any], confirmed: bool = False) -> ToolResult:
        """Dispatch tool execution dua tren ten tool.
        Auto-executes safe tools immediately. Only dangerous SQL writes need confirmation."""
        # AUTO-CONFIRM logic: safe tools always execute immediately
        if not is_tool_dangerous(tool_name, params):
            confirmed = True

        executor_map = {
            "create_leave_request": self._create_leave_request,
            "approve_leave_request": self._approve_leave_request,
            "reject_leave_request": self._reject_leave_request,
            "send_notification": self._send_notification,
            "query_employee_data": self._query_employee_data,
            "get_leave_balance": self._get_leave_balance,
            "get_attendance_report": self._get_attendance_report,
            "get_team_overview": self._get_team_overview,
            "analyze_approval_request": self._analyze_approval_request,
            "get_risk_assessment": self._get_risk_assessment,
            "generate_document": self._generate_document,
            "get_copilot_insight": self._get_copilot_insight,
            "query_database": self._query_database,
        }

        executor = executor_map.get(tool_name)
        if not executor:
            return ToolResult(
                tool_name=tool_name,
                status=ToolStatus.ERROR,
                error="Có lỗi xảy ra. Thử lại hoặc liên hệ HR nếu vấn đề tiếp tục.",
            )

        try:
            return await executor(params, confirmed=confirmed)
        except TypeError:
            return await executor(params)
        except Exception as e:
            logger.error(f"Tool execution error [{tool_name}]: {e}", exc_info=True)
            return ToolResult(
                tool_name=tool_name,
                status=ToolStatus.ERROR,
                error="Có lỗi xảy ra. Thử lại hoặc liên hệ HR nếu vấn đề tiếp tục.",
            )

    # ========== READ OPERATIONS (Direct DB) ==========

    async def _query_database(self, params: Dict[str, Any], confirmed: bool = False) -> ToolResult:
        """Thuc thi cau lenh SQL de lay du lieu hoac cap nhat du lieu neu duoc xac nhan"""
        is_admin = self.user_role in ("SUPER_ADMIN", "HR_MANAGER", "DIRECTOR", "HR_STAFF")
        if not is_admin:
            return ToolResult(
                tool_name="query_database",
                status=ToolStatus.ERROR,
                error="Quyền truy cập bị từ chối: Bạn không có quyền truy cập tác vụ này.",
            )

        query = params.get("query", "").strip()
        if not query:
            return ToolResult(
                tool_name="query_database",
                status=ToolStatus.REQUIRES_INFO,
                display_message="Cần xác nhận SQL trước khi thực thi.",
            )

        lower_query = query.lower()
        # Drop, truncate and schema changes are blocked completely
        blocked_keywords = ["drop", "truncate", "alter", "grant", "revoke"]
        for keyword in blocked_keywords:
            if re.search(rf'\b{keyword}\b', lower_query):
                return ToolResult(
                    tool_name="query_database",
                    status=ToolStatus.ERROR,
                    error=f"Lỗi: Không được phép chạy câu lệnh chứa từ khóa '{keyword}' vì lý do bảo mật hệ thống cốt lõi.",
                )

        write_keywords = ["insert", "update", "delete", "commit", "rollback"]
        is_write = any(re.search(rf'\b{kw}\b', lower_query) for kw in write_keywords)

        if is_write and not confirmed:
            return ToolResult(
                tool_name="query_database",
                status=ToolStatus.PENDING_CONFIRMATION,
                confirmation_required=True,
                confirmation_data={
                    "action": "query_database",
                    "query": query,
                },
                display_message=(
                    f"**Cảnh báo: Hành động này sẽ thay đổi dữ liệu hệ thống!**\n"
                    f"- Câu lệnh: `{query}`\n\n"
                    f"Bạn có chắc chắn muốn thực thi SQL này không?"
                ),
                data=params,
            )

        from app.database import get_db_pool
        pool = get_db_pool()
        if not pool:
            return ToolResult(
                tool_name="query_database",
                status=ToolStatus.ERROR,
                error="Chưa lấy được dữ liệu lúc này. Thử lại sau nhé.",
            )

        try:
            async with pool.acquire() as conn:
                if is_write:
                    status = await conn.execute(query)
                    return ToolResult(
                        tool_name="query_database",
                        status=ToolStatus.SUCCESS,
                        display_message="Cập nhật dữ liệu thành công.",
                        data={"status": status}
                    )
                else:
                    # Fetch output from db
                    rows = await conn.fetch(query)
                    
                    from app.services.db_queries import _serialize_rows
                    # Slice to 50 elements just in case the AI didn't use LIMIT
                    results = _serialize_rows(rows)[:50]

                    if not results:
                        return ToolResult(
                            tool_name="query_database",
                            status=ToolStatus.SUCCESS,
                            data={"results": [], "count": 0},
                            display_message="Không tìm thấy dữ liệu phù hợp.",
                        )

                    return ToolResult(
                        tool_name="query_database",
                        status=ToolStatus.SUCCESS,
                        data={"results": results, "count": len(results)},
                        display_message=f"Tìm thấy {len(results)} kết quả.",
                    )
        except Exception as e:
            err_str = str(e)
            
            # Clean up known PostgreSQL syntax error prefixes if needed, but preserve the core message
            user_friendly_err = err_str.split("\n")[0]  # Just take the first line to avoid large traces
            
            return ToolResult(
                tool_name="query_database",
                status=ToolStatus.ERROR,
                error=f"Lỗi truy vấn CSDL: {user_friendly_err}",
                data={"_internal_error": err_str},  # For AI retry loop only
            )

    async def _query_employee_data(self, params: Dict[str, Any]) -> ToolResult:
        """Tim kiem va tra ve thong tin nhan vien"""
        search_term = params.get("search_term", "")
        if not search_term:
            return ToolResult(
                tool_name="query_employee_data",
                status=ToolStatus.REQUIRES_INFO,
                data={"missing_field": "search_term"},
            )

        from app.database import get_db_pool
        pool = get_db_pool()
        if not pool:
            return ToolResult(
                tool_name="query_employee_data",
                status=ToolStatus.ERROR,
                error="Chưa lấy được dữ liệu lúc này. Thử lại sau nhé.",
            )

        try:
            async with pool.acquire() as conn:
                # Fuzzy search by name or employee code
                rows = await conn.fetch(
                    """
                    SELECT u.id, u.name, u."username", u.email, u.gender,
                           u."hireDate", u."employmentType", u."employeeStatus",
                           d.name as department_name, p.name as position_name
                    FROM users u
                    LEFT JOIN departments d ON u."departmentId" = d.id
                    LEFT JOIN positions p ON u."positionId" = p.id
                    WHERE (u.name ILIKE $1 OR u."username" ILIKE $1)
                    AND u."employeeStatus" = 'ACTIVE'
                    LIMIT 10
                    """,
                    f"%{search_term}%",
                )

                if not rows:
                    return ToolResult(
                        tool_name="query_employee_data",
                        status=ToolStatus.SUCCESS,
                        data={"results": [], "count": 0},
                        display_message=f"Không tìm thấy nhân viên nào khớp với '{search_term}'.",
                    )

                from app.services.db_queries import _serialize_rows
                results = _serialize_rows(rows)

                # Format as readable text
                lines = [f"Tìm thấy **{len(results)} nhân viên** khớp với '{search_term}':\n"]
                for r in results:
                    lines.append(f"- **{r.get('name')}** (Mã nhân viên: {r.get('username', '')})")
                    lines.append(f"  Phòng ban: {r.get('department_name', 'N/A')} | Vị trí: {r.get('position_name', 'N/A')}")
                    lines.append(f"  Email: {r.get('email', '')} | Trạng thái: {r.get('employeeStatus', '')}")

                return ToolResult(
                    tool_name="query_employee_data",
                    status=ToolStatus.SUCCESS,
                    display_message="\n".join(lines),
                )
        except Exception as e:
            return ToolResult(
                tool_name="query_employee_data",
                status=ToolStatus.ERROR,
                error="Có lỗi xảy ra. Thử lại sau nhé.",
            )

    async def _get_leave_balance(self, params: Dict[str, Any]) -> ToolResult:
        """Xem so du nghi phep"""
        target_user_id = params.get("user_id", self.user_id)
        is_manager_or_admin = self.user_role in ("SUPER_ADMIN", "HR_MANAGER", "DIRECTOR", "HR_STAFF", "MANAGER")
        if not is_manager_or_admin and str(target_user_id) != str(self.user_id):
            # Employees can only check their own leave balance
            target_user_id = self.user_id
        
        user_id = target_user_id

        from app.database import get_db_pool
        pool = get_db_pool()
        if not pool:
            return ToolResult(
                tool_name="get_leave_balance",
                status=ToolStatus.ERROR,
                error="Chưa lấy được dữ liệu lúc này. Thử lại sau nhé.",
            )

        try:
            async with pool.acquire() as conn:
                balances = await conn.fetch(
                    """
                    SELECT lt.name as leave_type,
                           lb."totalDays", lb."usedDays", lb."pendingDays",
                           (lb."totalDays" - lb."usedDays" - lb."pendingDays") as remaining,
                           u.name as emp_name
                    FROM leave_balances lb
                    JOIN leave_types lt ON lb."leaveTypeId" = lt.id
                    JOIN users u ON lb."userId" = u.id
                    WHERE (lb."userId" = $1 OR u."username" = $1 OR u."email" = $1 OR u."name" ILIKE ('%' || CAST($1 AS TEXT) || '%'))
                    AND lb."policyYear" = EXTRACT(YEAR FROM CURRENT_DATE)
                    """,
                    user_id,
                )

                from app.services.db_queries import _serialize_rows
                data = _serialize_rows(balances)

                # Format as readable text
                lines = ["**Số dư nghỉ phép:**\n"]
                
                if not data:
                    user_info = await conn.fetchrow(
                        """SELECT name FROM users WHERE id = $1 OR "username" = $1 OR "email" = $1 LIMIT 1""",
                        user_id
                    )
                    display_name = user_info['name'] if user_info else ("bạn" if str(user_id) == str(self.user_id) else "nhân viên này")
                    lines.append(f"Không tìm thấy dữ liệu số dư nghỉ phép cho '{display_name}' trong năm hiện tại.")
                else:
                    for b in data:
                        emp = b.get('emp_name', '')
                        remaining = b.get('remaining', 0)
                        total = b.get('totalDays', 0)
                        used = b.get('usedDays', 0)
                        pending = b.get('pendingDays', 0)
                        leave_type_raw = str(b.get('leave_type', ''))
                        leave_type_vn = LEAVE_TYPE_MAP.get(leave_type_raw.upper(), leave_type_raw)
                        lines.append(f"- **{emp}** ({leave_type_vn}): {remaining}/{total} ngày còn lại (đã dùng: {used}, đang chờ: {pending})")

                return ToolResult(
                    tool_name="get_leave_balance",
                    status=ToolStatus.SUCCESS,
                    display_message="\n".join(lines),
                )
        except Exception as e:
            return ToolResult(
                tool_name="get_leave_balance",
                status=ToolStatus.ERROR,
                error="Có lỗi xảy ra. Thử lại sau nhé.",
            )

    async def _get_attendance_report(self, params: Dict[str, Any]) -> ToolResult:
        """Bao cao cham cong"""
        scope = params.get("scope", "personal")
        month = params.get("month")
        year = params.get("year")

        try:
            if scope == "personal":
                data = await EmployeePersonalQueries.get_personal_attendance(
                    self.user_id, month, year
                )
            else:
                data = await HRDataQueries.get_attendance_summary(month, year)

            return ToolResult(
                tool_name="get_attendance_report",
                status=ToolStatus.SUCCESS,
                data=data or {},
                display_message="Đã lấy báo cáo chấm công.",
            )
        except Exception as e:
            return ToolResult(
                tool_name="get_attendance_report",
                status=ToolStatus.ERROR,
                error="Có lỗi xảy ra. Thử lại sau nhé.",
            )

    async def _get_team_overview(self, params: Dict[str, Any]) -> ToolResult:
        """Tong quan team cho manager"""
        manager_id = params.get("manager_id", self.user_id)
        is_admin = self.user_role in ("SUPER_ADMIN", "HR_MANAGER", "DIRECTOR", "HR_STAFF")

        from app.database import get_db_pool
        pool = get_db_pool()
        if not pool:
            return ToolResult(
                tool_name="get_team_overview",
                status=ToolStatus.ERROR,
                error="Chưa lấy được dữ liệu lúc này. Thử lại sau nhé.",
            )

        try:
            async with pool.acquire() as conn:
                if is_admin:
                    members = await conn.fetch(
                        """
                        SELECT u.id, u.name, u."username",
                               u."employeeStatus", u."hireDate",
                               p.name as position_name,
                               d.name as department_name
                        FROM users u
                        LEFT JOIN positions p ON u."positionId" = p.id
                        LEFT JOIN departments d ON u."departmentId" = d.id
                        WHERE u."employeeStatus" = 'ACTIVE'
                        ORDER BY u.name
                        LIMIT 15
                        """
                    )
                    pending_leaves = await conn.fetch(
                        """
                        SELECT lr.id, lr."startDate", lr."endDate", lr."totalDays",
                               lr.reason, lr.status, u.name as employee_name,
                               lt.name as leave_type
                        FROM leave_requests lr
                        JOIN users u ON lr."userId" = u.id
                        JOIN leave_types lt ON lr."leaveTypeId" = lt.id
                        WHERE lr.status = 'PENDING'
                        ORDER BY lr."createdAt" DESC
                        LIMIT 10
                        """
                    )
                else:
                    members = await conn.fetch(
                        """
                        SELECT u.id, u.name, u."username",
                               u."employeeStatus", u."hireDate",
                               p.name as position_name,
                               d.name as department_name
                        FROM users u
                        LEFT JOIN positions p ON u."positionId" = p.id
                        LEFT JOIN departments d ON u."departmentId" = d.id
                        WHERE (u."managerId" = $1 OR u."departmentId" IN (SELECT id FROM departments WHERE "managerId" = $1))
                        AND u."employeeStatus" = 'ACTIVE'
                        ORDER BY u.name
                        """,
                        manager_id,
                    )
                    pending_leaves = await conn.fetch(
                        """
                        SELECT lr.id, lr."startDate", lr."endDate", lr."totalDays",
                               lr.reason, lr.status, u.name as employee_name,
                               lt.name as leave_type
                        FROM leave_requests lr
                        JOIN users u ON lr."userId" = u.id
                        JOIN leave_types lt ON lr."leaveTypeId" = lt.id
                        WHERE (u."managerId" = $1 OR u."departmentId" IN (SELECT id FROM departments WHERE "managerId" = $1))
                        AND lr.status = 'PENDING'
                        ORDER BY lr."createdAt" DESC
                        LIMIT 10
                        """,
                        manager_id,
                    )

                from app.services.db_queries import _serialize_rows
                members_data = _serialize_rows(members)
                leaves_data = _serialize_rows(pending_leaves)

                # Format as readable text
                if is_admin:
                    lines = [f"### Tổng Quan Toàn Công Ty (Vai Trò: {self.user_role})\n"]
                    lines.append(f"*(Hiển thị tối đa 15 thành viên và 10 đơn phép)*\n")
                else:
                    lines = [f"### Tổng Quan Team ({len(members_data)} thành viên)\n"]

                if members_data:
                    lines.append("#### 👥 Danh sách thành viên")
                    for m in members_data:
                        lines.append(f"- **{m.get('name')}** `({m.get('username', '')})` — *{m.get('position_name', 'N/A')}*")
                    lines.append("")

                if leaves_data:
                    lines.append(f"#### ⏳ Đơn nghỉ phép chờ duyệt ({len(leaves_data)})")
                    for l in leaves_data:
                        leave_type_raw = str(l.get('leave_type', ''))
                        leave_type_vn = LEAVE_TYPE_MAP.get(leave_type_raw.upper(), leave_type_raw)
                        lines.append(f"- **{l.get('employee_name')}** — {leave_type_vn}: `{l.get('startDate')} → {l.get('endDate')}` ({l.get('totalDays')} ngày)")
                        if l.get('reason'):
                            lines.append(f"  > *Lý do: {l.get('reason')}*")
                else:
                    lines.append("#### ✨ Không có đơn nghỉ phép đang chờ duyệt.")

                return ToolResult(
                    tool_name="get_team_overview",
                    status=ToolStatus.SUCCESS,
                    display_message="\n".join(lines),
                )
        except Exception as e:
            return ToolResult(
                tool_name="get_team_overview",
                status=ToolStatus.ERROR,
                error="Có lỗi xảy ra. Thử lại sau nhé.",
            )

    # ========== WRITE OPERATIONS (Via Next.js API — confirmation required) ==========

    async def _create_leave_request(self, params: Dict[str, Any], confirmed: bool = False) -> ToolResult:
        """Tao don nghi phep — yeu cau xac nhan, thuc su tao khi confirmed=True"""
        required = ["leave_type", "start_date", "end_date", "reason"]
        missing = [k for k in required if not params.get(k)]
        if missing:
            return ToolResult(
                tool_name="create_leave_request",
                status=ToolStatus.REQUIRES_INFO,
                data={"missing_fields": missing},
            )

        leave_type_code = params["leave_type"].upper()
        leave_type_vn = LEAVE_TYPE_MAP.get(leave_type_code, params["leave_type"])

        from app.database import get_db_pool
        pool = get_db_pool()
        if not pool:
            return ToolResult(
                tool_name="create_leave_request",
                status=ToolStatus.ERROR,
                error="Chưa lấy được dữ liệu lúc này. Thử lại sau nhé.",
            )

        user_id = params.get("user_id", self.user_id)

        try:
            async with pool.acquire() as conn:
                # 1. Look up leave type by name matching
                # Build flexible search: try full name, code, and also check if DB name is contained in our search
                leave_type_row = await conn.fetchrow(
                    """
                    SELECT id, name, "defaultDays"
                    FROM leave_types
                    WHERE "isActive" = true
                    AND (
                        name ILIKE $1
                        OR name ILIKE $2
                        OR name ILIKE $3
                        OR $1 ILIKE '%' || name || '%'
                        OR $3 ILIKE '%' || name || '%'
                    )
                    LIMIT 1
                    """,
                    f"%{leave_type_vn}%",
                    f"%{leave_type_code}%",
                    f"%{params['leave_type']}%",
                )

                if not leave_type_row:
                    return ToolResult(
                        tool_name="create_leave_request",
                        status=ToolStatus.ERROR,
                        error=f"Không tìm thấy loại nghỉ phép '{leave_type_vn}'. Vui lòng kiểm tra lại.",
                    )

                leave_type_id = leave_type_row["id"]
                leave_type_name = leave_type_row["name"]
                default_days = leave_type_row["defaultDays"]

                # 2. Parse dates & calculate working days
                start_date = date_cls.fromisoformat(params["start_date"])
                end_date = date_cls.fromisoformat(params["end_date"])

                if start_date > end_date:
                    return ToolResult(
                        tool_name="create_leave_request",
                        status=ToolStatus.ERROR,
                        error="Ngày bắt đầu phải trước ngày kết thúc.",
                    )

                # Calculate working days (exclude weekends)
                total_days = 0
                current = start_date
                while current <= end_date:
                    if current.weekday() < 5:  # Mon-Fri
                        total_days += 1
                    current = current + timedelta(days=1)

                if total_days <= 0:
                    return ToolResult(
                        tool_name="create_leave_request",
                        status=ToolStatus.ERROR,
                        error="Không có ngày làm việc nào trong khoảng đã chọn.",
                    )

                # 3. Check for overlapping requests
                overlap = await conn.fetchrow(
                    """
                    SELECT id FROM leave_requests
                    WHERE "userId" = $1
                    AND status IN ('PENDING', 'APPROVED')
                    AND "startDate" <= $2
                    AND "endDate" >= $3
                    LIMIT 1
                    """,
                    user_id, end_date, start_date
                )
                if overlap:
                    return ToolResult(
                        tool_name="create_leave_request",
                        status=ToolStatus.ERROR,
                        error="Bạn đã có yêu cầu nghỉ phép trùng ngày (đang chờ duyệt hoặc đã duyệt).",
                    )

                # 4. Get or create leave balance
                current_year = datetime.now().year
                balance = await conn.fetchrow(
                    """
                    SELECT id, "totalDays", "usedDays", "pendingDays"
                    FROM leave_balances
                    WHERE "userId" = $1 AND "leaveTypeId" = $2 AND "policyYear" = $3
                    """,
                    user_id, leave_type_id, current_year
                )

                if balance:
                    available = balance["totalDays"] - balance["usedDays"] - balance["pendingDays"]
                    if total_days > available:
                        return ToolResult(
                            tool_name="create_leave_request",
                            status=ToolStatus.ERROR,
                            error=f"Số ngày nghỉ khả dụng không đủ. Bạn chỉ còn {available} ngày {leave_type_name}.",
                        )
                    balance_id = balance["id"]
                else:
                    # Auto-create balance with default days
                    if total_days > default_days:
                        return ToolResult(
                            tool_name="create_leave_request",
                            status=ToolStatus.ERROR,
                            error=f"Số ngày nghỉ khả dụng không đủ. Bạn chỉ còn {default_days} ngày.",
                        )
                    balance_cuid = _generate_cuid()
                    new_balance = await conn.fetchrow(
                        """
                        INSERT INTO leave_balances (id, "userId", "leaveTypeId", "policyYear", "totalDays", "usedDays", "pendingDays")
                        VALUES ($1, $2, $3, $4, $5, 0, $6)
                        RETURNING id
                        """,
                        balance_cuid, user_id, leave_type_id, current_year, default_days, total_days
                    )
                    balance_id = new_balance["id"]

                # 5. Create leave request + update balance in a transaction
                async with conn.transaction():
                    # Update pending days on balance (skip if just created with pending already set)
                    if balance:
                        await conn.execute(
                            """
                            UPDATE leave_balances
                            SET "pendingDays" = "pendingDays" + $1
                            WHERE id = $2
                            """,
                            total_days, balance_id
                        )

                    # Create the leave request
                    request_cuid = _generate_cuid()
                    new_request = await conn.fetchrow(
                        """
                        INSERT INTO leave_requests (
                            id, "userId", "leaveTypeId", "leaveBalanceId",
                            "startDate", "endDate", "totalDays",
                            "reason", "status", "createdAt", "updatedAt"
                        )
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING', NOW(), NOW())
                        RETURNING id
                        """,
                        request_cuid, user_id, leave_type_id, balance_id,
                        start_date, end_date, total_days,
                        params.get("reason", ""),
                    )

                return ToolResult(
                    tool_name="create_leave_request",
                    status=ToolStatus.SUCCESS,
                    display_message=(
                        f"**Đã tạo đơn nghỉ phép thành công!**\n"
                        f"- Loại: {leave_type_name}\n"
                        f"- Từ: {params['start_date']} đến {params['end_date']}\n"
                        f"- Số ngày: {total_days} ngày làm việc\n"
                        f"- Lý do: {params.get('reason', '')}\n"
                        f"- Trạng thái: Đang chờ duyệt"
                    ),
                    data={"request_id": str(new_request["id"]), "total_days": total_days},
                )

        except Exception as e:
            logger.error(f"Create leave request error: {e}", exc_info=True)
            return ToolResult(
                tool_name="create_leave_request",
                status=ToolStatus.ERROR,
                error="Tạo đơn nghỉ phép thất bại. Liên hệ HR nếu cần hỗ trợ.",
            )

    async def _approve_leave_request(self, params: Dict[str, Any], confirmed: bool = False) -> ToolResult:
        """Duyet don nghi phep — thuc su cap nhat DB khi confirmed=True"""
        is_manager_or_admin = self.user_role in ("SUPER_ADMIN", "HR_MANAGER", "DIRECTOR", "HR_STAFF", "MANAGER")
        if not is_manager_or_admin:
            return ToolResult(
                tool_name="approve_leave_request",
                status=ToolStatus.ERROR,
                error="Quyền truy cập bị từ chối: Chỉ cấp quản lý trở lên mới có thể duyệt đơn.",
            )

        request_id = params.get("request_id")
        if not request_id:
            return ToolResult(
                tool_name="approve_leave_request",
                status=ToolStatus.REQUIRES_INFO,
                data={"missing_field": "request_id"},
            )

        from app.database import get_db_pool
        pool = get_db_pool()
        if not pool:
            return ToolResult(
                tool_name="approve_leave_request",
                status=ToolStatus.ERROR,
                error="Chưa lấy được dữ liệu lúc này. Thử lại sau nhé.",
            )

        if not confirmed:
            # First call: show preview and ask for confirmation. Query DB to show readable details.
            try:
                async with pool.acquire() as conn:
                    req_info = await conn.fetchrow(
                        """
                        SELECT u.name as employee_name, lt.name as leave_type, lr."startDate", lr."endDate", lr."totalDays"
                        FROM leave_requests lr
                        JOIN users u ON lr."userId" = u.id
                        JOIN leave_types lt ON lr."leaveTypeId" = lt.id
                        WHERE lr.id = $1
                        """,
                        request_id
                    )
            except Exception:
                req_info = None

            if req_info:
                display_msg = (
                    f"**Duyệt đơn nghỉ phép**\n"
                    f"- Nhân viên: **{req_info['employee_name']}**\n"
                    f"- Loại phép: {req_info['leave_type']}\n"
                    f"- Thời gian: {req_info['startDate']} đến {req_info['endDate']} ({req_info['totalDays']} ngày)\n"
                    f"- Ghi chú: {params.get('comment', 'Không có')}\n\n"
                    f"Xác nhận duyệt đơn này?"
                )
            else:
                display_msg = (
                    f"**Duyệt đơn nghỉ phép**\n"
                    f"- Mã đơn: {request_id[:8]}...\n"
                    f"- Ghi chú: {params.get('comment', 'Không có')}\n\n"
                    f"Xác nhận duyệt đơn này?"
                )

            return ToolResult(
                tool_name="approve_leave_request",
                status=ToolStatus.PENDING_CONFIRMATION,
                confirmation_required=True,
                confirmation_data={
                    "action": "approve_leave_request",
                    "request_id": request_id,
                    "approver_id": self.user_id,
                    "comment": params.get("comment", ""),
                },
                display_message=display_msg,
                data=params,
            )

        # confirmed=True → Actually execute the approval in the database

        try:
            async with pool.acquire() as conn:
                # Verify the leave request exists and is PENDING
                req = await conn.fetchrow(
                    """
                    SELECT lr.id, lr.status, lr."userId", lr."totalDays",
                           lr."leaveBalanceId", lr."leaveTypeId",
                           u.name as employee_name
                    FROM leave_requests lr
                    JOIN users u ON lr."userId" = u.id
                    WHERE lr.id = $1
                    """,
                    request_id,
                )

                if not req:
                    return ToolResult(
                        tool_name="approve_leave_request",
                        status=ToolStatus.ERROR,
                        error=f"Không tìm thấy đơn nghỉ phép ID: {request_id}",
                    )

                if req["status"] != "PENDING":
                    return ToolResult(
                        tool_name="approve_leave_request",
                        status=ToolStatus.ERROR,
                        error=f"Đơn không ở trạng thái chờ duyệt (hiện tại: {req['status']})",
                    )

                # Transaction: update leave balance + update request status
                async with conn.transaction():
                    # Update leave balance: pendingDays -= totalDays, usedDays += totalDays
                    if req["leaveBalanceId"]:
                        await conn.execute(
                            """
                            UPDATE leave_balances
                            SET "pendingDays" = "pendingDays" - $1,
                                "usedDays" = "usedDays" + $1
                            WHERE id = $2
                            """,
                            req["totalDays"],
                            req["leaveBalanceId"],
                        )

                    # Update leave request status to APPROVED
                    await conn.execute(
                        """
                        UPDATE leave_requests
                        SET status = 'APPROVED',
                            "approvedBy" = $1,
                            "approvedAt" = NOW()
                        WHERE id = $2
                        """,
                        self.user_id,
                        request_id,
                    )

                return ToolResult(
                    tool_name="approve_leave_request",
                    status=ToolStatus.SUCCESS,
                    display_message=(
                        f"**Đã duyệt đơn nghỉ phép thành công**\n"
                        f"- Nhân viên: {req['employee_name']}\n"
                        f"- Mã đơn: {request_id}\n"
                        f"- Số ngày: {req['totalDays']}"
                    ),
                )

        except Exception as e:
            logger.error(f"Approve leave request error: {e}", exc_info=True)
            return ToolResult(
                tool_name="approve_leave_request",
                status=ToolStatus.ERROR,
                error="Duyệt đơn thất bại. Thử lại sau nhé.",
            )

    async def _reject_leave_request(self, params: Dict[str, Any], confirmed: bool = False) -> ToolResult:
        """Tu choi don nghi phep — thuc su cap nhat DB khi confirmed=True"""
        is_manager_or_admin = self.user_role in ("SUPER_ADMIN", "HR_MANAGER", "DIRECTOR", "HR_STAFF", "MANAGER")
        if not is_manager_or_admin:
            return ToolResult(
                tool_name="reject_leave_request",
                status=ToolStatus.ERROR,
                error="Quyền truy cập bị từ chối: Chỉ cấp quản lý trở lên mới có thể từ chối đơn.",
            )

        request_id = params.get("request_id")
        reason = params.get("reason", "")

        if not request_id:
            return ToolResult(
                tool_name="reject_leave_request",
                status=ToolStatus.REQUIRES_INFO,
                data={"missing_field": "request_id"},
            )

        if not confirmed:
            if not reason:
                return ToolResult(
                    tool_name="reject_leave_request",
                    status=ToolStatus.REQUIRES_INFO,
                    data={"missing_field": "reject_reason"},
                )
            from app.database import get_db_pool
            pool = get_db_pool()
            if pool:
                 try:
                     async with pool.acquire() as conn:
                         req_info = await conn.fetchrow(
                             """
                             SELECT u.name as employee_name, lt.name as leave_type, lr."startDate", lr."endDate"
                             FROM leave_requests lr
                             JOIN users u ON lr."userId" = u.id
                             JOIN leave_types lt ON lr."leaveTypeId" = lt.id
                             WHERE lr.id = $1
                             """,
                             request_id
                         )
                 except Exception:
                     req_info = None
            else:
                 req_info = None

            if req_info:
                display_msg = (
                    f"**Từ chối đơn nghỉ phép**\n"
                    f"- Nhân viên: **{req_info['employee_name']}**\n"
                    f"- Thời gian: {req_info['startDate']} đến {req_info['endDate']}\n"
                    f"- Lý do: {reason}\n\n"
                    f"Xác nhận từ chối đơn này?"
                )
            else:
                display_msg = (
                    f"**Từ chối đơn nghỉ phép**\n"
                    f"- Mã đơn: {request_id[:8]}...\n"
                    f"- Lý do: {reason}\n\n"
                    f"Xác nhận từ chối đơn này?"
                )

            return ToolResult(
                tool_name="reject_leave_request",
                status=ToolStatus.PENDING_CONFIRMATION,
                confirmation_required=True,
                confirmation_data={
                    "action": "reject_leave_request",
                    "request_id": request_id,
                    "rejector_id": self.user_id,
                    "reason": reason,
                },
                display_message=display_msg,
                data=params,
            )

        # confirmed=True → Actually reject in database
        from app.database import get_db_pool
        pool = get_db_pool()
        if not pool:
            return ToolResult(
                tool_name="reject_leave_request",
                status=ToolStatus.ERROR,
                error="Chưa lấy được dữ liệu lúc này. Thử lại sau nhé.",
            )

        try:
            async with pool.acquire() as conn:
                req = await conn.fetchrow(
                    """
                    SELECT lr.id, lr.status, lr."userId", lr."totalDays",
                           lr."leaveBalanceId", lr."leaveTypeId",
                           u.name as employee_name
                    FROM leave_requests lr
                    JOIN users u ON lr."userId" = u.id
                    WHERE lr.id = $1
                    """,
                    request_id,
                )

                if not req:
                    return ToolResult(
                        tool_name="reject_leave_request",
                        status=ToolStatus.ERROR,
                        error=f"Không tìm thấy đơn nghỉ phép ID: {request_id}",
                    )

                if req["status"] != "PENDING":
                    return ToolResult(
                        tool_name="reject_leave_request",
                        status=ToolStatus.ERROR,
                        error=f"Đơn không ở trạng thái chờ duyệt (hiện tại: {req['status']})",
                    )

                async with conn.transaction():
                    # Return pending days to balance
                    if req["leaveBalanceId"]:
                        await conn.execute(
                            """
                            UPDATE leave_balances
                            SET "pendingDays" = "pendingDays" - $1
                            WHERE id = $2
                            """,
                            req["totalDays"],
                            req["leaveBalanceId"],
                        )

                    # Update request status to REJECTED
                    await conn.execute(
                        """
                        UPDATE leave_requests
                        SET status = 'REJECTED',
                            "approvedBy" = $1,
                            "approvedAt" = NOW(),
                            "rejectionReason" = $2
                        WHERE id = $3
                        """,
                        self.user_id,
                        reason or "Không thể sắp xếp nhân sự thay thế trong thời điểm này",
                        request_id,
                    )

                return ToolResult(
                    tool_name="reject_leave_request",
                    status=ToolStatus.SUCCESS,
                    display_message=(
                        f"**Đã từ chối đơn nghỉ phép**\n"
                        f"- Nhân viên: {req['employee_name']}\n"
                        f"- Mã đơn: {request_id}\n"
                        f"- Lý do: {reason or 'Không có'}"
                    ),
                )

        except Exception as e:
            logger.error(f"Reject leave request error: {e}", exc_info=True)
            return ToolResult(
                tool_name="reject_leave_request",
                status=ToolStatus.ERROR,
                error="Từ chối đơn thất bại. Thử lại sau nhé.",
            )

    async def _send_notification(self, params: Dict[str, Any], confirmed: bool = False) -> ToolResult:
        """Gui thong bao — tu dong gui khi confirmed=True"""
        is_manager_or_admin = self.user_role in ("SUPER_ADMIN", "HR_MANAGER", "DIRECTOR", "HR_STAFF", "MANAGER")
        if not is_manager_or_admin:
            return ToolResult(
                tool_name="send_notification",
                status=ToolStatus.ERROR,
                error="Quyền truy cập bị từ chối: Chỉ cấp quản lý trở lên mới được phép gửi thông báo.",
            )

        title = params.get("title")
        message = params.get("message")
        recipients = params.get("recipient_ids", [])

        if not title or not message:
            return ToolResult(
                tool_name="send_notification",
                status=ToolStatus.REQUIRES_INFO,
                data={"missing_field": "title_or_content"},
            )

        if not confirmed:
            return ToolResult(
                tool_name="send_notification",
                status=ToolStatus.PENDING_CONFIRMATION,
                confirmation_required=True,
                confirmation_data={
                    "action": "send_notification",
                    "sender_id": self.user_id,
                    "recipient_ids": recipients,
                    "title": title,
                    "message": message,
                },
                display_message=(
                    f"**Gửi thông báo**\n"
                    f"- Tiêu đề: {title}\n"
                    f"- Người nhận: {len(recipients)} người\n"
                    f"- Nội dung: {message[:100]}...\n\n"
                    f"Xác nhận gửi thông báo?"
                ),
                data=params,
            )

        # confirmed=True → actually send the notification
        try:
            from app.services.notification_service import NotificationService
            svc = NotificationService()
            result = await svc.send_bulk(
                sender_id=self.user_id,
                recipient_ids=recipients,
                title=title,
                message=message,
            )
            if result.get("success"):
                return ToolResult(
                    tool_name="send_notification",
                    status=ToolStatus.SUCCESS,
                    data=result,
                    display_message=(
                        f"**Đã gửi thông báo thành công!**\n"
                        f"- Tiêu đề: {title}\n"
                        f"- Người nhận: {len(recipients)} người"
                    ),
                )
            else:
                return ToolResult(
                    tool_name="send_notification",
                    status=ToolStatus.ERROR,
                    error="Không gửi được thông báo lúc này. Thử lại sau nhé.",
                )
        except ImportError:
            # Fallback: just mark as success if no notification service
            return ToolResult(
                tool_name="send_notification",
                status=ToolStatus.SUCCESS,
                display_message=(
                    f"**Đã gửi thông báo thành công (mock)!**\n"
                    f"- Tiêu đề: {title}\n"
                    f"- Người nhận: {len(recipients)} người"
                ),
                data={"recipients": recipients, "title": title},
            )

    # ========== ADVANCED TOOLS (Phase 2-5) ==========

    async def _analyze_approval_request(self, params: Dict[str, Any]) -> ToolResult:
        """Phase 2: Phan tich don va dua ra khuyen nghi — tra ve text, khong tra JSON"""
        is_manager_or_admin = self.user_role in ("SUPER_ADMIN", "HR_MANAGER", "DIRECTOR", "HR_STAFF", "MANAGER")
        if not is_manager_or_admin:
            return ToolResult(
                tool_name="analyze_approval_request",
                status=ToolStatus.ERROR,
                error="Quyền truy cập bị từ chối: Chỉ cấp quản lý trở lên mới được sử dụng tính năng phân tích duyệt đơn.",
            )

        request_id = params.get("request_id")
        if not request_id:
            return ToolResult(
                tool_name="analyze_approval_request",
                status=ToolStatus.REQUIRES_INFO,
                data={"missing_field": "request_id"},
            )

        # Delegated to approval_agent
        try:
            from app.services.approval_agent import ApprovalAgent
            agent = ApprovalAgent()
            result = await agent.analyze_request(request_id, self.user_id)

            # Use display_text — human-readable, not JSON
            display_text = result.get("display_text", result.get("recommendation_text", ""))
            verdict = result.get("verdict", "")

            # If the verdict recommends approval → show Approve/Reject buttons
            if verdict in ("auto_approve", "recommend_approve"):
                return ToolResult(
                    tool_name="analyze_approval_request",
                    status=ToolStatus.PENDING_CONFIRMATION,
                    confirmation_required=True,
                    confirmation_data={
                        "action": "approve_leave_request",
                        "request_id": request_id,
                        "approver_id": self.user_id,
                        "verdict": verdict,
                    },
                    display_message=display_text,
                )
            elif verdict == "recommend_reject":
                return ToolResult(
                    tool_name="analyze_approval_request",
                    status=ToolStatus.PENDING_CONFIRMATION,
                    confirmation_required=True,
                    confirmation_data={
                        "action": "reject_leave_request",
                        "request_id": request_id,
                        "rejector_id": self.user_id,
                        "verdict": verdict,
                    },
                    display_message=display_text,
                )
            else:
                # Escalate or unknown: just show analysis, no buttons
                return ToolResult(
                    tool_name="analyze_approval_request",
                    status=ToolStatus.SUCCESS,
                display_message=display_text,
            )
        except ImportError:
            return ToolResult(
                tool_name="analyze_approval_request",
                status=ToolStatus.ERROR,
                error="Chưa có dữ liệu để phân tích.",
            )

    async def _get_risk_assessment(self, params: Dict[str, Any]) -> ToolResult:
        """Phase 3: Danh gia rui ro — tra ve text, khong tra JSON"""
        is_manager_or_admin = self.user_role in ("SUPER_ADMIN", "HR_MANAGER", "DIRECTOR", "HR_STAFF", "MANAGER")
        if not is_manager_or_admin:
            return ToolResult(
                tool_name="get_risk_assessment",
                status=ToolStatus.ERROR,
                error="Quyền truy cập bị từ chối: Chỉ cấp quản lý trở lên mới được xem đánh giá rủi ro nhân sự.",
            )

        scope = params.get("scope", "employee")
        target_id = params.get("target_id", self.user_id)

        try:
            from app.services.risk_predictor import RiskPredictor
            predictor = RiskPredictor()
            if scope == "employee":
                result = await predictor.assess_employee_risk(target_id)
            else:
                result = await predictor.assess_department_risk(target_id)

            if result.get("error"):
                return ToolResult(
                    tool_name="get_risk_assessment",
                    status=ToolStatus.ERROR,
                    error="Chưa có dữ liệu để đánh giá lúc này.",
                )

            # Format human-readable display
            display = self._format_risk_display(result, scope)
            return ToolResult(
                tool_name="get_risk_assessment",
                status=ToolStatus.SUCCESS,
                display_message=display,
            )
        except ImportError:
            return ToolResult(
                tool_name="get_risk_assessment",
                status=ToolStatus.ERROR,
                error="Chưa có dữ liệu để đánh giá lúc này.",
            )

    def _format_risk_display(self, result: Dict[str, Any], scope: str) -> str:
        """Format risk result thanh markdown de hien thi"""
        lines = []

        if scope == "employee":
            lines.append(f"###Đánh giá rủi ro — {result.get('employee_name', 'N/A')}")
            lines.append(f"**Phòng ban:** {result.get('department', 'N/A')}\n")

            # Turnover risk
            tr = result.get("turnover_risk", {})
            lines.append(f"**Rủi ro nghỉ việc:** {tr.get('level', 'N/A').upper()} ({tr.get('score', 0)}%)")
            for f in tr.get("factors", []):
                lines.append(f"  • {f}")

            # Burnout risk
            br = result.get("burnout_risk", {})
            lines.append(f"\n**Rủi ro kiệt sức:** {br.get('level', 'N/A').upper()} ({br.get('score', 0)}%)")
            for f in br.get("factors", []):
                lines.append(f"  • {f}")

            # Suggested actions
            actions = result.get("suggested_actions", [])
            if actions:
                lines.append("\n**Gợi ý hành động:**")
                for a in actions:
                    lines.append(f"  {a}")

            # AI insight
            ai = result.get("ai_insight")
            if ai:
                lines.append(f"\n---\n**Phân tích AI:**\n{ai}")

        else:  # department
            lines.append(f"###Đánh giá rủi ro phòng ban — {result.get('department_name', 'N/A')}")
            lines.append(f"**Tổng nhân viên:** {result.get('total_employees', 0)}\n")
            lines.append(f"- Rủi ro cao: {result.get('high_risk_count', 0)} người")
            lines.append(f"- Rủi ro trung bình: {result.get('medium_risk_count', 0)} người")
            lines.append(f"- Ổn định: {result.get('low_risk_count', 0)} người\n")

            employees = result.get("employees", [])
            if employees:
                lines.append("**Chi tiết nhân viên (theo mức rủi ro):**")
                for emp in employees[:10]:
                    level = emp.get("overall_level", "low")
                    level_vi = {"high": "Cao", "medium": "Trung bình", "low": "Thấp"}.get(level, "-")
                    lines.append(f"  [{level_vi}] {emp.get('name')} — Nghỉ việc: {emp.get('turnover_score')}%, Burnout: {emp.get('burnout_score')}%")

        return "\n".join(lines)

    async def _generate_document(self, params: Dict[str, Any]) -> ToolResult:
        """Phase 4: Tao tai lieu HR"""
        is_manager_or_admin = self.user_role in ("SUPER_ADMIN", "HR_MANAGER", "DIRECTOR", "HR_STAFF", "MANAGER")
        if not is_manager_or_admin:
            return ToolResult(
                tool_name="generate_document",
                status=ToolStatus.ERROR,
                error="Quyền truy cập bị từ chối: Chỉ cấp quản lý hoặc HR mới được tạo tài liệu nhân sự.",
            )

        doc_type = params.get("doc_type")
        context = params.get("context", "")

        if not doc_type:
            return ToolResult(
                tool_name="generate_document",
                status=ToolStatus.REQUIRES_INFO,
                data={"missing_field": "document_type"},
            )

        try:
            from app.services.document_intelligence import DocumentIntelligence
            doc_service = DocumentIntelligence()
            result = await doc_service.generate(doc_type, context, self.user_id)
            return ToolResult(
                tool_name="generate_document",
                status=ToolStatus.SUCCESS,
                data=result,
            )
        except ImportError:
            return ToolResult(
                tool_name="generate_document",
                status=ToolStatus.ERROR,
                error="Chưa tạo được tài liệu lúc này.",
            )

    async def _get_copilot_insight(self, params: Dict[str, Any]) -> ToolResult:
        """Phase 5: Manager copilot insight — tra ve text, khong tra JSON"""
        is_manager_or_admin = self.user_role in ("SUPER_ADMIN", "HR_MANAGER", "DIRECTOR", "HR_STAFF", "MANAGER")
        if not is_manager_or_admin:
            return ToolResult(
                tool_name="get_copilot_insight",
                status=ToolStatus.ERROR,
                error="Quyền truy cập bị từ chối: Chỉ Manager mới có thể sử dụng Copilot Insight.",
            )

        insight_type = params.get("insight_type")
        if not insight_type:
            return ToolResult(
                tool_name="get_copilot_insight",
                status=ToolStatus.REQUIRES_INFO,
                data={"missing_field": "insight_type"},
            )

        try:
            from app.services.copilot_service import CopilotService
            copilot = CopilotService()
            result = await copilot.get_insight(
                insight_type,
                manager_id=self.user_id,
                target_employee_id=params.get("target_employee_id"),
            )

            if not result.get("success"):
                return ToolResult(
                    tool_name="get_copilot_insight",
                    status=ToolStatus.ERROR,
                    error=result.get("error", "Không thể lấy insight."),
                )

            # Format human-readable display
            display = self._format_copilot_display(result, insight_type)
            return ToolResult(
                tool_name="get_copilot_insight",
                status=ToolStatus.SUCCESS,
                display_message=display,
            )
        except ImportError:
            return ToolResult(
                tool_name="get_copilot_insight",
                status=ToolStatus.ERROR,
                error="Chưa có dữ liệu để lấy insight lúc này.",
            )

    def _format_copilot_display(self, result: Dict[str, Any], insight_type: str) -> str:
        """Format copilot insight thanh markdown de hien thi"""
        insight_labels = {
            "team_health": "Sức khỏe Team",
            "1on1_prep": "Chuẩn bị 1-on-1",
            "performance_nudge": "Gợi ý Performance",
            "meeting_agenda": "Agenda Cuộc họp",
        }
        label = insight_labels.get(insight_type, insight_type)
        lines = [f"### {label}\n"]

        data = result.get("data", result)

        # team_health: usually has ai_summary + metrics
        if insight_type == "team_health":
            metrics = data.get("metrics", {})
            if metrics:
                lines.append("**Số liệu chính:**")
                for k, v in metrics.items():
                    lines.append(f"  • {k}: {v}")
                lines.append("")
            summary = data.get("ai_summary") or data.get("summary", "")
            if summary:
                lines.append(summary)

        # 1on1_prep: usually has talking_points
        elif insight_type == "1on1_prep":
            emp = data.get("employee_name", "")
            if emp:
                lines.append(f"**Nhân viên:** {emp}\n")
            points = data.get("talking_points", [])
            if points:
                lines.append("**Talking Points:**")
                for i, p in enumerate(points, 1):
                    lines.append(f"  {i}. {p}")
            summary = data.get("ai_summary", "")
            if summary:
                lines.append(f"\n{summary}")

        # performance_nudge
        elif insight_type == "performance_nudge":
            items = data.get("nudges", data.get("items", []))
            if items:
                for item in items:
                    if isinstance(item, dict):
                        lines.append(f"- **{item.get('title', '')}**: {item.get('message', '')}")
                    else:
                        lines.append(f"- {item}")
            summary = data.get("ai_summary", "")
            if summary:
                lines.append(f"\n{summary}")

        # meeting_agenda
        elif insight_type == "meeting_agenda":
            agenda = data.get("agenda", [])
            if agenda:
                for item in agenda:
                    if isinstance(item, dict):
                        lines.append(f"- **{item.get('topic', '')}** ({item.get('duration', '')})")
                    else:
                        lines.append(f"- {item}")
            summary = data.get("ai_summary", "")
            if summary:
                lines.append(f"\n{summary}")

        else:
            # Fallback: show any text-like field
            for key in ("ai_summary", "summary", "content", "text"):
                if data.get(key):
                    lines.append(str(data[key]))
                    break

        return "\n".join(lines)


def parse_tool_calls_from_response(response_text: str) -> List[Dict[str, Any]]:
    """
    Parse cac khoi ```action ... ``` tu response cua AI.
    Tra ve danh sach cac tool calls da parse duoc.
    """
    tool_calls = []

    # Tim tat ca cac khoi ```action ... ```
    pattern = r"```action\s*\n(.*?)\n```"
    matches = re.findall(pattern, response_text, re.DOTALL)

    for match in matches:
        try:
            call_data = json.loads(match.strip())
            if "tool" in call_data:
                tool_calls.append({
                    "tool": call_data["tool"],
                    "params": call_data.get("params", {}),
                    "description": call_data.get("description", ""),
                })
        except json.JSONDecodeError:
            logger.warning(f"Failed to parse tool call JSON: {match[:100]}")
            continue

    return tool_calls


def strip_action_blocks(response_text: str) -> str:
    """Loai bo cac khoi ```action ... ``` khoi response text de hien thi sach"""
    return re.sub(r"```action\s*\n.*?\n```", "", response_text, flags=re.DOTALL).strip()
