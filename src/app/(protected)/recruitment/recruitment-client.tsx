"use client";

import { useQuery } from "@tanstack/react-query";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import {
    Users,
    Briefcase,
    Calendar,
    TrendingUp,
} from "lucide-react";

import { getRecruitmentStats } from "./actions";
import { JobPostingsClient } from "@/components/recruitment/job-postings";
import { CandidatesClient } from "@/components/recruitment/candidates";
import { InterviewsClient } from "@/components/recruitment/interviews";
import type { RecruitmentStats } from "./types";
import { cn } from "@/lib/utils";

function StatCard({
    title,
    value,
    icon: Icon,
    className,
}: {
    title: string;
    value: number;
    icon: React.ElementType;
    className?: string;
}) {
    return (
        <Card className={cn("hover:shadow-md transition-shadow py-0", className)}>
            <CardContent className="flex items-center gap-3 p-3">
                <div
                    className={cn(
                        "p-2 rounded-lg shrink-0",
                        className?.includes("yellow")
                            ? "bg-yellow-100 text-yellow-600"
                            : className?.includes("green")
                              ? "bg-green-100 text-green-600"
                              : className?.includes("blue")
                                ? "bg-blue-100 text-blue-600"
                                : "bg-slate-100 text-slate-600",
                    )}
                >
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <div className="text-2xl font-bold">{value}</div>
                    <p className="text-xs text-muted-foreground">{title}</p>
                </div>
            </CardContent>
        </Card>
    );
}

export function RecruitmentClient() {
    const { data: stats } = useQuery<RecruitmentStats>({
        queryKey: ["recruitment", "stats"],
        queryFn: getRecruitmentStats,
    });

    return (
        <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
            {/* ─── Header ─── */}
            <div className="shrink-0 border-b h-10 p-2 flex items-center">
                <h1 className="font-bold text-base">Tuyển dụng</h1>
            </div>

            {/* ─── Stats Row ─── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-2 border-b bg-muted/20">
                <StatCard
                    title="Tin tuyển dụng"
                    value={stats?.totalJobPostings || 0}
                    icon={Briefcase}
                    className="blue"
                />
                <StatCard
                    title="Ứng viên"
                    value={stats?.totalCandidates || 0}
                    icon={Users}
                    className="yellow"
                />
                <StatCard
                    title="Lịch phỏng vấn"
                    value={stats?.totalInterviews || 0}
                    icon={Calendar}
                />
                <StatCard
                    title="Tuyển tháng này"
                    value={stats?.hiredThisMonth || 0}
                    icon={TrendingUp}
                    className="green"
                />
            </div>

            {/* ─── Tabs ─── */}
            <Tabs defaultValue="job-postings" className="flex-1 flex flex-col min-h-0">
                <TabsList className="w-full justify-start rounded-none border-b bg-background px-2 h-9">
                    <TabsTrigger value="job-postings" className="text-xs">
                        Tin tuyển dụng
                    </TabsTrigger>
                    <TabsTrigger value="candidates" className="text-xs">
                        Ứng viên
                    </TabsTrigger>
                    <TabsTrigger value="interviews" className="text-xs">
                        Lịch phỏng vấn
                    </TabsTrigger>
                </TabsList>

                <div className="flex-1 min-h-0 overflow-auto p-2">
                    <TabsContent value="job-postings" className="mt-0 h-full">
                        <JobPostingsClient />
                    </TabsContent>

                    <TabsContent value="candidates" className="mt-0 h-full">
                        <CandidatesClient />
                    </TabsContent>

                    <TabsContent value="interviews" className="mt-0 h-full">
                        <InterviewsClient />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
