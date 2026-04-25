"use client";

import { useQuery } from "@tanstack/react-query";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Users,
    Briefcase,
    Calendar,
    UserCheck,
    ArrowRight,
    Clock,
    BarChart3,
    TrendingUp,
    ChevronRight,
    Sparkles,
    Target,
    Zap,
} from "lucide-react";
import Link from "next/link";
import { getRecruitmentStats, getCandidates, getInterviews } from "./actions";
import type { RecruitmentStats, CandidateBasic, InterviewBasic } from "./types";
import { cn } from "@/lib/utils";
import { format, parseISO, isAfter, addDays } from "date-fns";
import { vi } from "date-fns/locale";

// ─── Stage Config ───
const STAGE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    APPLIED: { label: "Ứng tuyển", color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800" },
    SCREENING: { label: "Sàng lọc", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/50" },
    INTERVIEW: { label: "Phỏng vấn", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/50" },
    OFFER: { label: "Đề xuất", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/50" },
    HIRED: { label: "Đã tuyển", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/50" },
    REJECTED: { label: "Từ chối", color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/50" },
};

// ─── Compact Stat Card ───
function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    iconColor,
    iconBg,
}: {
    title: string;
    value: number | string;
    subtitle?: string;
    icon: React.ElementType;
    iconColor: string;
    iconBg: string;
}) {
    return (
        <Card className="py-0 gap-0 border shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="flex items-center gap-3 p-3">
                <div className={cn("p-2 rounded-lg shrink-0", iconBg)}>
                    <Icon className={cn("h-4 w-4", iconColor)} />
                </div>
                <div className="min-w-0">
                    <div className="text-xl font-bold leading-tight">{value}</div>
                    <p className="text-[11px] text-muted-foreground truncate">{title}</p>
                    {subtitle && (
                        <p className="text-[10px] text-muted-foreground/70 truncate">{subtitle}</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Quick Action Card Color Config ───
const ACTION_COLORS: Record<string, { bg: string; icon: string }> = {
    blue: { bg: "bg-blue-50 dark:bg-blue-950/40", icon: "text-blue-500" },
    indigo: { bg: "bg-indigo-50 dark:bg-indigo-950/40", icon: "text-indigo-500" },
    amber: { bg: "bg-amber-50 dark:bg-amber-950/40", icon: "text-amber-500" },
    emerald: { bg: "bg-emerald-50 dark:bg-emerald-950/40", icon: "text-emerald-500" },
};

// ─── Quick Action Card ───
function QuickActionCard({
    title,
    description,
    icon: Icon,
    href,
    count,
    color,
}: {
    title: string;
    description: string;
    icon: React.ElementType;
    href: string;
    count?: number;
    color: string;
}) {
    const colorConfig = ACTION_COLORS[color] || ACTION_COLORS.blue;

    return (
        <Link href={href}>
            <Card className="py-0 gap-0 border hover:shadow-md hover:border-primary/20 transition-all duration-200 cursor-pointer group h-full">
                <CardContent className="p-3.5 flex flex-col gap-2.5 h-full">
                    <div className="flex items-start justify-between">
                        <div className={cn("p-2 rounded-lg", colorConfig.bg)}>
                            <Icon className={cn("h-4 w-4", colorConfig.icon)} />
                        </div>
                        {count !== undefined && count > 0 && (
                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-semibold">
                                {count}
                            </Badge>
                        )}
                    </div>
                    <div>
                        <p className="text-sm font-semibold group-hover:text-primary transition-colors">{title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
                    </div>
                    <div className="mt-auto flex items-center text-[11px] text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Xem chi tiết
                        <ChevronRight className="h-3 w-3 ml-0.5" />
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

// ─── Pipeline Funnel Bar ───
function PipelineFunnel({ candidates }: { candidates: CandidateBasic[] }) {
    const stageCounts: Record<string, number> = {};
    const stages = ["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "HIRED"];

    stages.forEach(s => { stageCounts[s] = 0; });
    candidates.forEach(c => {
        if (stages.includes(c.stage)) {
            stageCounts[c.stage] = (stageCounts[c.stage] || 0) + 1;
        }
    });

    const total = candidates.filter(c => stages.includes(c.stage)).length;
    if (total === 0) {
        return (
            <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 mr-2 opacity-50" />
                Chưa có ứng viên trong pipeline
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Funnel bars */}
            <div className="flex items-end gap-1 h-16">
                {stages.map((stage) => {
                    const count = stageCounts[stage] || 0;
                    const pct = total > 0 ? Math.max((count / total) * 100, 4) : 4;
                    const config = STAGE_CONFIG[stage];
                    return (
                        <div key={stage} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-xs font-bold">{count}</span>
                            <div
                                className={cn(
                                    "w-full rounded-t-md transition-all duration-500",
                                    config.bg,
                                    "border border-b-0",
                                )}
                                style={{ height: `${pct}%`, minHeight: "8px" }}
                            />
                        </div>
                    );
                })}
            </div>
            {/* Labels */}
            <div className="flex gap-1">
                {stages.map((stage, i) => {
                    const config = STAGE_CONFIG[stage];
                    return (
                        <div key={stage} className="flex-1 flex items-center justify-center">
                            <span className={cn("text-[10px] font-medium truncate", config.color)}>
                                {config.label}
                            </span>
                            {i < stages.length - 1 && (
                                <ArrowRight className="h-2.5 w-2.5 text-muted-foreground/30 ml-0.5 shrink-0" />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Recent Candidate Row ───
function CandidateRow({ candidate }: { candidate: CandidateBasic }) {
    const config = STAGE_CONFIG[candidate.stage] || STAGE_CONFIG.APPLIED;
    const initials = candidate.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <div className="flex items-center gap-3 py-2 px-1 hover:bg-muted/50 rounded-md transition-colors group">
            <Avatar className="h-7 w-7 shrink-0">
                <AvatarFallback className="text-[10px] font-medium bg-primary/10 text-primary">
                    {initials}
                </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{candidate.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                    {candidate.jobPostingTitle || candidate.email}
                </p>
            </div>
            <Badge variant="outline" className={cn("text-[10px] shrink-0 h-5", config.color, config.bg, "border-0")}>
                {config.label}
            </Badge>
        </div>
    );
}

// ─── Interview Row ───
function InterviewRow({ interview }: { interview: InterviewBasic }) {
    let dateStr = "";
    try {
        dateStr = format(parseISO(interview.scheduledDate), "dd/MM", { locale: vi });
    } catch {
        dateStr = "—";
    }

    return (
        <div className="flex items-center gap-3 py-2 px-1 hover:bg-muted/50 rounded-md transition-colors">
            <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/5 border flex flex-col items-center justify-center">
                <span className="text-[10px] text-muted-foreground leading-none">{dateStr.split("/")[1]}</span>
                <span className="text-sm font-bold leading-tight">{dateStr.split("/")[0]}</span>
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{interview.candidateName || "—"}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                    {interview.scheduledTime} · {interview.jobPostingTitle || "—"}
                </p>
            </div>
            <Badge
                variant="outline"
                className={cn(
                    "text-[10px] shrink-0 h-5 border-0",
                    interview.status === "SCHEDULED" && "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
                    interview.status === "IN_PROGRESS" && "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
                    interview.status === "COMPLETED" && "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
                )}
            >
                {interview.status === "SCHEDULED" ? "Sắp tới" :
                    interview.status === "IN_PROGRESS" ? "Đang PV" :
                        interview.status === "COMPLETED" ? "Xong" : interview.status}
            </Badge>
        </div>
    );
}

// ─── Main Component ───
export function RecruitmentClient() {
    const { data: stats, isLoading: statsLoading } = useQuery<RecruitmentStats>({
        queryKey: ["recruitment", "stats"],
        queryFn: getRecruitmentStats,
    });

    const { data: candidatesData } = useQuery({
        queryKey: ["recruitment", "candidates", "dashboard"],
        queryFn: () => getCandidates({}, { limit: 50 }),
    });

    const { data: interviewsData } = useQuery({
        queryKey: ["recruitment", "interviews", "dashboard"],
        queryFn: () => getInterviews({}, { limit: 30 }),
    });

    const candidates = candidatesData?.items ?? [];
    const interviews = interviewsData?.items ?? [];

    // Recent candidates (sorted by createdAt desc)
    const recentCandidates = [...candidates]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 8);

    // Upcoming interviews (scheduled, sorted by date asc)
    const now = new Date();
    const upcomingInterviews = [...interviews]
        .filter(i => {
            try {
                return i.status === "SCHEDULED" && isAfter(parseISO(i.scheduledDate), addDays(now, -1));
            } catch { return false; }
        })
        .sort((a, b) => {
            try {
                return parseISO(a.scheduledDate).getTime() - parseISO(b.scheduledDate).getTime();
            } catch { return 0; }
        })
        .slice(0, 6);

    const loading = statsLoading;
    const val = (v: number | undefined) => loading ? "—" : (v ?? 0);

    return (
        <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
            {/* ─── Header ─── */}
            <section>
                <header className="p-2 flex items-center h-10 border-b">
                    <h1 className="font-bold flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Tổng quan Tuyển dụng
                    </h1>
                    <div className="ml-auto flex items-center gap-1.5">
                        <Button variant="outline" size="xs" asChild>
                            <Link href="/recruitment/reports">
                                <BarChart3 className="h-3.5 w-3.5 mr-1" />
                                Báo cáo
                            </Link>
                        </Button>
                        <Button size="xs" asChild>
                            <Link href="/recruitment/candidates">
                                <Users className="h-3.5 w-3.5 mr-1" />
                                Thêm Ứng viên
                            </Link>
                        </Button>
                    </div>
                </header>
            </section>

            {/* ─── Stats Row ─── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-2 border-b bg-muted/20">
                <StatCard
                    title="Tin đang tuyển"
                    value={val(stats?.openJobPostings)}
                    subtitle={`/ ${val(stats?.totalJobPostings)} tổng tin`}
                    icon={Briefcase}
                    iconColor="text-blue-600"
                    iconBg="bg-blue-100 dark:bg-blue-900/50"
                />
                <StatCard
                    title="Ứng viên đang xử lý"
                    value={val(stats?.activeCandidates)}
                    subtitle={`/ ${val(stats?.totalCandidates)} tổng UV`}
                    icon={Users}
                    iconColor="text-indigo-600"
                    iconBg="bg-indigo-100 dark:bg-indigo-900/50"
                />
                <StatCard
                    title="PV sắp tới"
                    value={val(stats?.upcomingInterviews)}
                    subtitle={`/ ${val(stats?.totalInterviews)} tổng PV`}
                    icon={Calendar}
                    iconColor="text-amber-600"
                    iconBg="bg-amber-100 dark:bg-amber-900/50"
                />
                <StatCard
                    title="Đã tuyển tháng này"
                    value={val(stats?.hiredThisMonth)}
                    subtitle={stats?.averageHiringTime ? `TB ${stats.averageHiringTime} ngày` : "—"}
                    icon={UserCheck}
                    iconColor="text-emerald-600"
                    iconBg="bg-emerald-100 dark:bg-emerald-900/50"
                />
            </div>

            {/* ─── Main Content ─── */}
            <section className="flex-1 relative h-full min-h-0 overflow-hidden">
                <ScrollArea className="h-full">
                    <div className="p-3 space-y-3">
                        {/* Row 1: Pipeline + Quick Actions */}
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
                            {/* Pipeline Funnel */}
                            <Card className="lg:col-span-3 py-0 gap-0 border shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between p-3 pb-1">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                                        <TrendingUp className="h-4 w-4 text-primary" />
                                        Phễu tuyển dụng
                                    </CardTitle>
                                    <Button variant="ghost" size="xs" asChild className="text-xs text-muted-foreground hover:text-primary">
                                        <Link href="/recruitment/candidates">
                                            Xem tất cả <ArrowRight className="h-3 w-3 ml-1" />
                                        </Link>
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-3 pt-2">
                                    <PipelineFunnel candidates={candidates as CandidateBasic[]} />
                                </CardContent>
                            </Card>

                            {/* Quick Actions Grid */}
                            <div className="lg:col-span-2 grid grid-cols-2 gap-2">
                                <QuickActionCard
                                    title="Tin tuyển dụng"
                                    description="Quản lý vị trí tuyển dụng"
                                    icon={Briefcase}
                                    href="/recruitment/job-postings"
                                    count={stats?.openJobPostings}
                                    color="blue"
                                />
                                <QuickActionCard
                                    title="Ứng viên"
                                    description="Pipeline & danh sách UV"
                                    icon={Users}
                                    href="/recruitment/candidates"
                                    count={stats?.activeCandidates}
                                    color="indigo"
                                />
                                <QuickActionCard
                                    title="Lịch phỏng vấn"
                                    description="Quản lý lịch PV"
                                    icon={Calendar}
                                    href="/recruitment/interviews"
                                    count={stats?.upcomingInterviews}
                                    color="amber"
                                />
                                <QuickActionCard
                                    title="Báo cáo"
                                    description="Thống kê & phân tích"
                                    icon={BarChart3}
                                    href="/recruitment/reports"
                                    color="emerald"
                                />
                            </div>
                        </div>

                        {/* Row 2: Recent Candidates + Upcoming Interviews */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            {/* Recent Candidates */}
                            <Card className="py-0 gap-0 border shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between p-3 pb-1">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                                        <Zap className="h-4 w-4 text-amber-500" />
                                        Ứng viên gần đây
                                    </CardTitle>
                                    <Button variant="ghost" size="xs" asChild className="text-xs text-muted-foreground hover:text-primary">
                                        <Link href="/recruitment/candidates">
                                            Xem tất cả <ArrowRight className="h-3 w-3 ml-1" />
                                        </Link>
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-2 pt-0">
                                    {recentCandidates.length === 0 ? (
                                        <div className="flex items-center justify-center h-28 text-sm text-muted-foreground">
                                            <Users className="h-4 w-4 mr-2 opacity-40" />
                                            Chưa có ứng viên
                                        </div>
                                    ) : (
                                        <div className="space-y-0.5">
                                            {recentCandidates.map((c) => (
                                                <CandidateRow key={c.id} candidate={c as CandidateBasic} />
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Upcoming Interviews */}
                            <Card className="py-0 gap-0 border shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between p-3 pb-1">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                                        <Clock className="h-4 w-4 text-blue-500" />
                                        Phỏng vấn sắp tới
                                    </CardTitle>
                                    <Button variant="ghost" size="xs" asChild className="text-xs text-muted-foreground hover:text-primary">
                                        <Link href="/recruitment/interviews">
                                            Xem tất cả <ArrowRight className="h-3 w-3 ml-1" />
                                        </Link>
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-2 pt-0">
                                    {upcomingInterviews.length === 0 ? (
                                        <div className="flex items-center justify-center h-28 text-sm text-muted-foreground">
                                            <Calendar className="h-4 w-4 mr-2 opacity-40" />
                                            Không có lịch phỏng vấn sắp tới
                                        </div>
                                    ) : (
                                        <div className="space-y-0.5">
                                            {upcomingInterviews.map((i) => (
                                                <InterviewRow key={i.id} interview={i as InterviewBasic} />
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </ScrollArea>
            </section>
        </div>
    );
}
