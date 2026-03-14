import type { Metadata } from "next";
import { getDepartmentTree } from "./actions";
import { OrgChartView } from "@/components/org-chart/org-chart-view";

export const metadata: Metadata = {
    title: "Sơ đồ tổ chức",
};

export default async function OrgChartPage() {
    const data = await getDepartmentTree();

    return (
        <div className="flex flex-col h-[calc(100vh-3rem)]">
            <OrgChartView data={data} />
        </div>
    );
}
