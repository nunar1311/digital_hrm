import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Mẫu hợp đồng | Digital HRM",
};

export default function ContractTemplatesPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">
                Mẫu hợp đồng
            </h1>
            {/* TODO: Contract templates management, mail merge */}
        </div>
    );
}
