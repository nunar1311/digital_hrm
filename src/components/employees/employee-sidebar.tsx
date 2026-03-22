"use client";

import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarTrigger,
} from "@/components/ui/sidebar";

const EmployeeSidebar = () => {
    return (
        <Sidebar
            collapsible="offcanvas"
            className="absolute h-full! group/sidebar"
        >
            <SidebarHeader className="flex-row h-[44px] items-center justify-between">
                <div className="group-data-[collapsible=icon]:hidden px-2 font-bold">
                    Nhân viên
                </div>
                <div className="flex items-center gap-0.5">
                    <div className="flex items-center transition-all duration-150 transform-gpu translate-x-2 group-hover:translate-x-0 gap-0.5 ease-linear opacity-0 group-hover:opacity-100">
                        <SidebarTrigger className="group-data-[collapsible=icon]:hidden gap-0!" />
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent>
            </SidebarContent>
        </Sidebar>
    );
};

export default EmployeeSidebar;
