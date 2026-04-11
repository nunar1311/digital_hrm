import type { Metadata } from "next";
import { getTodayAttendance } from "./actions";
import { AttendanceDashboard } from "./dashboard-client";

export const metadata: Metadata = {
    title: "Chấm công hôm nay",
};

export default async function AttendancePage() {
    const data = await getTodayAttendance();

    return (
        <div className="w-full min-h-0 h-full grow flex flex-col">
            <div className="w-full min-h-0 h-full min-w-0 flex flex-col relative bg-background">
                <div className="flex flex-col gap-0 border-b">
                    <section>
                        <header className="p-2 sm:px-4 flex items-center h-10 border-b">
                            <h1 className="font-bold text-sm sm:text-base">Chấm công hôm nay</h1>
                        </header>
                    </section>
                </div>
                <section className="flex-1 relative h-full min-h-0 overflow-hidden bg-muted/10 p-3 sm:p-4 md:p-6 lg:p-8">
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
                </section>
            </div>
        </div>
    );
}
