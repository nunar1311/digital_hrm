"use client";

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import {
    Users,
    UserPlus,
    CalendarOff,
    TrendingDown,
    Banknote,
    Calendar,
    Cake,
    ScrollText,
    CheckCircle2,
} from "lucide-react";
import {
    kpiData,
    departmentDistribution,
    monthlyHeadcount,
    payrollSummary,
    upcomingEvents,
    todayAttendance,
    genderDistribution,
    ageDistribution,
    seniorityDistribution,
} from "@/mock/dashboard";
import { Badge } from "@/components/ui/badge";
import { formatVND } from "@/mock/helpers";

const DashboardCharts = dynamic(() => import("@/components/dashboard/dashboard-charts"), {
    ssr: false,
    loading: () => <Skeleton className="w-full h-[600px] rounded-lg mt-6" />
});

export default function DashboardPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Tổng quan</h1>
                <p className="text-muted-foreground">
                    Báo cáo và thống kê nhân sự tổng quát
                </p>
            </div>

            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Tổng nhân sự</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpiData.totalEmployees}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Đang hoạt động trên hệ thống
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Nhân sự mới (Tháng này)</CardTitle>
                        <UserPlus className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpiData.newHiresThisMonth}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            <span className="text-green-500 font-medium">+2</span> so với tháng trước
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Vắng mặt hôm nay</CardTitle>
                        <CalendarOff className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{todayAttendance.absent + todayAttendance.onLeave}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {todayAttendance.onLeave} nghỉ phép, {todayAttendance.absent} không phép
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Tỷ lệ nghỉ việc (YTD)</CardTitle>
                        <TrendingDown className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpiData.turnoverRate}%</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            <span className="text-green-500 font-medium">-0.5%</span> so với cùng kỳ năm ngoái
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Chi phí lương (Tháng này)</CardTitle>
                        <Banknote className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatVND(kpiData.currentMonthPayroll)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Dự kiến thực chi
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Lazy Loaded Charts with Upcoming Events Passed Through */}
            <DashboardCharts
                departmentDistribution={departmentDistribution}
                monthlyHeadcount={monthlyHeadcount}
                genderDistribution={genderDistribution}
                ageDistribution={ageDistribution}
                seniorityDistribution={seniorityDistribution}
                payrollSummary={payrollSummary}
                totalPayroll={kpiData.totalPayroll}
                upcomingEventsSlot={
                    <Card className="col-span-1 border shadow-sm flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center">
                                <Calendar className="w-5 h-5 mr-2 text-primary" />
                                Sự kiện sắp tới
                            </CardTitle>
                            <CardDescription>Trong 30 ngày tới</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-auto">
                            <div className="space-y-4 pr-2">
                                {upcomingEvents.map((event, i) => (
                                    <div key={i} className="flex items-start pb-4 border-b last:border-0 last:pb-0">
                                        <div className={`mt-0.5 p-2 rounded-full mr-3 shrink-0 ${event.type === 'birthday' ? 'bg-pink-100 text-pink-500' :
                                            event.type === 'contract' ? 'bg-amber-100 text-amber-500' :
                                                event.type === 'probation' ? 'bg-blue-100 text-blue-500' :
                                                    'bg-green-100 text-green-500'
                                            }`}>
                                            {event.type === 'birthday' && <Cake className="w-4 h-4" />}
                                            {event.type === 'contract' && <ScrollText className="w-4 h-4" />}
                                            {event.type === 'probation' && <CheckCircle2 className="w-4 h-4" />}
                                            {event.type === 'anniversary' && <Users className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium leading-none mb-1 text-foreground">
                                                {event.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {event.description}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0 ml-2">
                                            <Badge variant="outline" className="text-[10px] font-normal">
                                                {new Date(event.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                }
            />
        </div>
    );
}
