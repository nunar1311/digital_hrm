import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Thêm nhân viên mới | Digital HRM",
};

export default function NewEmployeePage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">
                Thêm nhân viên mới
            </h1>
            {/* TODO: Employee creation form - 360 profile */}
        </div>
    );
}
