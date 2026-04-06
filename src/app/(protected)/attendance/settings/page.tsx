import type { Metadata } from "next";
import {
  getAttendanceConfig,
  getHolidays,
  getTimekeeperDevices,
  getShifts,
  getWorkCycles,
  getLeaveTypes,
} from "../actions";
import { requireAuth, extractRole } from "@/lib/auth-session";
import { hasPermission } from "@/lib/rbac/check-access";
import { Permission } from "@/lib/rbac/permissions";
import { redirect } from "next/navigation";
import { SettingsClient } from "./settings-client";

export const metadata: Metadata = {
  title: "Thiết lập chấm công",
};

export default async function AttendanceSettingsPage() {
  const session = await requireAuth();
  const role = extractRole(session);

  if (!hasPermission(role, Permission.ATTENDANCE_SHIFT_MANAGE)) {
    redirect("/403");
  }

  const [config, holidays, devices, workCycles, shifts, leaveTypes] = await Promise.all([
    getAttendanceConfig(),
    getHolidays(),
    getTimekeeperDevices(),
    getWorkCycles(),
    getShifts(),
    getLeaveTypes(),
  ]);

  return (
    <SettingsClient
      initialConfig={config ? JSON.parse(JSON.stringify(config)) : null}
      initialDevices={JSON.parse(JSON.stringify(devices))}
      initialWorkCycles={JSON.parse(JSON.stringify(workCycles))}
      initialShifts={JSON.parse(JSON.stringify(shifts))}
      initialLeaveTypes={JSON.parse(JSON.stringify(leaveTypes))}
    />
  );
}
