import type { Metadata } from "next";
import { requireAuth, extractRole } from "@/lib/auth-session";
import { hasPermission } from "@/lib/rbac/check-access";
import { Permission } from "@/lib/rbac/permissions";
import { getOffboardings, getOffboardingStats } from "./actions";
import { OffboardingClient } from "./offboarding-client";

export const metadata: Metadata = {
    title: "Offboarding - Quản lý nghỉ việc",
    description: "Quản lý quy trình nghỉ việc của nhân viên",
};

export default async function OffboardingPage() {
    const session = await requireAuth();
    const role = extractRole(session);
    
    const canManage = hasPermission(
        role,
        Permission.OFFBOARDING_MANAGE,
    );

    const [offboardings, stats] = await Promise.all([
        getOffboardings(),
        getOffboardingStats(),
    ]);

    return (
        <OffboardingClient
            initialOffboardings={JSON.parse(JSON.stringify(offboardings))}
            initialStats={JSON.parse(JSON.stringify(stats))}
            canManage={canManage}
        />
    );
}
