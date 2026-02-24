import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Tổng quan | Digital HRM",
};

export default function DashboardPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">
                Tổng quan
            </h1>
            <p className="text-muted-foreground">
                Chào mừng bạn đến với hệ thống quản lý nhân sự Digital
                HRM
            </p>
            {/* TODO: Dashboard widgets - headcount, turnover, payroll summary */}
        </div>
    );
}
