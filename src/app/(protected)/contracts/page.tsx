import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Danh sách hợp đồng | Digital HRM",
};

export default function ContractsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">
                Quản lý hợp đồng
            </h1>
            {/* TODO: Contract list with expiry warnings */}
        </div>
    );
}
