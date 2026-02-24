import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Quản lý tài sản | Digital HRM",
};

export default function AssetsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">
                Quản lý tài sản
            </h1>
            {/* TODO: Asset assignment, retrieval, inventory */}
        </div>
    );
}
