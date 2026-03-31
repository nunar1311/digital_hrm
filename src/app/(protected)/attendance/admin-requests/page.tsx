import { redirect } from "next/navigation";

import { hasPermission } from "@/lib/rbac/check-access";
import { Permission } from "@/lib/rbac/permissions";
import { AdminRequestsClient } from "./admin-requests-client";
import { extractRole, requireAuth } from "@/lib/auth-session";
import { getAdminRequests, getAdminRequestStats } from "./actions";

export default async function AdminRequestsPage() {
    const session = await requireAuth();

    const canView = hasPermission(
        extractRole(session),
        Permission.ADMIN_REQUEST_VIEW,
    );

    if (!canView) {
        redirect("/attendance");
    }

    const canManage = hasPermission(
        extractRole(session),
        Permission.ADMIN_REQUEST_APPROVE,
    );

    const [initialRequests, initialStats] = await Promise.all([
        getAdminRequests(),
        getAdminRequestStats(),
    ]);

    return (
        <AdminRequestsClient
            initialRequests={initialRequests}
            initialStats={initialStats}
            canManage={canManage}
        />
    );
}
