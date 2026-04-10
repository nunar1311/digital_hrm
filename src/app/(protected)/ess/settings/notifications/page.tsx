import { NotificationSettingsClient } from "@/app/(protected)/settings/notifications/notification-settings-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Thông báo | Cài đặt cá nhân",
  description: "Cài đặt thông báo email và push",
};

export default function ESSNotificationsPage() {
  return <NotificationSettingsClient />;
}
