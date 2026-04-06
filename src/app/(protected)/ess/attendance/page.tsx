import { Metadata } from "next";
import { ESSAttendanceClient } from "./attendance-client";
import { getMyAttendanceHistory } from "../actions";

export const metadata: Metadata = {
  title: "Chấm công | Cổng nhân viên - Digital HRM",
  description: "Xem lịch sử chấm công của bạn",
};

export default async function ESSAttendancePage() {
  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  const attendanceData = await getMyAttendanceHistory(month, year);

  return (
    <ESSAttendanceClient
      initialData={JSON.parse(JSON.stringify(attendanceData))}
      currentMonth={month}
      currentYear={year}
    />
  );
}
