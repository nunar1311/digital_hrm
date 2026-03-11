"use client";

import {
    PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Banknote } from 'lucide-react';
import { formatVND } from '@/mock/helpers';
import type { ReactNode } from 'react';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#facc15', '#22c55e', '#0ea5e9'];

interface DashboardChartsProps {
    departmentDistribution: Record<string, unknown>[];
    monthlyHeadcount: Record<string, unknown>[];
    genderDistribution: Record<string, unknown>[];
    ageDistribution: Record<string, unknown>[];
    seniorityDistribution: Record<string, unknown>[];
    payrollSummary: Record<string, unknown>[];
    totalPayroll: number;
    upcomingEventsSlot: ReactNode;
}

export default function DashboardCharts({
    departmentDistribution,
    monthlyHeadcount,
    genderDistribution,
    ageDistribution,
    seniorityDistribution,
    payrollSummary,
    totalPayroll,
    upcomingEventsSlot
}: DashboardChartsProps) {
    return (
        <>
            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Headcount Distribution */}
                <Card className="col-span-1 border shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Phân bố phòng ban</CardTitle>
                        <CardDescription>Tỉ lệ nhân sự theo từng phòng ban</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[320px] w-full">
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
                                            <Cell key={`cell-${index}`} fill={(entry.color as string) || COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        formatter={(value: any) => [`${value} người`, 'Số lượng']}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
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

            {/* Demographics Row */}
            <div>
                <h2 className="text-xl font-semibold tracking-tight mb-4">Thống kê nhân khẩu học</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Gender */}
                    <Card className="border shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base">Giới tính</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={genderDistribution}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            paddingAngle={2}
                                            dataKey="value"
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            label={({ percent }: any) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                                            labelLine={false}
                                        >
                                            {genderDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={(entry.color as string) || COLORS[index % COLORS.length]} />
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

                    {/* Age */}
                    <Card className="border shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base">Độ tuổi</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={ageDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                                        <XAxis dataKey="range" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                                        <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            formatter={(value: any) => [`${value} người`, 'Số lượng']}
                                            cursor={{ fill: 'transparent' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
                                            {ageDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={(entry.color as string) || COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Seniority */}
                    <Card className="border shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base">Thâm niên</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={seniorityDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                                        <XAxis dataKey="range" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                                        <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            formatter={(value: any) => [`${value} người`, 'Số lượng']}
                                            cursor={{ fill: 'transparent' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
                                            {seniorityDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={(entry.color as string) || COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>
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
                                    <p className="text-xl font-bold">{formatVND(totalPayroll)}</p>
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
                {upcomingEventsSlot}
            </div>
        </>
    );
}
