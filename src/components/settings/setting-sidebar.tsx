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
import { Bell, Building, LucideIcon, Package, UserCircle2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

interface SettingsItem {
  icon: LucideIcon;
  name: string;
  url: string;
}

const MySettings: SettingsItem[] = [
  {
    icon: UserCircle2,
    name: "Sở thích",
    url: "/settings/preferences",
  },
  {
    icon: Bell,
    name: "Thông báo",
    url: "/settings/notifications",
  },
] as const;

const MyCompanySettings: SettingsItem[] = [
  {
    icon: Building,
    name: "Công ty",
    url: "/settings/company",
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
    <Sidebar collapsible="offcanvas" className="absolute h-full!">
      <SidebarHeader className="flex-row items-center justify-between">
        <h1 className="text-base font-bold">Tất cả cài đặt</h1>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Cá nhân</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {MySettings.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    isActive={item.url === pathname}
                    tooltip={item.name}
                    onClick={() => router.push(item.url)}
                    className="data-[active=true]:bg-primary/15 data-[active=true]:text-primary dark:data-[active=true]:text-accent-foreground dark:data-[active=true]:bg-primary/80 data-[active=true]:font-semibold"
                  >
                    <item.icon />
                    {item.name}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Công ty của tôi</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {MyCompanySettings.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    isActive={item.url === pathname}
                    tooltip={item.name}
                    onClick={() => router.push(item.url)}
                    className="data-[active=true]:bg-primary/15 data-[active=true]:text-primary dark:data-[active=true]:text-accent-foreground dark:data-[active=true]:bg-primary/80 data-[active=true]:font-semibold"
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
