import DashboardClient from "@/components/dashboard/dashboard-client";
import {
    getDashboardStats,
    getDashboardEmployees,
    getAttendanceTrend,
    getDepartmentDistribution,
} from "./actions";

const PAGE_SIZE = 20;

export default async function DashboardPage() {
    const [stats, initialEmployees, attendanceTrendData, departmentData] =
        await Promise.all([
            getDashboardStats(),
            getDashboardEmployees({ page: 1, pageSize: PAGE_SIZE }),
            getAttendanceTrend(),
            getDepartmentDistribution(),
        ]);

    return (
        <DashboardClient
            initialStats={stats}
            initialEmployees={initialEmployees}
            attendanceTrendData={attendanceTrendData}
            departmentData={departmentData}
        />
    );
}
