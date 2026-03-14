"use client";

import { useState, useMemo } from "react";
import {
    useQuery,
} from "@tanstack/react-query";
import { format, subMonths, startOfMonth, endOfMonth, subYears } from "date-fns";
import { vi } from "date-fns/locale";
import { 
    BarChart3, 
    TrendingUp, 
    Users, 
    UserCheck, 
    UserX, 
    Clock,
    Download,
    Calendar,
    Filter
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import {
    getRecruitmentStats,
    getJobPostings,
    getCandidates,
    getInterviews,
} from "@/app/(protected)/recruitment/actions";
import type {
    RecruitmentStats,
    JobPostingBasic,
    CandidateBasic,
    InterviewBasic,
} from "@/app/(protected)/recruitment/types";
import {
    CANDIDATE_STAGE,
    CANDIDATE_SOURCE,
} from "@/app/(protected)/recruitment/constants";

interface ReportsClientProps {
    initialStats: RecruitmentStats;
    initialJobPostings: JobPostingBasic[];
    initialCandidates: CandidateBasic[];
    initialInterviews: InterviewBasic[];
}

export function RecruitmentReportsClient({
    initialStats,
    initialJobPostings,
    initialCandidates,
    initialInterviews,
}: ReportsClientProps) {
    const [selectedPeriod, setSelectedPeriod] = useState("this_month");
    const [selectedJobPosting, setSelectedJobPosting] = useState<string>("all");

    const { data: statsData } = useQuery({
        queryKey: ["recruitment", "stats"],
        queryFn: getRecruitmentStats,
        initialData: initialStats,
    });

    const { data: candidatesData } = useQuery({
        queryKey: ["recruitment", "candidates"],
        queryFn: () => getCandidates({}, { limit: 1000 }),
        initialData: { items: initialCandidates, total: initialCandidates.length, page: 1, limit: 100, totalPages: 1 },
    });

    const { data: interviewsData } = useQuery({
        queryKey: ["recruitment", "interviews"],
        queryFn: () => getInterviews({}, { limit: 1000 }),
        initialData: { items: initialInterviews, total: initialInterviews.length, page: 1, limit: 100, totalPages: 1 },
    });

    const stageDistribution = useMemo(() => {
        const distribution: Record<string, number> = {
            APPLIED: 0,
            SCREENING: 0,
            INTERVIEW: 0,
            OFFER: 0,
            HIRED: 0,
            REJECTED: 0,
        };
        candidatesData.items.forEach(candidate => {
            if (distribution[candidate.stage] !== undefined) {
                distribution[candidate.stage]++;
            }
        });
        return distribution;
    }, [candidatesData.items]);

    const sourceDistribution = useMemo(() => {
        const distribution: Record<string, number> = {};
        candidatesData.items.forEach(candidate => {
            distribution[candidate.source] = (distribution[candidate.source] || 0) + 1;
        });
        return distribution;
    }, [candidatesData.items]);

    const hiringRate = useMemo(() => {
        const total = candidatesData.items.length;
        const hired = stageDistribution.HIRED;
        return total > 0 ? ((hired / total) * 100).toFixed(1) : "0";
    }, [candidatesData.items, stageDistribution]);

    const interviewRate = useMemo(() => {
        const total = candidatesData.items.length;
        const interviewed = stageDistribution.INTERVIEW + stageDistribution.OFFER + stageDistribution.HIRED;
        return total > 0 ? ((interviewed / total) * 100).toFixed(1) : "0";
    }, [candidatesData.items, stageDistribution]);

    const rejectionRate = useMemo(() => {
        const total = candidatesData.items.length;
        const rejected = stageDistribution.REJECTED;
        return total > 0 ? ((rejected / total) * 100).toFixed(1) : "0";
    }, [candidatesData.items, stageDistribution]);

    const offerAcceptanceRate = useMemo(() => {
        const offers = stageDistribution.OFFER + stageDistribution.HIRED;
        const hired = stageDistribution.HIRED;
        return offers > 0 ? ((hired / offers) * 100).toFixed(1) : "0";
    }, [stageDistribution]);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">Báo cáo tuyển dụng</h2>
                    <p className="text-sm text-muted-foreground">
                        Thống kê và phân tích quy trình tuyển dụng
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <Select
                        value={selectedPeriod}
                        onValueChange={setSelectedPeriod}
                    >
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Chọn thời gian" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="this_week">Tuần này</SelectItem>
                            <SelectItem value="this_month">Tháng này</SelectItem>
                            <SelectItem value="last_month">Tháng trước</SelectItem>
                            <SelectItem value="this_quarter">Quý này</SelectItem>
                            <SelectItem value="this_year">Năm này</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={selectedJobPosting}
                        onValueChange={setSelectedJobPosting}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Tất cả vị trí" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả vị trí</SelectItem>
                            {initialJobPostings.map((posting) => (
                                <SelectItem key={posting.id} value={posting.id}>
                                    {posting.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Tổng ứng viên
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{candidatesData.total}</div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Users className="h-3 w-3" />
                            {statsData.activeCandidates} đang active
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Tỷ lệ tuyển dụng
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{hiringRate}%</div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <TrendingUp className="h-3 w-3 text-green-500" />
                            {stageDistribution.HIRED} đã tuyển
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Tỷ lệ phỏng vấn
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{interviewRate}%</div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <UserCheck className="h-3 w-3 text-blue-500" />
                            {stageDistribution.INTERVIEW} phỏng vấn
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Tỷ lệ từ chối
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{rejectionRate}%</div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <UserX className="h-3 w-3 text-red-500" />
                            {stageDistribution.REJECTED} từ chối
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Stage Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Phân bổ theo giai đoạn</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {Object.entries(CANDIDATE_STAGE).map(([key, value]) => {
                                const count = stageDistribution[key] || 0;
                                const percentage = candidatesData.total > 0 
                                    ? ((count / candidatesData.total) * 100).toFixed(1) 
                                    : "0";
                                return (
                                    <div key={key} className="flex items-center gap-3">
                                        <div className="w-24 text-sm">{value.label}</div>
                                        <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-primary rounded-full transition-all"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                        <div className="w-16 text-sm text-right">{count}</div>
                                        <div className="w-12 text-xs text-muted-foreground text-right">{percentage}%</div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Source Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Phân bổ theo nguồn</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {Object.entries(CANDIDATE_SOURCE).map(([key, value]) => {
                                const count = sourceDistribution[key] || 0;
                                const percentage = candidatesData.total > 0 
                                    ? ((count / candidatesData.total) * 100).toFixed(1) 
                                    : "0";
                                return (
                                    <div key={key} className="flex items-center gap-3">
                                        <div className="w-24 text-sm">{value.label}</div>
                                        <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-secondary rounded-full transition-all"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                        <div className="w-16 text-sm text-right">{count}</div>
                                        <div className="w-12 text-xs text-muted-foreground text-right">{percentage}%</div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Tin tuyển dụng đang mở
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{statsData.openJobPostings}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                            / {statsData.totalJobPostings} tổng tin
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Phỏng vấn sắp tới
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{statsData.upcomingInterviews}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                            / {statsData.totalInterviews} tổng PV
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Tuyển dụng tháng này
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{statsData.hiredThisMonth}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                            người
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Job Posting Performance */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Hiệu suất tin tuyển dụng</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {initialJobPostings.slice(0, 5).map((posting) => {
                            const postingCandidates = candidatesData.items.filter(
                                c => c.jobPostingId === posting.id
                            );
                            const hired = postingCandidates.filter(c => c.stage === "HIRED").length;
                            const inProgress = postingCandidates.filter(
                                c => ["SCREENING", "INTERVIEW", "OFFER"].includes(c.stage)
                            ).length;
                            
                            return (
                                <div key={posting.id} className="flex items-center gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{posting.title}</div>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <span>{postingCandidates.length} ứng viên</span>
                                            <span>{inProgress} đang xử lý</span>
                                            <span className="text-green-600">{hired} đã tuyển</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-green-500 rounded-full"
                                                style={{ width: `${posting.headcount > 0 ? (hired / posting.headcount) * 100 : 0}%` }}
                                            />
                                        </div>
                                        <div className="text-sm text-muted-foreground w-16 text-right">
                                            {hired}/{posting.headcount}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
