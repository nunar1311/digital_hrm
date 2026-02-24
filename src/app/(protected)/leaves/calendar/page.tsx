import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Lịch nghỉ phép Team | Digital HRM",
};

export default function LeaveCalendarPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">
                Lịch Team
            </h1>
            {/* TODO: Team calendar - who is off today */}
        </div>
    );
}
