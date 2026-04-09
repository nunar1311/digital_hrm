import type { Metadata } from "next";
import { getServerSession, extractRole } from "@/lib/auth-session";
import { hasAnyPermission } from "@/lib/rbac/check-access";
import { Permission } from "@/lib/rbac/permissions";
import { getDepartmentTree } from "./actions";
import { OrgChartView } from "@/components/org-chart/org-chart-view";

export const metadata: Metadata = {
    title: "Sơ đồ tổ chức",
};

export default async function OrgChartPage() {
    const data = await getDepartmentTree();

    // Check edit permission server-side
    let canEdit = false;
    try {
        const session = await getServerSession();
        if (session) {
            const role = extractRole(session);
            canEdit = hasAnyPermission(role, [Permission.ORG_CHART_EDIT]);
        }
    } catch {
        canEdit = false;
    }

    return (
        <div className="flex flex-col h-[calc(100vh-3rem)]">
            <OrgChartView data={data} canEdit={canEdit} />
        </div>
    );
}
