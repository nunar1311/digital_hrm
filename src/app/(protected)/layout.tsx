import { AppSidebar } from "@/components/app-sidebar";
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar";
import { AppHeader } from "@/components/app-header";
import { SocketWrapper } from "@/components/socket-wrapper";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import SidebarMind from "@/components/sidebar-mind";
import BannerNotification from "@/components/banner-notification";

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
            organizationId={
                session.session.activeOrganizationId ?? undefined
            }
        >
            <div className="h-screen flex flex-col overflow-hidden [--header-height:calc(--spacing(10))]">
                <SidebarProvider className="flex flex-col h-full">
                    <div className="shrink-0">
                        <AppHeader />
                    </div>

                    <div className="flex flex-1 overflow-hidden mb-1.5">
                        <SidebarMind />
                        <div className="border rounded-lg flex-1 flex overflow-hidden relative mr-1.5">
                            <AppSidebar />
                            <SidebarInset className="overflow-hidden flex-1 relative min-h-0">
                                <BannerNotification />
                                <main className="h-full overflow-hidden">
                                    {children}
                                </main>
                            </SidebarInset>
                        </div>
                    </div>
                </SidebarProvider>
            </div>
        </SocketWrapper>
    );
}
