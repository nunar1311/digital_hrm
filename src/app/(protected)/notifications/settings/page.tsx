import { Suspense } from "react";
import { NotificationSettingsPage } from "./settings-client";

export default function NotificationSettingsPageWrapper() {
  return (
    <Suspense fallback={<div className="container p-6">Đang tải...</div>}>
      <NotificationSettingsPage />
    </Suspense>
  );
}
