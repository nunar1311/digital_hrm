import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sơ đồ tổ chức | Digital HRM",
};

export default function OrgChartPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">
                Sơ đồ tổ chức
            </h1>
            {/* TODO: Interactive org chart with zoom, drag & drop */}
        </div>
    );
}
