import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth-session";
import { Permission } from "@/lib/rbac/permissions";
import {
    getAuditLogs,
    getAuditLogFilters,
} from "../preferences/actions";
import { AuditLogClient } from "./audit-log-client";

export const metadata: Metadata = {
    title: "Nhật ký hệ thống | Digital HRM",
};

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
