import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-session";
import { getMyAttendanceHistory } from "../actions";
import { AttendanceClient } from "./attendance-client";

export const metadata: Metadata = {
    title: "Lịch sử chấm công | Digital HRM",
};

export default async function ESSAttendancePage({
    searchParams,
}: {
    searchParams: Promise<{ month?: string; year?: string }>;
}) {
    await requireAuth();
    
    const params = await searchParams;
    const today = new Date();
    const month = params?.month ? parseInt(params.month) : today.getMonth() + 1;
    const year = params?.year ? parseInt(params.year) : today.getFullYear();
    
    const { attendances, summary } = await getMyAttendanceHistory(month, year);
    
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">
                Lịch sử chấm công
            </h1>
            <AttendanceClient 
                initialAttendances={attendances} 
                initialSummary={summary} 
                currentMonth={month}
                currentYear={year}
            />
        </div>
    );
}
