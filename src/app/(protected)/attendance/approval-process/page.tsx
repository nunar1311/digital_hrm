import type { Metadata } from "next";
import {
    getAttendanceApprovalProcess,
    getAttendanceAdjustments,
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
    const canApprove = hasAnyPermission(role, [
        Permission.ATTENDANCE_APPROVAL_APPROVE,
    ]);

    const [process, adjustments] = await Promise.all([
        canConfig
            ? getAttendanceApprovalProcess()
            : Promise.resolve(null),
        getAttendanceAdjustments(),
    ]);

    const initialProcess = JSON.parse(JSON.stringify(process));
    const initialAdjustments = JSON.parse(
        JSON.stringify(adjustments),
    );

    return (
        <ApprovalProcessClient
            initialProcess={initialProcess}
            initialAdjustments={initialAdjustments}
            canConfig={canConfig}
            canApprove={canApprove}
            currentUserId={session.user.id}
        />
    );
}
