import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Chấm công hôm nay | Digital HRM",
};

export default function AttendancePage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">
                Chấm công hôm nay
            </h1>
            {/* TODO: Daily attendance view, GPS/WiFi check-in */}
        </div>
    );
}
