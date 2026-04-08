import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ESSAttendanceClient } from "./attendance-client";
import { getMyAttendanceHistory } from "../actions";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "ProtectedPages" });

    return {
        title: `${t("essAttendanceMetadataTitle")} | Digital HRM`,
        description: t("essAttendanceMetadataDescription"),
    };
}

export default async function ESSAttendancePage() {
    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    
    const attendanceData = await getMyAttendanceHistory(month, year);
    
    return (
        <ESSAttendanceClient
            initialData={attendanceData}
            currentMonth={month}
            currentYear={year}
        />
    );
}
