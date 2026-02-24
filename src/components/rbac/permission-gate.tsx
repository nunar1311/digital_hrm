"use client";

import { type ReactNode } from "react";
import { Permission } from "@/lib/rbac/permissions";
import { useAuth } from "@/hooks/use-auth";

interface PermissionGateProps {
    /** Permission cần kiểm tra (OR logic nếu truyền mảng) */
    permissions: Permission | Permission[];
    /** Nội dung hiển thị nếu KHÔNG có quyền */
    fallback?: ReactNode;
    /** Nội dung chính */
    children: ReactNode;
}

/**
 * Component ẩn/hiện UI dựa trên quyền
 *
 * @example
 * <PermissionGate permissions={Permission.EMPLOYEE_CREATE}>
 *   <Button>Thêm nhân viên</Button>
 * </PermissionGate>
 */
export function PermissionGate({
    permissions,
    fallback = null,
    children,
}: PermissionGateProps) {
    const { can, canAny } = useAuth();

    const hasAccess = Array.isArray(permissions)
        ? canAny(permissions)
        : can(permissions);

    if (!hasAccess) return <>{fallback}</>;
    return <>{children}</>;
}
