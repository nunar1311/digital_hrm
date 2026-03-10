import type { Metadata } from "next";
import { getDepartmentTree } from "./actions";
import { OrgChartView } from "@/components/org-chart/org-chart-view";

export const metadata: Metadata = {
    title: "Sơ đồ tổ chức",
};

export default async function OrgChartPage() {
    const data = await getDepartmentTree();

    return (
        <div className="flex flex-col h-[calc(100vh-10rem)]">
            <div className="p-4 md:p-6">
                <h1 className="text-2xl font-bold tracking-tight">
                    Sơ đồ tổ chức
                </h1>
                <p className="text-sm text-muted-foreground">
                    Cấu trúc phòng ban và nhân sự toàn công ty — kéo
                    thả nhân viên để chuyển phòng ban
                </p>
            </div>
            <OrgChartView data={data} />
        </div>
    );
}
