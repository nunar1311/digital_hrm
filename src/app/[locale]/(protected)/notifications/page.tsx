import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-session";
import { getUserNotifications } from "@/lib/notification";
import { NotificationsPage } from "./notifications-client";

export default async function NotificationsPageRoute() {
  const session = await requireAuth();
  const initialData = await getUserNotifications({
    userId: session.user.id,
    page: 1,
    pageSize: 20,
  });

  return (
    <Suspense fallback={<div className="container p-6">Đang tải...</div>}>
      <NotificationsPage initialData={initialData} />
    </Suspense>
  );
}
