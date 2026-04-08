"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
    CalendarCheck,
    User,
    FileText,
    CalendarDays,
    Package,
    Wallet,
    Clock,
    ArrowRight,
    ChevronRight,
    Plus,
    Briefcase,
    HeartPulse,
    Gift,
    BarChart3,
    Settings,
    type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MenuCard {
    titleKey: string;
    descriptionKey: string;
    href: string;
    icon: LucideIcon;
    badge?: string | number;
    badgeVariant?: "default" | "secondary" | "destructive" | "outline";
    color: string;
    bgColor: string;
}

interface MenuCardSection {
    titleKey: string;
    icon: LucideIcon;
    items: MenuCard[];
}

const menuSections: MenuCardSection[] = [
    {
        titleKey: "essMenuSectionMyRequests",
        icon: FileText,
        items: [
            {
                titleKey: "essMenuMyRequestsTitle",
                descriptionKey: "essMenuMyRequestsDescription",
                href: "/ess/my-requests",
                icon: FileText,
                bgColor: "bg-purple-50",
                color: "text-purple-600",
            },
            {
                titleKey: "essMenuLeaveTitle",
                descriptionKey: "essMenuLeaveDescription",
                href: "/ess/leave",
                icon: CalendarDays,
                bgColor: "bg-blue-50",
                color: "text-blue-600",
            },
            {
                titleKey: "essMenuAdminRequestTitle",
                descriptionKey: "essMenuAdminRequestDescription",
                href: "/ess/requests",
                icon: Briefcase,
                bgColor: "bg-teal-50",
                color: "text-teal-600",
            },
        ],
    },
    {
        titleKey: "essMenuSectionAttendanceAndLeave",
        icon: CalendarCheck,
        items: [
            {
                titleKey: "essMenuAttendanceTitle",
                descriptionKey: "essMenuAttendanceDescription",
                href: "/ess/attendance",
                icon: CalendarCheck,
                bgColor: "bg-emerald-50",
                color: "text-emerald-600",
                badge: "essMenuDailyBadge",
                badgeVariant: "secondary",
            },
            {
                titleKey: "essMenuOvertimeTitle",
                descriptionKey: "essMenuOvertimeDescription",
                href: "/attendance/overtime",
                icon: Clock,
                bgColor: "bg-amber-50",
                color: "text-amber-600",
            },
        ],
    },
    {
        titleKey: "essMenuSectionProfileAndInfo",
        icon: User,
        items: [
            {
                titleKey: "essMenuProfileTitle",
                descriptionKey: "essMenuProfileDescription",
                href: "/ess/profile",
                icon: User,
                bgColor: "bg-purple-50",
                color: "text-purple-600",
            },
            {
                titleKey: "essMenuContractTitle",
                descriptionKey: "essMenuContractDescription",
                href: "/ess/contracts",
                icon: Briefcase,
                bgColor: "bg-indigo-50",
                color: "text-indigo-600",
            },
            {
                titleKey: "essMenuPayslipTitle",
                descriptionKey: "essMenuPayslipDescription",
                href: "/ess/payroll",
                icon: Wallet,
                bgColor: "bg-green-50",
                color: "text-green-600",
            },
        ],
    },
    {
        titleKey: "essMenuSectionBenefitsAndAssets",
        icon: Package,
        items: [
            {
                titleKey: "essMenuAssignedAssetsTitle",
                descriptionKey: "essMenuAssignedAssetsDescription",
                href: "/ess/assets",
                icon: Package,
                bgColor: "bg-orange-50",
                color: "text-orange-600",
            },
            {
                titleKey: "essMenuBenefitsTitle",
                descriptionKey: "essMenuBenefitsDescription",
                href: "/ess/benefits",
                icon: HeartPulse,
                bgColor: "bg-rose-50",
                color: "text-rose-600",
            },
        ],
    },
];

function MenuCardItem({
    item,
    t,
}: {
    item: MenuCard;
    t: ReturnType<typeof useTranslations>;
}) {
    const Icon = item.icon;

    return (
        <Link href={item.href} className="block group">
            <Card className="h-full transition-all duration-200 hover:shadow-lg hover:border-primary/30 group-hover:-translate-y-0.5">
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                        <div className={cn("p-3 rounded-xl transition-colors", item.bgColor, item.color)}>
                            <Icon className="h-6 w-6" />
                        </div>
                        {item.badge && (
                            <Badge variant={item.badgeVariant || "secondary"} className="text-xs font-normal">
                                {item.badge ? t(item.badge.toString()) : null}
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                    <CardTitle className="text-base group-hover:text-primary transition-colors flex items-center gap-2">
                        {t(item.titleKey)}
                        <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </CardTitle>
                    <CardDescription className="text-xs leading-relaxed">
                        {t(item.descriptionKey)}
                    </CardDescription>
                </CardContent>
            </Card>
        </Link>
    );
}

function SectionHeader({
    titleKey,
    icon: Icon,
    count,
    t,
}: {
    titleKey: string;
    icon: LucideIcon;
    count: number;
    t: ReturnType<typeof useTranslations>;
}) {
    return (
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-semibold">{t(titleKey)}</h3>
                <Badge variant="secondary" className="text-xs ml-1">
                    {count}
                </Badge>
            </div>
        </div>
    );
}

export function ESSMenuCards() {
    const t = useTranslations("ProtectedPages");

    return (
        <div className="space-y-8">
            {menuSections.map((section) => (
                <div key={section.titleKey} className="group">
                    <SectionHeader
                        titleKey={section.titleKey}
                        icon={section.icon}
                        count={section.items.length}
                        t={t}
                    />
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {section.items.map((item) => (
                            <MenuCardItem key={item.href} item={item} t={t} />
                        ))}
                    </div>
                </div>
            ))}

            {/* Footer Actions */}
            <Card className="bg-linear-to-r from-muted/50 to-muted/30 border-dashed">
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-center sm:text-left">
                            <h3 className="font-medium">{t("essMenuSupportTitle")}</h3>
                            <p className="text-sm text-muted-foreground">
                                {t("essMenuSupportDescription")}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/ess/help">
                                    <Settings className="h-4 w-4 mr-2" />
                                    {t("essMenuGuide")}
                                </Link>
                            </Button>
                            <Button size="sm" asChild>
                                <Link href="/ess/feedback">
                                    <Plus className="h-4 w-4 mr-2" />
                                    {t("essMenuFeedback")}
                                </Link>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
