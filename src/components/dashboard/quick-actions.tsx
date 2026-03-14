"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    UserPlus, 
    Briefcase, 
    Calendar, 
    FileText, 
    Receipt, 
    Users,
    ArrowRight,
    Clock,
    TrendingUp
} from "lucide-react";
import Link from "next/link";

interface QuickAction {
    id: string;
    label: string;
    icon: React.ElementType;
    href: string;
    color: string;
    bgColor: string;
    description: string;
}

const quickActions: QuickAction[] = [
    {
        id: "add-employee",
        label: "Thêm NV mới",
        icon: UserPlus,
        href: "/employees/new",
        color: "text-blue-600",
        bgColor: "bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900",
        description: "Thêm nhân viên mới vào hệ thống",
    },
    {
        id: "job-posting",
        label: "Tuyển dụng",
        icon: Briefcase,
        href: "/recruitment",
        color: "text-purple-600",
        bgColor: "bg-purple-50 hover:bg-purple-100 dark:bg-purple-950 dark:hover:bg-purple-900",
        description: "Đăng tin tuyển dụng mới",
    },
    {
        id: "attendance-today",
        label: "Chấm công hôm nay",
        icon: Calendar,
        href: "/attendance",
        color: "text-green-600",
        bgColor: "bg-green-50 hover:bg-green-100 dark:bg-green-950 dark:hover:bg-green-900",
        description: "Xem bảng công hôm nay",
    },
    {
        id: "leave-request",
        label: "Đơn nghỉ phép",
        icon: Clock,
        href: "/leaves",
        color: "text-amber-600",
        bgColor: "bg-amber-50 hover:bg-amber-100 dark:bg-amber-950 dark:hover:bg-amber-900",
        description: "Gửi đơn xin nghỉ phép",
    },
    {
        id: "payslip",
        label: "Phiếu lương",
        icon: Receipt,
        href: "/payroll/payslips",
        color: "text-emerald-600",
        bgColor: "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:hover:bg-emerald-900",
        description: "Xem phiếu lương tháng này",
    },
    {
        id: "org-chart",
        label: "Sơ đồ tổ chức",
        icon: Users,
        href: "/org-chart",
        color: "text-cyan-600",
        bgColor: "bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950 dark:hover:bg-cyan-900",
        description: "Xem cơ cấu tổ chức",
    },
];

function QuickActionButton({ action }: { action: QuickAction }) {
    const Icon = action.icon;
    
    return (
        <Link href={action.href} className="block">
            <Button
                variant="ghost"
                className="w-full h-auto py-3 px-3 justify-start gap-3 hover:bg-accent"
            >
                <div className={`p-2 rounded-lg ${action.bgColor} shrink-0`}>
                    <Icon className={`h-5 w-5 ${action.color}`} />
                </div>
                <div className="text-left flex-1 min-w-0">
                    <div className="font-medium text-sm">{action.label}</div>
                    <div className="text-xs text-muted-foreground truncate">
                        {action.description}
                    </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </Button>
        </Link>
    );
}

function QuickStats() {
    const stats = [
        { label: "NV mới tháng", value: "+5", trend: "+2", positive: true },
        { label: "Tỷ lệ nghỉ việc", value: "2.5%", trend: "-0.5%", positive: true },
        { label: "Tổng quỹ lương", value: "2.4B", trend: "+3%", positive: true },
    ];
    
    return (
        <div className="grid grid-cols-3 gap-2">
            {stats.map((stat) => (
                <div 
                    key={stat.label}
                    className="text-center p-2 rounded-lg bg-muted/50"
                >
                    <div className="text-xs text-muted-foreground truncate">
                        {stat.label}
                    </div>
                    <div className="flex items-center justify-center gap-1">
                        <span className="font-semibold text-sm">{stat.value}</span>
                        <TrendingUp className={`h-3 w-3 ${stat.positive ? 'text-green-500' : 'text-red-500'}`} />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function QuickActions() {
    return (
        <Card className="border shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Thao tác nhanh
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <QuickStats />
                <div className="grid grid-cols-2 gap-2 mt-3">
                    {quickActions.slice(0, 4).map((action) => (
                        <QuickActionButton key={action.id} action={action} />
                    ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {quickActions.slice(4).map((action) => (
                        <QuickActionButton key={action.id} action={action} />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
