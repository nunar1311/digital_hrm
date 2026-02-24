import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Công thức lương | Digital HRM",
};

export default function PayrollFormulasPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">
                Công thức tính lương
            </h1>
            {/* TODO: Dynamic formula builder like Excel */}
        </div>
    );
}
