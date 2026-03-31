"use client";

import {
  Building2Icon,
  CalendarCheck2,
  ChevronsRightIcon,
  HomeIcon,
  LayoutDashboard,
  LucideIcon,
  OrbitIcon,
  Settings,
  UsersIcon,
} from "lucide-react";
import { Button } from "./ui/button";
import { useSidebar } from "./ui/sidebar";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Permission } from "@/lib/rbac/permissions";

interface MenuItem {
  label: string;
  icon: LucideIcon;
  href: string;
  permissions: Permission[];
}

const MENU_ITEM: MenuItem[] = [
  {
    label: "Trang chủ",
    icon: HomeIcon,
    href: "/",
    permissions: [Permission.ESS_VIEW],
  },
  {
    label: "Bảng điều khiển",
    icon: LayoutDashboard,
    href: "/dashboard",
    permissions: [Permission.DASHBOARD_VIEW],
  },
  {
    label: "Phòng ban",
    icon: Building2Icon,
    href: "/departments",
    permissions: [Permission.DEPT_VIEW],
  },
  {
    label: "Quản lý nhân sự",
    icon: UsersIcon,
    href: "/employees",
    permissions: [Permission.EMPLOYEE_VIEW_ALL],
  },
  {
    label: "Lịch chấm công",
    icon: CalendarCheck2,
    href: "/attendance",
    permissions: [Permission.ATTENDANCE_VIEW_ALL],
  },
  {
    label: "Orbit",
    icon: OrbitIcon,
    href: "/orbit",
    permissions: [Permission.ORG_CHART_VIEW],
  },
];

const SidebarMind = () => {
  const { toggleSidebar, open } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const { canAny } = useAuth();

  const isSettings = pathname.startsWith("/settings");

  // Lọc các menu items dựa trên permissions
  const visibleMenuItems = MENU_ITEM.filter((item) =>
    canAny(item.permissions)
  );

  return (
    <div className="me-1.5 ms-1.5 rounded-lg grid grid-cols-[1fr_auto] bg-primary dark:bg-primary-dark shadow-xl relative">
      <div className="flex flex-col min-h-0 min-w-0 items-center w-12 justify-between py-2">
        <div className="flex flex-col items-center shrink-0 relative">
          <div
            className={cn(
              "flex flex-col items-center shrink-0 relative gap-2 transition-all duration-300 ease-in-out",
              !open ? "opacity-100 h-13" : "opacity-0 h-0",
            )}
          >
            <Button
              onClick={toggleSidebar}
              variant="ghost"
              size="icon-sm"
              className=" hover:bg-white/20!"
              tooltip="Thu nhỏ"
            >
              <ChevronsRightIcon className="text-white" />
            </Button>
            <div className="w-5 h-px bg-border"></div>
          </div>
          <div
            className={cn(
              "flex flex-col items-center w-full min-h-0 overflow-clip shrink-0 relative transition-all transform-gpu duration-300 ease-in-out",
              !open ? " translate-y-0" : " translate-y-0",
            )}
          >
            <div className="flex flex-col items-center w-full gap-2">
              {visibleMenuItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href + "/"));
                return (
                  <Button
                    key={item.href}
                    tooltip={item.label}
                    variant="ghost"
                    size="icon-sm"
                    isActive={isActive}
                    onClick={() => router.push(item.href)}
                    className="data-[active=false]:hover:bg-white/20 dark:data-[active=false]:hover:bg-white/20 data-[active=true]:bg-white data-[active=true]:[&_svg]:text-primary data-[active=false]:text-white [&_svg]:text-white [&_svg]:hover:bg-white dark:data-[active=true]:bg-white/80 dark:data-[active=true]:[&_svg]:text-primary-dark"
                  >
                    <item.icon className="text-white" />
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
        {canAny([Permission.SETTINGS_VIEW]) && (
          <Button
            tooltip={"Cài đặt"}
            variant="ghost"
            isActive={isSettings}
            size="icon-sm"
            className="data-[active=false]:hover:bg-white/20 dark:data-[active=false]:hover:bg-white/20 data-[active=true]:bg-white data-[active=true]:[&_svg]:text-primary data-[active=false]:text-white [&_svg]:text-white [&_svg]:hover:bg-white dark:data-[active=true]:bg-white/80 dark:data-[active=true]:[&_svg]:text-primary-dark"
            onClick={() => router.push("/settings/company")}
          >
            <Settings />
          </Button>
        )}
      </div>
    </div>
  );
};

export default SidebarMind;
