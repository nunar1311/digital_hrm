import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Báo cáo & Phân tích | Digital HRM",
};

export default function ReportsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">
                Báo cáo & Phân tích
            </h1>
            {/* TODO: HR analytics, turnover, headcount, payroll charts */}
        </div>
    );
}
