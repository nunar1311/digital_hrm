"use client";

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "../ui/sidebar";
import { Bell, Building, LucideIcon, Package } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

interface MyCompanySettingsItem {
    icon: LucideIcon;
    name: string;
    url: string;
}

const MyCompanySettings: MyCompanySettingsItem[] = [
    {
        icon: Building,
        name: "Công ty của tôi",
        url: "/settings/company",
    },

    {
        icon: Bell,
        name: "Thông báo",
        url: "/settings/notifications",
    },
    {
        icon: Package,
        name: "Tài sản",
        url: "/settings/assets",
    },
] as const;
const SettingSidebar = () => {
    const pathname = usePathname();
    const router = useRouter();

    return (
        <Sidebar
            collapsible="offcanvas"
            className="absolute h-full! group/sidebar"
        >
            <SidebarHeader>
                <h3 className="text-lg font-bold">Tất cả cài đặt</h3>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>
                        Công ty của tôi
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {MyCompanySettings.map((item) => (
                                <SidebarMenuItem key={item.name}>
                                    <SidebarMenuButton
                                        isActive={
                                            item.url === pathname
                                        }
                                        tooltip={item.name}
                                        onClick={() =>
                                            router.push(item.url)
                                        }
                                        className="data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                                    >
                                        <item.icon />
                                        {item.name}
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
};

export default SettingSidebar;
