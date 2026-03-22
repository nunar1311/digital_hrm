"use client";

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarTrigger,
} from "@/components/ui/sidebar";

// ─── Main Sidebar Component ─────────────────────────────────────────
const AttendanceSidebar = () => {
    return (
        <Sidebar
            collapsible="offcanvas"
            className="absolute h-full! group/sidebar"
        >
            <SidebarHeader className="flex-row h-[44px] items-center justify-between">
                <div className="group-data-[collapsible=icon]:hidden px-2 font-bold">
                    Chấm công
                </div>
                <div className="flex items-center gap-0.5">
                    <div className="flex items-center transition-all duration-150 transform-gpu translate-x-2 group-hover:translate-x-0 gap-0.5 ease-linear opacity-0 group-hover:opacity-100">
                        <SidebarTrigger className="group-data-[collapsible=icon]:hidden gap-0!" />
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup className="gap-3 px-2">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton className="min-h-7 opacity-0 pointer-events-none" />
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
};

export default AttendanceSidebar;
