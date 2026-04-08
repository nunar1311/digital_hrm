"use client";

import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { routing } from "@/i18n/routing";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import UserProfile from "./user-profile";
import LanguageSwitcher from "./themes/language-switcher";

const ROUTE_LABEL_KEY_MAP: Record<string, string> = {
    "": "sidebarHome",
    "org-chart": "sidebarNavOrgChart",
    departments: "sidebarNavDepartments",
    employees: "sidebarNavEmployees",
    new: "appHeaderRouteNew",
    edit: "appHeaderRouteEdit",
    contracts: "sidebarNavContracts",
    templates: "sidebarNavContractTemplates",
    leaves: "sidebarNavLeave",
    calendar: "appHeaderRouteCalendar",
    policies: "appHeaderRoutePolicies",
    requests: "appHeaderRouteRequests",
    attendance: "sidebarNavAttendance",
    monthly: "sidebarNavMonthlyTimesheet",
    shifts: "sidebarNavShifts",
    overtime: "sidebarNavOvertime",
    explanations: "sidebarNavExplanations",
    payroll: "sidebarNavPayroll",
    formulas: "sidebarNavPayrollFormulas",
    payslips: "sidebarNavPayslips",
    "tax-insurance": "sidebarNavTaxAndInsurance",
    onboarding: "sidebarNavOnboarding",
    offboarding: "sidebarNavOffboarding",
    recruitment: "sidebarNavRecruitment",
    training: "sidebarNavTraining",
    performance: "sidebarNavPerformance",
    assets: "sidebarNavAssets",
    rewards: "sidebarNavRewardsAndDiscipline",
    reports: "sidebarNavReports",
    ess: "sidebarNavEmployeePortal",
    profile: "sidebarNavPersonalProfile",
    settings: "sidebarNavAppSettings",
    roles: "sidebarNavPermissions",
    "audit-log": "sidebarNavAuditLog",
};

export function AppHeader() {
    const pathname = usePathname();
    const locale = useLocale();
    const t = useTranslations("ProtectedPages");
    const allSegments = pathname.split("/").filter(Boolean);
    const firstSegment = allSegments[0];
    const hasLocalePrefix = routing.locales.includes(
        firstSegment as (typeof routing.locales)[number],
    );
    const currentLocale = routing.locales.includes(
        locale as (typeof routing.locales)[number],
    )
        ? (locale as (typeof routing.locales)[number])
        : routing.defaultLocale;
    const segments = hasLocalePrefix ? allSegments.slice(1) : allSegments;

    const getRouteLabel = (segment: string) => {
        const key = ROUTE_LABEL_KEY_MAP[segment];
        if (key && t.has(key)) {
            return t(key);
        }

        return decodeURIComponent(segment);
    };

    return (
        <header className="flex h-10 shrink-0 items-center justify-between gap-2 px-4 py-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator
                    orientation="vertical"
                    className="mr-2 h-4"
                />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href={`/${currentLocale}`}>
                                {getRouteLabel("")}
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        {segments.map((segment, index) => {
                            const href =
                                "/" +
                                [
                                    currentLocale,
                                    ...segments.slice(0, index + 1),
                                ].join("/");
                            const label = getRouteLabel(segment);
                            const isLast =
                                index === segments.length - 1;

                            return (
                                <span key={href} className="contents">
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem>
                                        {isLast ? (
                                            <BreadcrumbPage>
                                                {label}
                                            </BreadcrumbPage>
                                        ) : (
                                            <BreadcrumbLink
                                                href={href}
                                            >
                                                {label}
                                            </BreadcrumbLink>
                                        )}
                                    </BreadcrumbItem>
                                </span>
                            );
                        })}
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            <div className="flex items-center gap-2">
                <LanguageSwitcher />
                <UserProfile />
            </div>
        </header>
    );
}
