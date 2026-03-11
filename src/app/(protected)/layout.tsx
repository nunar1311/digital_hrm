import { AppSidebar } from "@/components/app-sidebar";
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar";
import { AppHeader } from "@/components/app-header";
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
        <div className="min-h-screen w-full">
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset className="flex flex-col min-h-screen">
                    <AppHeader />
                    <main className="flex-1 p-4 md:p-6">
                        {children}
                    </main>
                </SidebarInset>
            </SidebarProvider>
        </div>
    );
}
