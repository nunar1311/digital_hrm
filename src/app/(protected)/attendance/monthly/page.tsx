import type { Metadata } from "next";
import {
    getMonthlyAttendance,
    getAttendanceSummaries,
    getDepartments,
} from "../actions";
import { requireAuth, extractRole } from "@/lib/auth-session";
import { hasPermission } from "@/lib/rbac/check-access";
import { Permission } from "@/lib/rbac/permissions";
import { MonthlyClient } from "./monthly-client";

export const metadata: Metadata = {
    title: "Bảng công tổng hợp",
};

export default async function MonthlyAttendancePage() {
    const session = await requireAuth();
    const role = extractRole(session);
    const canManage = hasPermission(
        role,
        Permission.ATTENDANCE_VIEW_ALL,
    );

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const [monthlyData, summaries, departments] = await Promise.all([
        getMonthlyAttendance({ month, year }),
        getAttendanceSummaries({ month, year }),
        canManage ? getDepartments() : Promise.resolve([]),
    ]);

    return (
        <MonthlyClient
            initialData={JSON.parse(JSON.stringify(monthlyData))}
            initialSummaries={JSON.parse(JSON.stringify(summaries))}
            initialDepartments={JSON.parse(
                JSON.stringify(departments),
            )}
            canManage={canManage}
        />
    );
}
