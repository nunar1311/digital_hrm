import type { Metadata } from "next";
import {
    getAttendanceRecords,
    getDepartments,
    getUsers,
} from "../actions";
import { requireAuth, extractRole } from "@/lib/auth-session";
import { hasPermission } from "@/lib/rbac/check-access";
import { Permission } from "@/lib/rbac/permissions";
import { redirect } from "next/navigation";
import { RecordsClient } from "./records-client";

export const metadata: Metadata = {
    title: "Nhật ký chấm công",
};

export default async function AttendanceRecordsPage() {
    const session = await requireAuth();
    const role = extractRole(session);

    const canViewAll = hasPermission(
        role,
        Permission.ATTENDANCE_VIEW_ALL,
    );
    const canViewTeam = hasPermission(
        role,
        Permission.ATTENDANCE_VIEW_TEAM,
    );

    if (!canViewAll && !canViewTeam) {
        redirect("/403");
    }

    const [initialData, departments, users] = await Promise.all([
        getAttendanceRecords({ page: 1, pageSize: 20 }),
        canViewAll ? getDepartments() : Promise.resolve([]),
        canViewAll
            ? getUsers()
            : getUsers(session.user.departmentId ?? undefined),
    ]);

    return (
        <RecordsClient
            initialData={JSON.parse(JSON.stringify(initialData))}
            departments={JSON.parse(JSON.stringify(departments))}
            users={JSON.parse(JSON.stringify(users))}
        />
    );
}
