"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
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
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarRail,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { sidebarNav } from "@/config/sidebar-nav";
import { useAuth } from "@/hooks/use-auth";

const GROUP_LABEL_KEYS = [
    "sidebarGroupOverview",
    "sidebarGroupOrganization",
    "sidebarGroupHumanResources",
    "sidebarGroupWork",
    "sidebarGroupProcess",
    "sidebarGroupDevelopment",
    "sidebarGroupOther",
] as const;

const NAV_LABEL_KEY_BY_URL: Record<string, string> = {
    "/dashboard": "sidebarNavDashboard",
    "/org-chart": "sidebarNavOrgChart",
    "/departments": "sidebarNavDepartments",
    "/positions": "sidebarNavPositions",
    "/employees": "sidebarNavEmployees",
    "/employees/new": "sidebarNavCreateNew",
    "/employees/import-export": "sidebarNavImportExportExcel",
    "/contracts": "sidebarNavContracts",
    "/contracts/templates": "sidebarNavContractTemplates",
    "/attendance/leave-summary": "sidebarNavLeaveBalanceSummary",
    "/attendance/holidays": "sidebarNavHolidayCalendar",
    "/attendance/leave-requests": "sidebarNavApproveLeaveRequests",
    "/attendance": "sidebarNavToday",
    "/attendance/monthly": "sidebarNavMonthlyTimesheet",
    "/attendance/records": "sidebarNavAttendanceLogs",
    "/attendance/shifts": "sidebarNavShifts",
    "/attendance/overtime": "sidebarNavOvertime",
    "/attendance/explanations": "sidebarNavExplanations",
    "/attendance/admin-requests": "sidebarNavAdministrativeRequests",
    "/attendance/settings": "sidebarNavSettings",
    "/payroll": "sidebarNavPayrollTable",
    "/payroll/formulas": "sidebarNavPayrollFormulas",
    "/payroll/payslips": "sidebarNavPayslips",
    "/payroll/tax-insurance": "sidebarNavTaxAndInsurance",
    "/onboarding": "sidebarNavOnboarding",
    "/offboarding": "sidebarNavOffboarding",
    "/recruitment": "sidebarNavRecruitment",
    "/training": "sidebarNavTraining",
    "/performance": "sidebarNavPerformance",
    "/rewards": "sidebarNavRewardsAndDiscipline",
    "/assets": "sidebarNavAssets",
    "/reports": "sidebarNavReports",
    "/ess": "sidebarNavEmployeePortal",
    "/ess/my-requests": "sidebarNavMyRequests",
    "/ess/profile": "sidebarNavPersonalProfile",
    "/settings": "sidebarNavGeneral",
    "/settings/roles": "sidebarNavPermissions",
    "/settings/audit-log": "sidebarNavAuditLog",
};

