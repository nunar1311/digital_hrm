import { AppSidebar } from "@/components/app-sidebar";
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar";
import { AppHeader } from "@/components/app-header";
import { SocketWrapper } from "@/components/socket-wrapper";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

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
    return (
        <SocketWrapper
            userId={session.user.id}
            organizationId={
                session.session.activeOrganizationId ?? undefined
            }
        >
            <div className="fixed inset-0">
                <SidebarProvider>
                    <AppSidebar />
                    <SidebarInset className="overflow-hidden min-h-0">
                        <AppHeader />
                        <main className="flex-1 overflow-auto flex flex-col">
                            {children}
                        </main>
                    </SidebarInset>
                </SidebarProvider>
            </div>
        </SocketWrapper>
    );
}
