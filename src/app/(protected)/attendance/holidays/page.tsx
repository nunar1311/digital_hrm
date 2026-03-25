import { Metadata } from "next";
import HolidaysClient from "./holidays-client";
import { hasPermission } from "@/lib/rbac/check-access";
import { Permission } from "@/lib/rbac/permissions";
import { extractRole, requireAuth } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import { getHolidays } from "../actions";

export const metadata: Metadata = {
  title: "Ngày nghỉ lễ",
  description: "Quản lý ngày nghỉ lễ",
};

const page = async () => {
  const session = await requireAuth();
  const role = extractRole(session);

  if (!hasPermission(role, Permission.ATTENDANCE_SHIFT_MANAGE)) {
    redirect("/");
  }

  const [holidays] = await Promise.all([getHolidays()]);

  return (
    <HolidaysClient initialHolidays={JSON.parse(JSON.stringify(holidays))} />
  );
};

export default page;