export function AppSidebar() {
    const t = useTranslations("ProtectedPages");
    const pathname = usePathname();
    const { canAny } = useAuth();

    const getSidebarLabelByUrl = (url: string, fallback: string) => {
        const key = NAV_LABEL_KEY_BY_URL[url];
        return key ? t(key) : fallback;
    };

    const isSettings = pathname.includes("/settings");
    const isDashboard = pathname.includes("/dashboard");
    const isEmployees = pathname.includes("/employees");

    if (isSettings || isDashboard || isEmployees) {
        return null;
    }

    return (
        <Sidebar
            collapsible="offcanvas"
            className="absolute h-full! group/sidebar"
        >
            <SidebarHeader className="flex-row h-[44px] items-center justify-between">
                <div className="group-data-[collapsible=icon]:hidden px-2 font-bold">
                    {t("sidebarHome")}
                </div>
                <div className="flex items-center gap-0.5">
                    <div className="flex items-center transition-all duration-150 transform-gpu translate-x-2 group-hover:translate-x-0 gap-0.5 ease-linear opacity-0 group-hover:opacity-100">
                        <SidebarTrigger className="group-data-[collapsible=icon]:hidden gap-0!" />
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent>
                {sidebarNav.map((group, groupIndex) => {
                    const visibleItems = group.items.filter((item) =>
                        canAny(item.permissions),
                    );

                    if (visibleItems.length === 0) return null;

                    return (
                        <SidebarGroup key={group.label}>
                            <SidebarGroupLabel>
                                {t(
                                    GROUP_LABEL_KEYS[groupIndex] ??
                                        "sidebarGroupOther",
                                )}
                            </SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {visibleItems.map((item) => {
                                        const isActive =
                                            pathname === item.url ||
                                            (item.url !== "/" &&
                                                pathname.startsWith(
                                                    item.url + "/",
                                                ));

                                        const visibleChildren =
                                            item.children?.filter(
                                                (child) =>
                                                    canAny(
                                                        child.permissions,
                                                    ),
                                            );

                                        if (
                                            visibleChildren &&
                                            visibleChildren.length > 0
                                        ) {
                                            return (
                                                <Collapsible
                                                    key={item.title}
                                                    asChild
                                                    defaultOpen={
                                                        isActive
                                                    }
                                                    className="group/collapsible"
                                                >
                                                    <SidebarMenuItem>
                                                        <CollapsibleTrigger
                                                            asChild
                                                        >
                                                            <SidebarMenuButton
                                                                tooltip={
                                                                    getSidebarLabelByUrl(
                                                                        item.url,
                                                                        item.title,
                                                                    )
                                                                }
                                                                isActive={
                                                                    isActive
                                                                }
                                                            >
                                                                <item.icon />
                                                                <span>
                                                                    {
                                                                        getSidebarLabelByUrl(
                                                                            item.url,
                                                                            item.title,
                                                                        )
                                                                    }
                                                                </span>
                                                                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                                            </SidebarMenuButton>
                                                        </CollapsibleTrigger>
                                                        <CollapsibleContent>
                                                            <SidebarMenuSub>
                                                                {visibleChildren.map(
                                                                    (
                                                                        child,
                                                                    ) => (
                                                                        <SidebarMenuSubItem
                                                                            key={
                                                                                child.url
                                                                            }
                                                                        >
                                                                            <SidebarMenuSubButton
                                                                                asChild
                                                                                isActive={
                                                                                    pathname ===
                                                                                    child.url
                                                                                }
                                                                            >
                                                                                <Link
                                                                                    href={
                                                                                        child.url
                                                                                    }
                                                                                >
                                                                                    <span>
                                                                                        {
                                                                                            getSidebarLabelByUrl(
                                                                                                child.url,
                                                                                                child.title,
                                                                                            )
                                                                                        }
                                                                                    </span>
                                                                                </Link>
                                                                            </SidebarMenuSubButton>
                                                                        </SidebarMenuSubItem>
                                                                    ),
                                                                )}
                                                            </SidebarMenuSub>
                                                        </CollapsibleContent>
                                                    </SidebarMenuItem>
                                                </Collapsible>
                                            );
                                        }

                                        return (
                                            <SidebarMenuItem
                                                key={item.title}
                                            >
                                                <SidebarMenuButton
                                                    asChild
                                                    tooltip={
                                                        getSidebarLabelByUrl(
                                                            item.url,
                                                            item.title,
                                                        )
                                                    }
                                                    isActive={
                                                        isActive
                                                    }
                                                >
                                                    <Link
                                                        href={
                                                            item.url
                                                        }
                                                    >
                                                        <item.icon />
                                                        <span>
                                                            {
                                                                getSidebarLabelByUrl(
                                                                    item.url,
                                                                    item.title,
                                                                )
                                                            }
                                                        </span>
                                                    </Link>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        );
                                    })}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    );
                })}
            </SidebarContent>

            <SidebarRail />
        </Sidebar>
    );
}
