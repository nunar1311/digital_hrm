import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth-session";
import { Permission } from "@/lib/rbac/permissions";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Cài đặt hệ thống",
};

export default async function SettingsPage() {
  await requirePermission(Permission.SETTINGS_VIEW);

  return redirect("/settings/preferences");
}
