import { Metadata } from "next";
import HolidaysClient from "./holidays-client";
import { getHolidayCalendars } from "./actions";
import { requirePermission } from "@/lib/auth-session";
import { Permission } from "@/lib/rbac/permissions";

export const metadata: Metadata = {
  title: "Lịch nghỉ lễ",
  description: "Quản lý lịch nghỉ lễ và ngày nghỉ của công ty",
};

export default async function HolidaysPage() {
  await requirePermission(Permission.HOLIDAY_VIEW);

  const calendars = await getHolidayCalendars();

  return (
    <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
      <div className="w-full min-h-0 h-full min-w-0 flex flex-col relative">
        <div className="shrink-0 flex items-center justify-between h-10 p-2 border-b">
          <h1 className="font-bold">Lịch nghỉ lễ</h1>
        </div>
        <HolidaysClient initialData={calendars} />
      </div>
    </div>
  );
}
