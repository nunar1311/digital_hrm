import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAuth, requirePermission, extractRole } from "@/lib/auth-session";
import { Permission } from "@/lib/rbac/permissions";
import { getOffboardingById } from "../actions";
import { OffboardingDetailClient } from "../offboarding-detail-client";
import { hasAnyPermission } from "@/lib/rbac/check-access";

export const metadata: Metadata = {
    title: "Chi tiết Offboarding | Digital HRM",
    description: "Chi tiết quy trình nghỉ việc",
};

export default async function OffboardingDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await requireAuth();
    const role = extractRole(session);
    const { id } = await params;

    const offboarding = await getOffboardingById(id);

    if (!offboarding) {
        notFound();
    }

    const canManage = hasAnyPermission(role, [Permission.OFFBOARDING_MANAGE]);

    return (
        <OffboardingDetailClient
            initialDetail={offboarding}
            canManage={canManage}
        />
    );
}
