import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Đào tạo | Digital HRM",
};

export default function TrainingPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">
                Quản lý đào tạo
            </h1>
            {/* TODO: Training courses, certificates, plans */}
        </div>
    );
}
