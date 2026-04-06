import type { Metadata } from "next";
import { getTodayAttendance } from "./actions";
import { AttendanceDashboard } from "./dashboard-client";

export const metadata: Metadata = {
    title: "Chấm công hôm nay",
};

export default async function AttendancePage() {
    const data = await getTodayAttendance();

    return (
        <div className="relative space-y-6 p-4 md:p-6">
            <h1 className="text-2xl font-bold tracking-tight">
                Chấm công hôm nay
            </h1>
            <AttendanceDashboard
                initialData={{
                    attendance: data.attendance
                        ? JSON.parse(JSON.stringify(data.attendance))
                        : null,
                    assignedShift: data.assignedShift
                        ? JSON.parse(
                              JSON.stringify(data.assignedShift),
                          )
                        : null,
                    todayShifts: JSON.parse(
                        JSON.stringify(data.todayShifts),
                    ),
                    hasShiftToday: data.hasShiftToday,
                }}
            />
        </div>
    );
}
