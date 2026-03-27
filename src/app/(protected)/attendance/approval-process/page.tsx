import type { Metadata } from "next";
import {
    getAttendanceApprovalProcess,
} from "../actions";
import { requireAuth, extractRole } from "@/lib/auth-session";
import { hasAnyPermission } from "@/lib/rbac/check-access";
import { Permission } from "@/lib/rbac/permissions";
import { ApprovalProcessClient } from "./approval-process-client";

export const metadata: Metadata = {
    title: "Quy trình duyệt chấm công",
};

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
            currentUserId={session.user.id}
        />
    );
}
