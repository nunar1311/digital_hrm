import type { Metadata } from "next";

import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Cài đặt cá nhân | Cổng nhân viên",
  description: "Quản lý cài đặt cá nhân của bạn",
};

export default function ESSSettingsPage() {
  return redirect("/ess/settings/preferences");
}
