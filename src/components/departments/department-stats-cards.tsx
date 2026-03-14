import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Building2,
    Users,
    CheckCircle,
    XCircle,
} from "lucide-react";
import type { DepartmentStats } from "../../app/(protected)/departments/types";

interface DepartmentStatsCardsProps {
    stats: DepartmentStats;
}

export function DepartmentStatsCards({ stats }: DepartmentStatsCardsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Tổng phòng ban
                    </CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {stats.totalDepartments}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        phòng ban
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Đang hoạt động
                    </CardTitle>
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-emerald-600">
                        {stats.activeDepartments}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        phòng ban
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Ngừng hoạt động
                    </CardTitle>
                    <XCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                        {stats.inactiveDepartments}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        phòng ban
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Tổng nhân viên
                    </CardTitle>
                    <Users className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                        {stats.totalEmployees}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        nhân viên
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
