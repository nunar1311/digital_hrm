"use client";

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
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    AreaChart,
    Area,
    BarChart,
    Bar,
    CartesianGrid,
    XAxis,
    YAxis,
} from "recharts";
import {
    kpiData,
    departmentDistribution,
    monthlyHeadcount,
    payrollSummary,
    upcomingEvents,
    todayAttendance,
} from "@/mock/dashboard";
import { Badge } from "@/components/ui/badge";
import { formatVND } from "@/mock/helpers";

const COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#f59e0b", "#22c55e", "#ef4444"];

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Headcount Distribution */}
                <Card className="col-span-1 border shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Phân bố phòng ban</CardTitle>
                        <CardDescription>Tỉ lệ nhân sự theo từng phòng ban</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={departmentDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={2}
                                        dataKey="value"
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        label={({ percent }: any) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                                        labelLine={false}
                                    >
                                        {departmentDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        formatter={(value: any) => [`${value} người`, 'Số lượng']}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Headcount Trend */}
                <Card className="col-span-1 lg:col-span-2 border shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Biến động nhân sự (12 Tháng)</CardTitle>
                        <CardDescription>Số lượng nhân sự đang làm việc so với truyển mới và nghỉ việc</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={monthlyHeadcount} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorEmployees" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                                    <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                                    <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        labelFormatter={(label) => `Tháng ${label}`}
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        formatter={(value: any, name: any) => {
                                            if (name === "employees") return [`${value} người`, 'Tổng nhân sự'];
                                            if (name === "newHires") return [`${value} người`, 'Tuyển mới'];
                                            if (name === "resigned") return [`${value} người`, 'Nghỉ việc'];
                                            return [value as React.ReactNode, name];
                                        }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="employees" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorEmployees)" name="employees" />
                                    <Area type="monotone" dataKey="newHires" stroke="#22c55e" strokeWidth={2} fill="none" name="newHires" />
                                    <Area type="monotone" dataKey="resigned" stroke="#ef4444" strokeWidth={2} fill="none" name="resigned" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Payroll Summary */}
                <Card className="col-span-1 lg:col-span-2 border shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Tổng hợp Quỹ lương</CardTitle>
                        <CardDescription>Quỹ lương thực chi 12 tháng gần nhất</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-4 mb-4">
                            <div className="flex items-center p-3 bg-primary/10 rounded-lg">
                                <Banknote className="h-8 w-8 text-primary mr-3" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Tháng hiện tại</p>
                                    <p className="text-xl font-bold">{formatVND(kpiData.totalPayroll)}</p>
                                </div>
                            </div>
                        </div>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={payrollSummary} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                                    <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                                    <YAxis
                                        tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                                        tick={{ fontSize: 12 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        labelFormatter={(label) => `Tháng ${label}`}
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        formatter={(value: any) => {
                                            return [formatVND(value as number), 'Thực chi'];
                                        }}
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="totalPayroll" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Upcoming Events */}
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
            </div>
        </div>
    );
}
