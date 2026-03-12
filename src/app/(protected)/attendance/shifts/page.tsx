import type { Metadata } from "next";
import {
    getShifts,
    getUsers,
    getDepartments,
    getWorkCycles,
} from "../actions";
import { requireAuth, extractRole } from "@/lib/auth-session";
import { hasPermission } from "@/lib/rbac/check-access";
import { Permission } from "@/lib/rbac/permissions";
import { ShiftsClient } from "./shifts-client";

export const metadata: Metadata = {
    title: "Quản lý ca làm việc",
};

export default async function ShiftsPage() {
    const session = await requireAuth();
    const role = extractRole(session);
    const canManage = hasPermission(
        role,
        Permission.ATTENDANCE_SHIFT_MANAGE,
    );

    const [shifts, users, departments, workCycles] =
        await Promise.all([
            getShifts(),
            canManage ? getUsers() : Promise.resolve([]),
            getDepartments(),
            getWorkCycles(),
        ]);

    return (
        <ShiftsClient
            initialShifts={JSON.parse(JSON.stringify(shifts))}
            initialWorkCycles={JSON.parse(JSON.stringify(workCycles))}
            users={JSON.parse(JSON.stringify(users))}
            departments={JSON.parse(JSON.stringify(departments))}
            canManage={canManage}
        />
    );
}
