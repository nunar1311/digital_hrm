import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getTodayAttendance } from "./actions";
import { AttendanceDashboard } from "./dashboard-client";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "ProtectedPages" });

    return {
        title: `${t("attendanceTodayMetadataTitle")} | Digital HRM`,
    };
}

export default async function AttendancePage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "ProtectedPages" });
    const data = await getTodayAttendance();

    return (
        <div className="relative space-y-6 p-4 md:p-6">
            <h1 className="text-2xl font-bold tracking-tight">
                {t("attendanceTodayTitle")}
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
