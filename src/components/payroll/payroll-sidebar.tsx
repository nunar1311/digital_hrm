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
import { BarChart3, Calculator, FileText, Shield } from "lucide-react";

import Link from "next/link";

import { useAuth } from "@/hooks/use-auth";
import { Permission } from "@/lib/rbac/permissions";

const PAYROLL_MENU = [
  {
    title: "Bảng lương",
    icon: BarChart3,
    url: "/payroll",
    permissions: [
      Permission.PAYROLL_VIEW_SELF,
      Permission.PAYROLL_VIEW_ALL,
      Permission.PAYROLL_CALCULATE,
    ],
  },
  {
    title: "Công thức",
    icon: Calculator,
    url: "/payroll/formulas",
    permissions: [Permission.PAYROLL_FORMULA_MANAGE],
  },
  {
    title: "Phiếu lương",
    icon: FileText,
    url: "/payroll/payslips",
    permissions: [
      Permission.PAYROLL_VIEW_SELF,
      Permission.PAYROLL_SEND_PAYSLIP,
    ],
  },
  {
    title: "Thuế & BHXH",
    icon: Shield,
    url: "/payroll/tax-insurance",
    permissions: [Permission.PAYROLL_TAX_MANAGE],
  },
];

const PayrollSidebar = () => {
  const pathname = usePathname();
  const { canAny } = useAuth();

  const visibleItems = PAYROLL_MENU.filter((item) => canAny(item.permissions));

  const isActive = (url: string) => {
    return pathname === url;
  };

  return (
    <Sidebar collapsible="offcanvas" className="absolute h-full! group/sidebar">
      <SidebarHeader className="flex-row h-[44px] items-center justify-between">
        <h2 className="text-base font-bold group-data-[collapsible=icon]:hidden">
          Tính lương
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

export default PayrollSidebar;
