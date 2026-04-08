import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  getAttendanceConfig,
  getTimekeeperDevices,
  getShifts,
  getWorkCycles,
} from "../actions";
import { requireAuth, extractRole } from "@/lib/auth-session";
import { hasPermission } from "@/lib/rbac/check-access";
import { Permission } from "@/lib/rbac/permissions";
import { redirect } from "next/navigation";
import { SettingsClient } from "./settings-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ProtectedPages" });

  return {
    title: `${t("attendanceSettingsMetadataTitle")} | Digital HRM`,
  };
}

export default async function AttendanceSettingsPage() {
  const session = await requireAuth();
  const role = extractRole(session);

  if (!hasPermission(role, Permission.ATTENDANCE_SHIFT_MANAGE)) {
    redirect("/403");
  }

  const [config, devices, workCycles, shifts] = await Promise.all([
    getAttendanceConfig(),
    getTimekeeperDevices(),
    getWorkCycles(),
    getShifts(),
  ]);

  return (
    <SettingsClient
      initialConfig={config ? JSON.parse(JSON.stringify(config)) : null}
      initialDevices={JSON.parse(JSON.stringify(devices))}
      initialWorkCycles={JSON.parse(JSON.stringify(workCycles))}
      initialShifts={JSON.parse(JSON.stringify(shifts))}
    />
  );
}
