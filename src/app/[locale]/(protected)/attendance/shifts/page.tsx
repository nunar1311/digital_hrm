import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
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

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "ProtectedPages" });

    return {
        title: `${t("attendanceShiftsMetadataTitle")} | Digital HRM`,
    };
}

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
