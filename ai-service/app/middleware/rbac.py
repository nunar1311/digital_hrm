"""
RBAC Middleware - Role-Based Access Control cho AI Service
Đọc user context từ headers được forward bởi Next.js
"""

import logging
from typing import Optional
from enum import Enum

from fastapi import Request, HTTPException

logger = logging.getLogger(__name__)


class HRMRole(str, Enum):
    """Các role trong hệ thống HRM - khớp với permissions.ts"""
    SUPER_ADMIN = "SUPER_ADMIN"
    DIRECTOR = "DIRECTOR"
    HR_MANAGER = "HR_MANAGER"
    HR_STAFF = "HR_STAFF"
    DEPT_MANAGER = "DEPT_MANAGER"
    TEAM_LEADER = "TEAM_LEADER"
    EMPLOYEE = "EMPLOYEE"
    ACCOUNTANT = "ACCOUNTANT"
    IT_ADMIN = "IT_ADMIN"


# Các role được xem toàn bộ dữ liệu HR
FULL_ACCESS_ROLES = {
    HRMRole.SUPER_ADMIN,
    HRMRole.DIRECTOR,
    HRMRole.HR_MANAGER,
    HRMRole.HR_STAFF,
    HRMRole.ACCOUNTANT,
}

# Các role chỉ được xem dữ liệu cá nhân
PERSONAL_ONLY_ROLES = {
    HRMRole.EMPLOYEE,
    HRMRole.DEPT_MANAGER,
    HRMRole.TEAM_LEADER,
    HRMRole.IT_ADMIN,
}

# Các role được xem dashboard tổng quan (auto-insights, auto-summary)
DASHBOARD_ADMIN_ROLES = {
    HRMRole.SUPER_ADMIN,
    HRMRole.DIRECTOR,
    HRMRole.HR_MANAGER,
}


class UserContext:
    """Context của user đang gọi API"""

    def __init__(self, user_id: Optional[str], user_role: Optional[str]):
        self.user_id = user_id
        self.user_role = self._parse_role(user_role)

    def _parse_role(self, role_str: Optional[str]) -> HRMRole:
        """Parse role string thành HRMRole enum"""
        if not role_str:
            return HRMRole.EMPLOYEE
        try:
            return HRMRole(role_str.upper())
        except ValueError:
            logger.warning(f"Unknown role: {role_str}, defaulting to EMPLOYEE")
            return HRMRole.EMPLOYEE

    @property
    def has_full_access(self) -> bool:
        """Kiểm tra có quyền xem toàn bộ dữ liệu HR không"""
        return self.user_role in FULL_ACCESS_ROLES

    @property
    def can_view_dashboard(self) -> bool:
        """Kiểm tra có quyền xem dashboard tổng quan không"""
        return self.user_role in DASHBOARD_ADMIN_ROLES

    @property
    def is_identified(self) -> bool:
        """Kiểm tra có user_id hợp lệ không"""
        return bool(self.user_id)

    def __repr__(self):
        return f"UserContext(user_id={self.user_id}, role={self.user_role})"


def extract_user_context(request: Request) -> UserContext:
    """
    Đọc user context từ HTTP headers được forward bởi Next.js.

    Headers được forward:
    - X-User-Id: ID của user đang đăng nhập
    - X-User-Role: HRM role của user (SUPER_ADMIN, EMPLOYEE, v.v.)
    """
    user_id = request.headers.get("X-User-Id")
    user_role = request.headers.get("X-User-Role")

    ctx = UserContext(user_id=user_id, user_role=user_role)

    if not ctx.is_identified:
        logger.warning("Request missing X-User-Id header — treating as anonymous EMPLOYEE")
    else:
        logger.debug(f"User context: {ctx}")

    return ctx


def require_full_access(request: Request) -> UserContext:
    """
    FastAPI dependency: Yêu cầu quyền full access (admin roles).
    Raise 403 nếu không đủ quyền.
    """
    ctx = extract_user_context(request)
    if not ctx.has_full_access:
        raise HTTPException(
            status_code=403,
            detail={
                "success": False,
                "error": "Forbidden",
                "message": (
                    "Bạn không có quyền truy cập tính năng này. "
                    "Chức năng này chỉ dành cho quản trị viên."
                ),
            },
        )
    return ctx


def require_dashboard_access(request: Request) -> UserContext:
    """
    FastAPI dependency: Yêu cầu quyền xem dashboard tổng quan.
    Raise 403 nếu không đủ quyền.
    """
    ctx = extract_user_context(request)
    if not ctx.can_view_dashboard:
        raise HTTPException(
            status_code=403,
            detail={
                "success": False,
                "error": "Forbidden",
                "message": (
                    "Dashboard tổng quan chỉ dành cho Ban Giám đốc và bộ phận HR. "
                    "Bạn không có quyền truy cập."
                ),
            },
        )
    return ctx
