"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutDashboard,
  Settings,
} from "lucide-react";

import Link from "next/link";

import { useAuth } from "@/hooks/use-auth";
import { Permission } from "@/lib/rbac/permissions";

const ONBOARDING_MENU = [
  {
    title: "Tổng quan",
    icon: LayoutDashboard,
    url: "/onboarding",
    permissions: [Permission.ONBOARDING_VIEW],
  },
  {
    title: "Thiết lập mẫu",
    icon: Settings,
    url: "/onboarding/settings",
    permissions: [Permission.ONBOARDING_MANAGE],
  },
];

const OnboardingSidebar = () => {
  const pathname = usePathname();
  const { canAny } = useAuth();

  const visibleItems = ONBOARDING_MENU.filter((item) =>
    canAny(item.permissions),
  );

  const isActive = (url: string) => {
    if (url === "/onboarding") {
      return pathname === "/onboarding";
    }
    return pathname.startsWith(url);
  };

  return (
    <Sidebar collapsible="offcanvas" className="absolute h-full! group/sidebar">
      <SidebarHeader className="flex-row h-[44px] items-center justify-between">
        <h2 className="text-base font-bold group-data-[collapsible=icon]:hidden">
          Tiếp nhận nhân sự
        </h2>
        <div className="flex items-center gap-0.5">
          <div className="flex items-center transition-all duration-150 transform-gpu translate-x-2 group-hover:translate-x-0 gap-0.5 ease-linear opacity-0 group-hover:opacity-100">
            <SidebarTrigger className="group-data-[collapsible=icon]:hidden gap-0!" />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="gap-1 px-2">
          <SidebarMenu>
            {visibleItems.map((item) => (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive(item.url)}
                  tooltip={item.title}
                >
                  <Link href={item.url}>
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
};

export default OnboardingSidebar;