import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LeaveRequestsClient } from "./leave-requests-client";
import {
    getLeaveRequestsForApproval,
    getLeaveRequestStats,
    getLeaveTypesForFilter,
} from "./actions";
import { requirePermission } from "@/lib/auth-session";
import { Permission } from "@/lib/rbac/permissions";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "ProtectedPages" });

    return {
        title: `${t("attendanceLeaveRequestsMetadataTitle")} | Digital HRM`,
        description: t("attendanceLeaveRequestsMetadataDescription"),
    };
}

export default async function LeaveRequestsPage() {
    await requirePermission(Permission.LEAVE_VIEW_ALL);

    const [requestsData, statsData, leaveTypes] = await Promise.all([
        getLeaveRequestsForApproval(),
        getLeaveRequestStats(),
        getLeaveTypesForFilter(),
    ]);

    return (
        <LeaveRequestsClient
            initialRequests={JSON.parse(JSON.stringify(requestsData))}
            initialStats={statsData}
            leaveTypes={leaveTypes}
        />
    );
}
