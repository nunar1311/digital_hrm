"use client";

import { useTranslations } from "next-intl";
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
    const t = useTranslations("ProtectedPages");

    return (
        <div className="grid grid-cols-3 gap-3">
            <StatMini
                icon={Users}
                label={t("departmentsStatsEmployees")}
                value={employeeCount}
            />
            <StatMini
                icon={Briefcase}
                label={t("departmentsStatsPositions")}
                value={positionCount}
            />
            <StatMini
                icon={FolderTree}
                label={t("departmentsStatsChildren")}
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
