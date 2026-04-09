"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import {
  CalendarCheck,
  CalendarOff,
  FileText,
  Home,
  Network,
  Package,
  Receipt,
  User,
  Wallet,
} from "lucide-react";

import Link from "next/link";

import { useAuth } from "@/hooks/use-auth";
import { Permission } from "@/lib/rbac/permissions";

const ESS_MENU = [
  {
    title: "Tổng quan",
    icon: Home,
    url: "/",
    permissions: [Permission.ESS_VIEW],
  },
  {
    title: "Sơ đồ tổ chức",
    icon: Network,
    url: "/org-chart",
    permissions: [Permission.ORG_CHART_VIEW],
  },
  {
    title: "Chấm công",
    icon: CalendarCheck,
    url: "/ess/attendance",
    permissions: [Permission.ESS_VIEW],
  },
  {
    title: "Nghỉ phép",
    icon: CalendarOff,
    url: "/ess/leave",
    permissions: [Permission.ESS_VIEW],
  },
  {
    title: "Đơn từ HC",
    icon: Receipt,
    url: "/ess/requests",
    permissions: [Permission.ESS_SEND_REQUEST],
  },
  {
    title: "Phiếu lương",
    icon: Wallet,
    url: "/ess/payroll",
    permissions: [Permission.PAYROLL_VIEW_SELF],
  },
  {
    title: "Hồ sơ cá nhân",
    icon: User,
    url: "/ess/profile",
    permissions: [Permission.ESS_UPDATE_PROFILE],
  },
  {
    title: "Hợp đồng",
    icon: FileText,
    url: "/ess/contracts",
    permissions: [Permission.CONTRACT_VIEW_SELF],
  },
  {
    title: "Tài sản",
    icon: Package,
    url: "/ess/assets",
    permissions: [Permission.ASSET_VIEW_SELF],
  },
];

const ESSSidebar = () => {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const { canAny } = useAuth();

  const visibleItems = ESS_MENU.filter((item) => canAny(item.permissions));

  const isActive = (url: string) => {
    if (url === "/") {
      return pathname === "/";
    }
    return pathname === url || pathname.startsWith(`${url}/`);
  };

  const handleMenuItemClick = () => {
    setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="offcanvas" className="absolute h-full! group/sidebar">
      <SidebarHeader className="flex-row h-11 items-center justify-between">
        <h2 className="text-base font-bold group-data-[collapsible=icon]:hidden">
          Cổng nhân viên
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
                  <Link href={item.url} onClick={handleMenuItemClick}>
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

export default ESSSidebar;
