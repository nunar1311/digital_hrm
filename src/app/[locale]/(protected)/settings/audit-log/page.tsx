import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requirePermission } from "@/lib/auth-session";
import { Permission } from "@/lib/rbac/permissions";
import {
    getAuditLogs,
    getAuditLogFilters,
} from "../preferences/actions";
import { AuditLogClient } from "./audit-log-client";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "ProtectedPages" });

    return {
        title: `${t("settingsAuditLogMetadataTitle")} | Digital HRM`,
    };
}

export default async function AuditLogPage() {
    await requirePermission(Permission.SETTINGS_AUDIT_LOG);

    const [logsData, filters] = await Promise.all([
        getAuditLogs({ page: 1, pageSize: 20 }),
        getAuditLogFilters(),
    ]);

    return (
        <AuditLogClient
            initialData={JSON.parse(JSON.stringify(logsData))}
            filters={JSON.parse(JSON.stringify(filters))}
        />
    );
}
