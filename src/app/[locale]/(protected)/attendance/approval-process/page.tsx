import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
    getAttendanceApprovalProcess,
} from "../actions";
import { requireAuth, extractRole } from "@/lib/auth-session";
import { hasAnyPermission } from "@/lib/rbac/check-access";
import { Permission } from "@/lib/rbac/permissions";
import { ApprovalProcessClient } from "./approval-process-client";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "ProtectedPages" });

    return {
        title: `${t("attendanceApprovalProcessMetadataTitle")} | Digital HRM`,
    };
}

export default async function ApprovalProcessPage() {
    const session = await requireAuth();
    const role = extractRole(session);

    const canConfig = hasAnyPermission(role, [
        Permission.ATTENDANCE_APPROVAL_CONFIG,
    ]);

    const process = canConfig
        ? await getAttendanceApprovalProcess()
        : null;

    const initialProcess = JSON.parse(JSON.stringify(process));

    return (
        <ApprovalProcessClient
            initialProcess={initialProcess}
            canConfig={canConfig}
        />
    );
}
