"use client";

import Link from "next/link";
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
    title: string;
    description: string;
    href: string;
    icon: LucideIcon;
    badge?: string | number;
    badgeVariant?: "default" | "secondary" | "destructive" | "outline";
    color: string;
    bgColor: string;
}

interface MenuCardSection {
    title: string;
    icon: LucideIcon;
    items: MenuCard[];
}

const menuSections: MenuCardSection[] = [
    {
        title: "Đơn của tôi",
        icon: FileText,
        items: [
            {
                title: "Đơn của tôi",
                description: "Theo dõi tất cả đơn đã gửi và trạng thái duyệt",
                href: "/ess/my-requests",
                icon: FileText,
                bgColor: "bg-purple-50",
                color: "text-purple-600",
            },
            {
                title: "Đăng ký nghỉ phép",
                description: "Tạo đơn xin nghỉ phép mới",
                href: "/ess/leave",
                icon: CalendarDays,
                bgColor: "bg-blue-50",
                color: "text-blue-600",
            },
            {
                title: "Yêu cầu HC",
                description: "Xác nhận lương, giấy tờ, xác nhận công tác",
                href: "/ess/requests",
                icon: Briefcase,
                bgColor: "bg-teal-50",
                color: "text-teal-600",
            },
        ],
    },
    {
        title: "Chấm công & Nghỉ phép",
        icon: CalendarCheck,
        items: [
            {
                title: "Chấm công",
                description: "Xem lịch sử chấm công, bảng công tháng và OT",
                href: "/ess/attendance",
                icon: CalendarCheck,
                bgColor: "bg-emerald-50",
                color: "text-emerald-600",
                badge: "Hằng ngày",
                badgeVariant: "secondary",
            },
            {
                title: "Làm thêm giờ",
                description: "Đăng ký và theo dõi yêu cầu OT",
                href: "/attendance/overtime",
                icon: Clock,
                bgColor: "bg-amber-50",
                color: "text-amber-600",
            },
        ],
    },
    {
        title: "Hồ sơ & Thông tin",
        icon: User,
        items: [
            {
                title: "Hồ sơ cá nhân",
                description: "Xem và cập nhật thông tin cá nhân",
                href: "/ess/profile",
                icon: User,
                bgColor: "bg-purple-50",
                color: "text-purple-600",
            },
            {
                title: "Hợp đồng lao động",
                description: "Xem thông tin hợp đồng và quyền lợi",
                href: "/ess/contracts",
                icon: Briefcase,
                bgColor: "bg-indigo-50",
                color: "text-indigo-600",
            },
            {
                title: "Phiếu lương",
                description: "Xem và tải phiếu lương, thông tin thuế",
                href: "/ess/payroll",
                icon: Wallet,
                bgColor: "bg-green-50",
                color: "text-green-600",
            },
        ],
    },
    {
        title: "Phúc lợi & Tài sản",
        icon: Package,
        items: [
            {
                title: "Tài sản được giao",
                description: "Danh sách tài sản, thiết bị được cấp phát",
                href: "/ess/assets",
                icon: Package,
                bgColor: "bg-orange-50",
                color: "text-orange-600",
            },
            {
                title: "Phúc lợi",
                description: "Bảo hiểm, khen thưởng, đánh giá",
                href: "/ess/benefits",
                icon: HeartPulse,
                bgColor: "bg-rose-50",
                color: "text-rose-600",
            },
        ],
    },
];

function MenuCardItem({ item }: { item: MenuCard }) {
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
                                {item.badge}
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                    <CardTitle className="text-base group-hover:text-primary transition-colors flex items-center gap-2">
                        {item.title}
                        <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </CardTitle>
                    <CardDescription className="text-xs leading-relaxed">
                        {item.description}
                    </CardDescription>
                </CardContent>
            </Card>
        </Link>
    );
}

function SectionHeader({ title, icon: Icon, count }: { title: string; icon: LucideIcon; count: number }) {
    return (
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-semibold">{title}</h3>
                <Badge variant="secondary" className="text-xs ml-1">
                    {count}
                </Badge>
            </div>
        </div>
    );
}

export function ESSMenuCards() {
    return (
        <div className="space-y-8">
            {menuSections.map((section) => (
                <div key={section.title} className="group">
                    <SectionHeader
                        title={section.title}
                        icon={section.icon}
                        count={section.items.length}
                    />
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {section.items.map((item) => (
                            <MenuCardItem key={item.href} item={item} />
                        ))}
                    </div>
                </div>
            ))}

            {/* Footer Actions */}
            <Card className="bg-linear-to-r from-muted/50 to-muted/30 border-dashed">
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-center sm:text-left">
                            <h3 className="font-medium">Cần hỗ trợ?</h3>
                            <p className="text-sm text-muted-foreground">
                                Liên hệ bộ phận HCNS hoặc quản lý trực tiếp
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/ess/help">
                                    <Settings className="h-4 w-4 mr-2" />
                                    Hướng dẫn
                                </Link>
                            </Button>
                            <Button size="sm" asChild>
                                <Link href="/ess/feedback">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Gửi phản hồi
                                </Link>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
