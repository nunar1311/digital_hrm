import DashboardClient from "@/components/dashboard/dashboard-client";
import {
  getDashboardStats,
  getDashboardEmployees,
  getAttendanceTrend,
  getDepartmentDistribution,
  getTurnoverRateTrend,
  getGenderDistribution,
  getTodayAttendanceSummary,
  getContractExpiryWarnings,
} from "./actions";
import { getDashboardLayout } from "./dashboard-layout-actions";

const PAGE_SIZE = 20;

export default async function DashboardPage() {
  const [
    stats,
    initialEmployees,
    attendanceTrendData,
    departmentData,
    turnoverTrendData,
    genderData,
    todayAttendanceData,
    contractExpiryWarnings,
    savedGridLayout,
  ] = await Promise.all([
    getDashboardStats(),
    getDashboardEmployees({ page: 1, pageSize: PAGE_SIZE }),
    getAttendanceTrend(),
    getDepartmentDistribution(),
    getTurnoverRateTrend(),
    getGenderDistribution(),
    getTodayAttendanceSummary(),
    getContractExpiryWarnings(),
    getDashboardLayout(),
  ]);

  return (
    <DashboardClient
      initialStats={stats}
      initialEmployees={initialEmployees}
      attendanceTrendData={attendanceTrendData}
      departmentData={departmentData}
      turnoverTrendData={turnoverTrendData}
      genderData={genderData}
      todayAttendanceData={todayAttendanceData}
      contractExpiryWarnings={contractExpiryWarnings}
      savedGridLayout={savedGridLayout}
    />
  );
}
