import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Phiếu lương | Digital HRM",
};

export default function PayslipsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">
                Phiếu lương
            </h1>
            {/* TODO: Payslip generation and distribution */}
        </div>
    );
}
