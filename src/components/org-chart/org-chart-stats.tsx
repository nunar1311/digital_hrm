"use client";

import {
    Building2,
    Users,
    UserCircle,
    Briefcase,
} from "lucide-react";
import type { DepartmentNode } from "@/types/org-chart";

interface OrgChartStatsProps {
    data: DepartmentNode[];
}

function countAll(nodes: DepartmentNode[]): {
    departments: number;
    employees: number;
    managers: number;
    positions: number;
} {
    let departments = 0;
    let employees = 0;
    let managers = 0;
    let positions = 0;

    function traverse(items: DepartmentNode[]) {
        for (const node of items) {
            departments++;
            employees += node.employeeCount;
            positions += node.positionCount;
            if (node.manager) managers++;
            traverse(node.children);
        }
    }

    traverse(nodes);
    return { departments, employees, managers, positions };
}

export function OrgChartStats({ data }: OrgChartStatsProps) {
    const stats = countAll(data);

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
                icon={Building2}
                label="Phòng ban"
                value={stats.departments}
                color="text-blue-600"
                bgColor="bg-blue-50 dark:bg-blue-950"
            />
            <StatCard
                icon={Users}
                label="Nhân viên"
                value={stats.employees}
                color="text-emerald-600"
                bgColor="bg-emerald-50 dark:bg-emerald-950"
            />
            <StatCard
                icon={UserCircle}
                label="Quản lý"
                value={stats.managers}
                color="text-purple-600"
                bgColor="bg-purple-50 dark:bg-purple-950"
            />
            <StatCard
                icon={Briefcase}
                label="Vị trí"
                value={stats.positions}
                color="text-amber-600"
                bgColor="bg-amber-50 dark:bg-amber-950"
            />
        </div>
    );
}

interface StatCardProps {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: number;
    color: string;
    bgColor: string;
}

function StatCard({ icon: Icon, label, value, color, bgColor }: StatCardProps) {
    return (
        <div className="flex items-center gap-3 p-3 rounded-xl border bg-card">
            <div className={`p-2 rounded-lg ${bgColor}`}>
                <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <div>
                <p className="text-lg font-bold">{value.toLocaleString("vi-VN")}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
            </div>
        </div>
    );
}
