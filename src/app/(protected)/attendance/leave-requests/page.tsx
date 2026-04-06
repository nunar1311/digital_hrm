import { Metadata } from "next";
import { LeaveRequestsClient } from "./leave-requests-client";
import {
    getLeaveRequestsForApproval,
    getLeaveRequestStats,
    getLeaveTypesForFilter,
} from "./actions";
import { requirePermission } from "@/lib/auth-session";
import { Permission } from "@/lib/rbac/permissions";

export const metadata: Metadata = {
    title: "Duyệt đơn nghỉ phép | Digital HRM",
    description: "Xem và duyệt các đơn xin nghỉ phép của nhân viên",
};

export default async function LeaveRequestsPage() {
    await requirePermission(Permission.LEAVE_VIEW_ALL);

    const [requestsData, statsData, leaveTypes] = await Promise.all([
        getLeaveRequestsForApproval({ status: "ALL", page: 1, pageSize: 100 }),
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
