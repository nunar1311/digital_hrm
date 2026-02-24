import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Quản lý ca làm việc | Digital HRM",
};

export default function ShiftsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">
                Quản lý ca làm việc
            </h1>
            {/* TODO: Shift management - morning, afternoon, night, rotating */}
        </div>
    );
}
