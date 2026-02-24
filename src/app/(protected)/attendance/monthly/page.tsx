import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Bảng công tổng hợp | Digital HRM",
};

export default function MonthlyAttendancePage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">
                Bảng công tổng hợp
            </h1>
            {/* TODO: Monthly timesheet summary */}
        </div>
    );
}
