import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getOvertimeRequests } from "../actions";
import { requireAuth, extractRole } from "@/lib/auth-session";
import { hasAnyPermission } from "@/lib/rbac/check-access";
import { Permission } from "@/lib/rbac/permissions";
import { OvertimeClient } from "./overtime-client";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "ProtectedPages" });

    return {
        title: `${t("attendanceOvertimeMetadataTitle")} | Digital HRM`,
    };
}

const EMPTY_PAGE = { items: [], nextCursor: null };

export default async function OvertimePage() {
    const session = await requireAuth();
    const role = extractRole(session);
    const canManagerApprove = hasAnyPermission(role, [
        Permission.ATTENDANCE_OVERTIME_APPROVE,
    ]);
    const canHrReview = hasAnyPermission(role, [
        Permission.ATTENDANCE_OVERTIME_HR_REVIEW,
    ]);
    const canViewAll = canManagerApprove || canHrReview;

    const [my, pending, managerApproved, hrApproved, rejected, cancelled, all] =
        await Promise.all([
            getOvertimeRequests({ userId: session.user.id }),
            canManagerApprove
                ? getOvertimeRequests({ status: "PENDING" })
                : Promise.resolve(EMPTY_PAGE),
            canHrReview
                ? getOvertimeRequests({ status: "MANAGER_APPROVED" })
                : Promise.resolve(EMPTY_PAGE),
            getOvertimeRequests({ status: "HR_APPROVED", userId: session.user.id }),
            getOvertimeRequests({ status: "REJECTED", userId: session.user.id }),
            getOvertimeRequests({ status: "CANCELLED", userId: session.user.id }),
            canViewAll ? getOvertimeRequests() : Promise.resolve(EMPTY_PAGE),
        ]);

    const initialData = {
        my: JSON.parse(JSON.stringify(my)),
        pending: JSON.parse(JSON.stringify(pending)),
        managerApproved: JSON.parse(JSON.stringify(managerApproved)),
        hrApproved: JSON.parse(JSON.stringify(hrApproved)),
        rejected: JSON.parse(JSON.stringify(rejected)),
        cancelled: JSON.parse(JSON.stringify(cancelled)),
        all: JSON.parse(JSON.stringify(all)),
    };

    return (
        <OvertimeClient
            initialData={initialData}
            canManagerApprove={canManagerApprove}
            canHrReview={canHrReview}
            currentUserId={session.user.id}
        />
    );
}
