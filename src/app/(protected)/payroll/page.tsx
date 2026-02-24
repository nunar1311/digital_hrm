import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Bảng lương | Digital HRM",
};

export default function PayrollPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">
                Bảng lương tháng
            </h1>
            {/* TODO: Monthly payroll processing */}
        </div>
    );
}
