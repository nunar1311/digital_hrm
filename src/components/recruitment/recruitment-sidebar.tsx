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
  LayoutDashboard,
  Briefcase,
  Users,
  Calendar,
  BarChart3,
  Settings,
} from "lucide-react";

import Link from "next/link";

import { useAuth } from "@/hooks/use-auth";
import { Permission } from "@/lib/rbac/permissions";

const RECRUITMENT_MENU = [
  {
    title: "Tổng quan",
    icon: LayoutDashboard,
    url: "/recruitment",
    permissions: [Permission.RECRUITMENT_VIEW],
  },
  {
    title: "Tin tuyển dụng",
    icon: Briefcase,
    url: "/recruitment/job-postings",
    permissions: [Permission.RECRUITMENT_VIEW],
  },
  {
    title: "Ứng viên",
    icon: Users,
    url: "/recruitment/candidates",
    permissions: [
      Permission.RECRUITMENT_VIEW,
      Permission.RECRUITMENT_CANDIDATE_VIEW,
    ],
  },
  {
    title: "Lịch phỏng vấn",
    icon: Calendar,
    url: "/recruitment/interviews",
    permissions: [
      Permission.RECRUITMENT_VIEW,
      Permission.RECRUITMENT_INTERVIEW_SCHEDULE,
    ],
  },
  {
    title: "Báo cáo",
    icon: BarChart3,
    url: "/recruitment/reports",
    permissions: [Permission.RECRUITMENT_REPORT_VIEW],
  },
  {
    title: "Thiết lập",
    icon: Settings,
    url: "/recruitment/settings",
    permissions: [Permission.RECRUITMENT_MANAGE],
  },
];

const RecruitmentSidebar = () => {
  const pathname = usePathname();
  const { canAny } = useAuth();

  const visibleItems = RECRUITMENT_MENU.filter((item) =>
    canAny(item.permissions),
  );

  const isActive = (url: string) => {
    if (url === "/recruitment") {
      return pathname === "/recruitment";
    }
    return pathname.startsWith(url);
  };

  return (
    <Sidebar
      collapsible="offcanvas"
      className="absolute h-full! group/sidebar"
    >
      <SidebarHeader className="flex-row h-[44px] items-center justify-between">
        <h2 className="text-base font-bold group-data-[collapsible=icon]:hidden">
          Tuyển dụng
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

export default RecruitmentSidebar;
