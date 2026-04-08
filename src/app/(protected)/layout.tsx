import { SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/app-header";
import { SocketWrapper } from "@/components/socket-wrapper";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SidebarMindWrapper } from "@/components/sidebar-mind-wrapper";
import BannerNotification from "@/components/banner-notification";
import { AttendanceCheckDialog } from "@/components/attendance/attendance-check-dialog";
import { ShiftReminderNotifier } from "@/components/attendance/shift-reminder-notifier";
import { ContractExpiryReminderNotifier } from "@/components/contracts/contract-expiry-reminder-notifier";
import {
  SidebarContextProvider,
  SidebarSlot,
} from "@/contexts/sidebar-context";
import RightSidebar from "@/components/right-sidebar";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side auth check
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // Check if company is set up
  const company = await prisma.organization.findFirst();
  if (!company) {
    redirect("/company-setup");
  }

  return (
    <SocketWrapper
      userId={session.user.id}
      organizationId={session.session.activeOrganizationId ?? undefined}
    >
      <SidebarContextProvider>
        <div className="h-screen flex flex-col overflow-hidden [--header-height:calc(--spacing(10))]">
          <SidebarProvider className="flex flex-col h-full">
            <div className="shrink-0">
              <AppHeader />
            </div>

            <div className="flex flex-1 overflow-hidden mb-1.5 transition-all duration-300 ease-in-out">
              <SidebarMindWrapper />
              <div className="border rounded-lg flex-1 flex overflow-hidden relative mr-1.5 ml-1.5">
                <SidebarSlot className="overflow-hidden flex-1 relative min-h-0">
                  <BannerNotification />
                  <AttendanceCheckDialog />
                  <ShiftReminderNotifier />
                  <ContractExpiryReminderNotifier />
                  <main className="h-full overflow-hidden">{children}</main>
                </SidebarSlot>
              </div>

              <RightSidebar />
            </div>
          </SidebarProvider>
        </div>
      </SidebarContextProvider>
    </SocketWrapper>
  );
}
