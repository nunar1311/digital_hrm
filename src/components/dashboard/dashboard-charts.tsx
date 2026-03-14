"use client";

import {
    PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Banknote } from 'lucide-react';
import { formatVND } from '@/mock/helpers';
import type { ReactNode } from 'react';
import type { DashboardItemId } from "@/hooks/use-dashboard-preferences";

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#facc15', '#22c55e', '#0ea5e9'];

export function DepartmentChart({
    data,
    isCustomizing,
    id,
    isVisible,
    onToggleVisibility,
}: {
    data: Record<string, unknown>[];
    isCustomizing: boolean;
    id: DashboardItemId;
    isVisible: boolean;
    onToggleVisibility: (id: DashboardItemId) => void;
}) {
    if (!isVisible) return null;

    const CardInner = () => (
        <Card className="border shadow-sm">
            <CardHeader>
                <CardTitle className="text-lg">Phan bo phong ban</CardTitle>
                <CardDescription>Ti le nhan su theo tung phong ban</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
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
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={(entry.color as string) || COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                formatter={(value: any) => [`${value} nguoi`, 'So luong']}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );

    if (isCustomizing) {
        const { CardWrapper } = require('./card-wrapper');
        return (
            <CardWrapper
                id={id}
                title="Phan bo phong ban"
                isCustomizing={isCustomizing}
                isVisible={isVisible}
                onToggleVisibility={onToggleVisibility}
                className="col-span-1"
            >
                <CardInner />
            </CardWrapper>
        );
    }

    return <div className="col-span-1"><CardInner /></div>;
}

export function HeadcountChart({
    data,
    isCustomizing,
    id,
    isVisible,
    onToggleVisibility,
}: {
    data: Record<string, unknown>[];
    isCustomizing: boolean;
    id: DashboardItemId;
    isVisible: boolean;
    onToggleVisibility: (id: DashboardItemId) => void;
}) {
    if (!isVisible) return null;

    const CardInner = () => (
        <Card className="border shadow-sm">
            <CardHeader>
                <CardTitle className="text-lg">Bien dong nhan su (12 Thang)</CardTitle>
                <CardDescription>So luong nhan su dang lam viec so voi tuyen moi va nghi viec</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                                labelFormatter={(label) => `Thang ${label}`}
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                formatter={(value: any, name: any) => {
                                    if (name === "employees") return [`${value} nguoi`, 'Tong nhan su'];
                                    if (name === "newHires") return [`${value} nguoi`, 'Tuyen moi'];
                                    if (name === "resigned") return [`${value} nguoi`, 'Nghi viec'];
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
    );

    if (isCustomizing) {
        const { CardWrapper } = require('./card-wrapper');
        return (
            <CardWrapper
                id={id}
                title="Bien dong nhan su"
                isCustomizing={isCustomizing}
                isVisible={isVisible}
                onToggleVisibility={onToggleVisibility}
                className="col-span-1 lg:col-span-2"
            >
                <CardInner />
            </CardWrapper>
        );
    }

    return <div className="col-span-1 lg:col-span-2"><CardInner /></div>;
}

export function GenderChart({
    data,
    isCustomizing,
    id,
    isVisible,
    onToggleVisibility,
}: {
    data: Record<string, unknown>[];
    isCustomizing: boolean;
    id: DashboardItemId;
    isVisible: boolean;
    onToggleVisibility: (id: DashboardItemId) => void;
}) {
    if (!isVisible) return null;

    const CardInner = () => (
        <Card className="border shadow-sm">
            <CardHeader>
                <CardTitle className="text-base">Gioi tinh</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
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
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={(entry.color as string) || COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                formatter={(value: any) => [`${value} nguoi`, 'So luong']}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );

    if (isCustomizing) {
        const { CardWrapper } = require('./card-wrapper');
        return (
            <CardWrapper
                id={id}
                title="Gioi tinh"
                isCustomizing={isCustomizing}
                isVisible={isVisible}
                onToggleVisibility={onToggleVisibility}
            >
                <CardInner />
            </CardWrapper>
        );
    }

    return <CardInner />;
}

export function AgeChart({
    data,
    isCustomizing,
    id,
    isVisible,
    onToggleVisibility,
}: {
    data: Record<string, unknown>[];
    isCustomizing: boolean;
    id: DashboardItemId;
    isVisible: boolean;
    onToggleVisibility: (id: DashboardItemId) => void;
}) {
    if (!isVisible) return null;

    const CardInner = () => (
        <Card className="border shadow-sm">
            <CardHeader>
                <CardTitle className="text-base">Do tuoi</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                            <XAxis dataKey="range" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                            <Tooltip
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                formatter={(value: any) => [`${value} nguoi`, 'So luong']}
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={(entry.color as string) || COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );

    if (isCustomizing) {
        const { CardWrapper } = require('./card-wrapper');
        return (
            <CardWrapper
                id={id}
                title="Do tuoi"
                isCustomizing={isCustomizing}
                isVisible={isVisible}
                onToggleVisibility={onToggleVisibility}
            >
                <CardInner />
            </CardWrapper>
        );
    }

    return <CardInner />;
}

export function SeniorityChart({
    data,
    isCustomizing,
    id,
    isVisible,
    onToggleVisibility,
}: {
    data: Record<string, unknown>[];
    isCustomizing: boolean;
    id: DashboardItemId;
    isVisible: boolean;
    onToggleVisibility: (id: DashboardItemId) => void;
}) {
    if (!isVisible) return null;

    const CardInner = () => (
        <Card className="border shadow-sm">
            <CardHeader>
                <CardTitle className="text-base">Tham nien</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                            <XAxis dataKey="range" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                            <Tooltip
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                formatter={(value: any) => [`${value} nguoi`, 'So luong']}
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={(entry.color as string) || COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );

    if (isCustomizing) {
        const { CardWrapper } = require('./card-wrapper');
        return (
            <CardWrapper
                id={id}
                title="Tham nien"
                isCustomizing={isCustomizing}
                isVisible={isVisible}
                onToggleVisibility={onToggleVisibility}
            >
                <CardInner />
            </CardWrapper>
        );
    }

    return <CardInner />;
}

export function PayrollSummaryChart({
    data,
    totalPayroll,
    isCustomizing,
    id,
    isVisible,
    onToggleVisibility,
}: {
    data: Record<string, unknown>[];
    totalPayroll: number;
    isCustomizing: boolean;
    id: DashboardItemId;
    isVisible: boolean;
    onToggleVisibility: (id: DashboardItemId) => void;
}) {
    if (!isVisible) return null;

    const CardInner = () => (
        <Card className="border shadow-sm">
            <CardHeader>
                <CardTitle className="text-lg">Tong hop Quy luong</CardTitle>
                <CardDescription>Quy luong thuc chi 12 thang gan nhat</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center space-x-4 mb-4">
                    <div className="flex items-center p-3 bg-primary/10 rounded-lg">
                        <Banknote className="h-8 w-8 text-primary mr-3" />
                        <div>
                            <p className="text-sm text-muted-foreground">Thang hien tai</p>
                            <p className="text-xl font-bold">{formatVND(totalPayroll)}</p>
                        </div>
                    </div>
                </div>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                            <YAxis
                                tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                                tick={{ fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                labelFormatter={(label) => `Thang ${label}`}
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                formatter={(value: any) => {
                                    return [formatVND(value as number), 'Thuc chi'];
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
    );

    if (isCustomizing) {
        const { CardWrapper } = require('./card-wrapper');
        return (
            <CardWrapper
                id={id}
                title="Tong hop Quy luong"
                isCustomizing={isCustomizing}
                isVisible={isVisible}
                onToggleVisibility={onToggleVisibility}
                className="col-span-1 lg:col-span-2"
            >
                <CardInner />
            </CardWrapper>
        );
    }

    return <div className="col-span-1 lg:col-span-2"><CardInner /></div>;
}

interface DashboardChartsProps {
    departmentDistribution: Record<string, unknown>[];
    monthlyHeadcount: Record<string, unknown>[];
    genderDistribution: Record<string, unknown>[];
    ageDistribution: Record<string, unknown>[];
    seniorityDistribution: Record<string, unknown>[];
    payrollSummary: Record<string, unknown>[];
    totalPayroll: number;
    upcomingEventsSlot: ReactNode;
    isCustomizing?: boolean;
    hiddenItems?: DashboardItemId[];
    onToggleVisibility?: (id: DashboardItemId) => void;
}

export default function DashboardCharts({
    departmentDistribution,
    monthlyHeadcount,
    genderDistribution,
    ageDistribution,
    seniorityDistribution,
    payrollSummary,
    totalPayroll,
    upcomingEventsSlot,
    isCustomizing = false,
    hiddenItems = [],
    onToggleVisibility,
}: DashboardChartsProps) {
    const isVisible = (id: string) => !hiddenItems.includes(id);

    return (
        <>
            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <DepartmentChart
                    data={departmentDistribution}
                    isCustomizing={isCustomizing}
                    id="chart-department"
                    isVisible={isVisible("chart-department")}
                    onToggleVisibility={onToggleVisibility!}
                />
                <HeadcountChart
                    data={monthlyHeadcount}
                    isCustomizing={isCustomizing}
                    id="chart-headcount"
                    isVisible={isVisible("chart-headcount")}
                    onToggleVisibility={onToggleVisibility!}
                />
            </div>

            {/* Demographics Row */}
            <div>
                <h2 className="text-xl font-semibold tracking-tight mb-4">Thong ke nhan khau hoc</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <GenderChart
                        data={genderDistribution}
                        isCustomizing={isCustomizing}
                        id="demo-gender"
                        isVisible={isVisible("demo-gender")}
                        onToggleVisibility={onToggleVisibility!}
                    />
                    <AgeChart
                        data={ageDistribution}
                        isCustomizing={isCustomizing}
                        id="demo-age"
                        isVisible={isVisible("demo-age")}
                        onToggleVisibility={onToggleVisibility!}
                    />
                    <SeniorityChart
                        data={seniorityDistribution}
                        isCustomizing={isCustomizing}
                        id="demo-seniority"
                        isVisible={isVisible("demo-seniority")}
                        onToggleVisibility={onToggleVisibility!}
                    />
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <PayrollSummaryChart
                    data={payrollSummary}
                    totalPayroll={totalPayroll}
                    isCustomizing={isCustomizing}
                    id="payroll-summary"
                    isVisible={isVisible("payroll-summary")}
                    onToggleVisibility={onToggleVisibility!}
                />
                {isCustomizing ? (
                    <div className="col-span-1">
                        {upcomingEventsSlot}
                    </div>
                ) : (
                    upcomingEventsSlot
                )}
            </div>
        </>
    );
}
