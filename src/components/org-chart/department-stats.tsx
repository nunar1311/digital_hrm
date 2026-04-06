"use client";

import { Users, Briefcase, FolderTree } from "lucide-react";

interface DepartmentStatsProps {
    employeeCount: number;
    positionCount: number;
    childrenCount: number;
}

export function DepartmentStats({
    employeeCount,
    positionCount,
    childrenCount,
}: DepartmentStatsProps) {
    return (
        <div className="grid grid-cols-3 gap-3">
            <StatMini
                icon={Users}
                label="Nhân viên"
                value={employeeCount}
            />
            <StatMini
                icon={Briefcase}
                label="Vị trí"
                value={positionCount}
            />
            <StatMini
                icon={FolderTree}
                label="Phòng con"
                value={childrenCount}
            />
        </div>
    );
}

interface StatMiniProps {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: number;
}

function StatMini({ icon: Icon, label, value }: StatMiniProps) {
    return (
        <div className="p-3 rounded-lg bg-muted/50 border text-center">
            <Icon className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
            <p className="text-lg font-bold">{value}</p>
            <p className="text-[10px] text-muted-foreground">{label}</p>
        </div>
    );
}
