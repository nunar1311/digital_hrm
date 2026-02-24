import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Quản lý nghỉ phép | Digital HRM",
};

export default function LeavesPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">
                Quản lý nghỉ phép
            </h1>
            {/* TODO: Leave requests list with approval workflow */}
        </div>
    );
}
