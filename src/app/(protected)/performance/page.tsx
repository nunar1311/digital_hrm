import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Đánh giá hiệu suất | Digital HRM",
};

export default function PerformancePage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">
                Đánh giá hiệu suất
            </h1>
            {/* TODO: KPI/OKR setup, 360 review, performance cycles */}
        </div>
    );
}
