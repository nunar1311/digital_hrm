"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  format,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  isWithinInterval,
} from "date-fns";
import { vi } from "date-fns/locale";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Download,
  Calendar,
  Briefcase,
  TrendingUp,
  Target,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Activity,
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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  ResponsiveContainer,
} from "recharts";

import {
  getRecruitmentStats,
  getCandidates,
  getInterviews,
} from "@/app/(protected)/recruitment/actions";
import type {
  RecruitmentStats,
  JobPostingBasic,
  CandidateBasic,
  InterviewBasic,
  CandidateStage,
  CandidateSource,
  InterviewType,
  InterviewStatus,
} from "@/app/(protected)/recruitment/types";
import {
  CANDIDATE_STAGE,
  CANDIDATE_SOURCE,
  INTERVIEW_TYPE,
  INTERVIEW_STATUS,
} from "@/app/(protected)/recruitment/constants";
import { useTimezone } from "@/hooks/use-timezone";
import { toast } from "sonner";

// ─── Local types (matching server response shape) ───

interface CandidateWithTags extends CandidateBasic {
  candidateTags: { id: string; name: string; color: string }[];
}

interface InterviewWithFeedbacks extends InterviewBasic {
  feedbacks: {
    id: string;
    interviewId: string;
    userId: string;
    userName: string;
    score: number | null;
    result: string | null;
    technicalSkill: number | null;
    communication: number | null;
    problemSolving: number | null;
    cultureFit: number | null;
    strengths: string | null;
    improvements: string | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  }[];
}

type PaginatedCandidates = {
  items: CandidateWithTags[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type PaginatedInterviews = {
  items: InterviewWithFeedbacks[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

// ─── Chart colors ───
const CHART_COLORS = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
  purple: "#a855f7",
  pink: "#ec4899",
  gray: "#6b7280",
};

const STAGE_COLORS: Record<CandidateStage, string> = {
  APPLIED: "#6b7280",
  SCREENING: "#3b82f6",
  INTERVIEW: "#f59e0b",
  OFFER: "#a855f7",
  HIRED: "#22c55e",
  REJECTED: "#ef4444",
};

const SOURCE_COLORS: string[] = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#a855f7",
  "#ec4899",
  "#6b7280",
];

// Period options
const PERIODS = [
  { value: "this_month", label: "Tháng này" },
  { value: "last_month", label: "Tháng trước" },
  { value: "last_3_months", label: "3 tháng gần nhất" },
  { value: "this_quarter", label: "Quý này" },
  { value: "last_quarter", label: "Quý trước" },
  { value: "this_year", label: "Năm nay" },
  { value: "all_time", label: "Tất cả thời gian" },
];

interface ReportsClientProps {
  initialStats: RecruitmentStats;
  initialJobPostings: JobPostingBasic[];
  initialCandidates: CandidateBasic[];
  initialInterviews: InterviewBasic[];
}

// ─── KPI Card Component ───
function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color,
}: {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ElementType;
  trend?: "up" | "down";
  trendValue?: string;
  color: string;
}) {
  return (
    <Card className="relative overflow-hidden p-3">
      <CardContent className="px-0">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <div className="flex items-center gap-1">
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
              {trend && trendValue && (
                <div
                  className={`flex items-center gap-1 text-xs ${
                    trend === "up" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {trend === "up" ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  <span>{trendValue}</span>
                </div>
              )}
            </div>
          </div>
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${color}20`, color }}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Mini Chart Card ───
function MiniChartCard({
  title,
  value,
  chartData,
  chartType = "bar",
}: {
  title: string;
  value: number;
  chartData: { name: string; value: number }[];
  chartType?: "bar" | "line" | "area";
}) {
  return (
    <Card className="p-3">
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-2">{value}</div>
        <div className="h-16">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "bar" ? (
              <BarChart data={chartData}>
                <Bar
                  dataKey="value"
                  fill={CHART_COLORS.info}
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            ) : chartType === "line" ? (
              <LineChart data={chartData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={CHART_COLORS.info}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            ) : (
              <AreaChart data={chartData}>
                <Area
                  type="monotone"
                  dataKey="value"
                  fill={CHART_COLORS.info}
                  fillOpacity={0.2}
                  stroke={CHART_COLORS.info}
                  strokeWidth={2}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function RecruitmentReportsClient({
  initialStats,
  initialJobPostings,
  initialCandidates,
  initialInterviews,
}: ReportsClientProps) {
  useTimezone();
  const [selectedPeriod, setSelectedPeriod] = useState("this_month");
  const [selectedJobPosting, setSelectedJobPosting] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch data
  const { data: statsData } = useQuery({
    queryKey: ["recruitment", "stats"],
    queryFn: getRecruitmentStats,
    initialData: initialStats,
  });

  const { data: candidatesData } = useQuery<PaginatedCandidates>({
    queryKey: ["recruitment", "candidates"],
    queryFn: async () => {
      const res = await getCandidates({}, { limit: 5000 });
      return res as unknown as PaginatedCandidates;
    },
    initialData: initialCandidates as unknown as PaginatedCandidates,
  });

  const { data: interviewsData } = useQuery<PaginatedInterviews>({
    queryKey: ["recruitment", "interviews"],
    queryFn: async () => {
      const res = await getInterviews({}, { limit: 5000 });
      return res as unknown as PaginatedInterviews;
    },
    initialData: initialInterviews as unknown as PaginatedInterviews,
  });

  // Filter data by period
  const filteredData = useMemo((): {
    candidates: CandidateWithTags[];
    interviews: InterviewWithFeedbacks[];
  } => {
    if (!candidatesData || !interviewsData)
      return { candidates: [], interviews: [] };

    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (selectedPeriod) {
      case "this_month":
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case "last_month":
        startDate = startOfMonth(subMonths(now, 1));
        endDate = endOfMonth(subMonths(now, 1));
        break;
      case "last_3_months":
        startDate = startOfMonth(subMonths(now, 3));
        endDate = now;
        break;
      case "this_quarter": {
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = endOfMonth(new Date(now.getFullYear(), quarter * 3 + 2, 1));
        break;
      }
      case "last_quarter": {
        const lastQuarter = Math.floor(now.getMonth() / 3) - 1;
        startDate = new Date(now.getFullYear(), lastQuarter * 3, 1);
        endDate = endOfMonth(
          new Date(now.getFullYear(), lastQuarter * 3 + 2, 1),
        );
        break;
      }
      case "this_year":
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = now;
        break;
      default:
        startDate = new Date(0);
        endDate = now;
    }

    const filteredCandidates = candidatesData.items.filter((c) => {
      const date = new Date(c.createdAt);
      return isWithinInterval(date, { start: startDate, end: endDate });
    });

    const filteredInterviews = interviewsData.items.filter((i) => {
      const date = new Date(i.scheduledDate);
      return isWithinInterval(date, { start: startDate, end: endDate });
    });

    return { candidates: filteredCandidates, interviews: filteredInterviews };
  }, [candidatesData, interviewsData, selectedPeriod]);

  // Filter by job posting
  const filteredCandidates = useMemo(() => {
    if (selectedJobPosting === "all") return filteredData.candidates;
    return filteredData.candidates.filter(
      (c) => c.jobPostingId === selectedJobPosting,
    );
  }, [filteredData.candidates, selectedJobPosting]);

  // Stage distribution
  const stageDistribution = useMemo((): Record<CandidateStage, number> => {
    const distribution: Record<CandidateStage, number> = {
      APPLIED: 0,
      SCREENING: 0,
      INTERVIEW: 0,
      OFFER: 0,
      HIRED: 0,
      REJECTED: 0,
    };
    filteredCandidates.forEach((candidate) => {
      if (distribution[candidate.stage] !== undefined) {
        distribution[candidate.stage]++;
      }
    });
    return distribution;
  }, [filteredCandidates]);

  // Source distribution
  const sourceDistribution = useMemo((): Record<CandidateSource, number> => {
    const distribution: Partial<Record<CandidateSource, number>> = {};
    filteredCandidates.forEach((candidate) => {
      distribution[candidate.source] = (distribution[candidate.source] || 0) + 1;
    });
    return distribution as Record<CandidateSource, number>;
  }, [filteredCandidates]);

  // Key metrics
  const metrics = useMemo(() => {
    const total = filteredCandidates.length;
    const hired = stageDistribution.HIRED;
    const rejected = stageDistribution.REJECTED;
    const inProcess =
      stageDistribution.SCREENING +
      stageDistribution.INTERVIEW +
      stageDistribution.OFFER;
    const interviews = filteredData.interviews.length;
    const completedInterviews = filteredData.interviews.filter(
      (i) => i.status === "COMPLETED",
    ).length;
    const passedInterviews = filteredData.interviews.filter(
      (i) => i.result === "PASS",
    ).length;

    return {
      totalCandidates: total,
      hired,
      rejected,
      inProcess,
      interviews,
      completedInterviews,
      passedInterviews,
      hiringRate: total > 0 ? ((hired / total) * 100).toFixed(1) : "0",
      interviewRate:
        total > 0
          ? (
              ((stageDistribution.INTERVIEW + stageDistribution.OFFER + hired) /
                total) *
              100
            ).toFixed(1)
          : "0",
      rejectionRate: total > 0 ? ((rejected / total) * 100).toFixed(1) : "0",
      offerAcceptanceRate:
        stageDistribution.OFFER + hired > 0
          ? ((hired / (stageDistribution.OFFER + hired)) * 100).toFixed(1)
          : "0",
      interviewPassRate:
        completedInterviews > 0
          ? ((passedInterviews / completedInterviews) * 100).toFixed(1)
          : "0",
      avgInterviewsPerCandidate:
        hired > 0 ? (interviews / hired).toFixed(1) : "0",
    };
  }, [filteredCandidates, filteredData.interviews, stageDistribution]);

  // Monthly trend data
  const monthlyTrendData = useMemo(() => {
    const now = new Date();
    const months = eachMonthOfInterval({
      start: startOfMonth(subMonths(now, 11)),
      end: now,
    });

    return months.map((month) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      const candidatesInMonth = candidatesData.items.filter((c) => {
        const date = new Date(c.createdAt);
        return isWithinInterval(date, { start: monthStart, end: monthEnd });
      });

      const hiredInMonth = candidatesInMonth.filter(
        (c) => c.stage === "HIRED",
      );

      const interviewsInMonth = interviewsData.items.filter((i) => {
        const date = new Date(i.scheduledDate);
        return isWithinInterval(date, { start: monthStart, end: monthEnd });
      });

      return {
        month: format(month, "MM/yyyy", { locale: vi }),
        fullMonth: format(month, "MMMM yyyy", { locale: vi }),
        candidates: candidatesInMonth.length,
        hired: hiredInMonth.length,
        interviews: interviewsInMonth.length,
      };
    });
  }, [candidatesData, interviewsData]);

  // Job posting performance
  const jobPostingPerformance = useMemo(() => {
    return initialJobPostings
      .map((posting) => {
        const postingCandidates = candidatesData.items.filter(
          (c) => c.jobPostingId === posting.id,
        );
        const hired = postingCandidates.filter(
          (c) => c.stage === "HIRED",
        ).length;
        const inProgress = postingCandidates.filter((c) =>
          (["SCREENING", "INTERVIEW", "OFFER"] as CandidateStage[]).includes(
            c.stage,
          ),
        ).length;
        const rejected = postingCandidates.filter(
          (c) => c.stage === "REJECTED",
        ).length;
        const conversionRate =
          postingCandidates.length > 0
            ? ((hired / postingCandidates.length) * 100).toFixed(1)
            : "0";

        return {
          ...posting,
          totalCandidates: postingCandidates.length,
          hired,
          inProgress,
          rejected,
          conversionRate,
        };
      })
      .sort((a, b) => b.totalCandidates - a.totalCandidates);
  }, [initialJobPostings, candidatesData]);

  // Chart data preparation
  const stageChartData = Object.entries(CANDIDATE_STAGE)
    .map(([key, value]) => ({
      name: value.label,
      value: stageDistribution[key as CandidateStage] || 0,
      color: STAGE_COLORS[key as CandidateStage],
    }))
    .filter((d) => d.value > 0);

  const sourceChartData = Object.entries(CANDIDATE_SOURCE)
    .map(([key, value], index) => ({
      name: value.label,
      value: sourceDistribution[key as CandidateSource] || 0,
      fill: SOURCE_COLORS[index],
    }))
    .filter((d) => d.value > 0);

  const interviewTypeChartData = useMemo(() => {
    const distribution: Partial<Record<InterviewType, number>> = {
      ONSITE: 0,
      ONLINE: 0,
      PHONE: 0,
    };
    filteredData.interviews.forEach((i) => {
      const current = distribution[i.type];
      if (current !== undefined) {
        distribution[i.type] = current + 1;
      }
    });
    return Object.entries(INTERVIEW_TYPE).map(([key, value]) => ({
      name: value.label,
      value: distribution[key as InterviewType] || 0,
    }));
  }, [filteredData.interviews]);

  const funnelChartData = [
    {
      name: "Ứng tuyển",
      value: stageDistribution.APPLIED,
      fill: STAGE_COLORS.APPLIED,
    },
    {
      name: "Sàng lọc",
      value: stageDistribution.SCREENING,
      fill: STAGE_COLORS.SCREENING,
    },
    {
      name: "Phỏng vấn",
      value: stageDistribution.INTERVIEW,
      fill: STAGE_COLORS.INTERVIEW,
    },
    {
      name: "Đề xuất",
      value: stageDistribution.OFFER,
      fill: STAGE_COLORS.OFFER,
    },
    { name: "Tuyển", value: stageDistribution.HIRED, fill: STAGE_COLORS.HIRED },
  ];

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: {
    cx?: number;
    cy?: number;
    midAngle?: number;
    innerRadius?: number;
    outerRadius?: number;
    percent?: number;
  }) => {
    if (
      cx == null ||
      cy == null ||
      midAngle == null ||
      innerRadius == null ||
      outerRadius == null ||
      percent == null
    )
      return null;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    if (percent < 0.05) return null;
    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const handleExport = () => {
    toast.success("Đang xuất báo cáo...");
  };

  return (
    <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
      {/* Header */}
      <div className="shrink-0 border-b h-10 p-2">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center justify-between">
          <h1 className="text-base font-bold">Báo cáo tuyển dụng</h1>

          <div className="flex items-center gap-2 flex-wrap">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[160px] h-6! text-xs">
                <SelectValue placeholder="Chọn thời gian" />
              </SelectTrigger>
              <SelectContent>
                {PERIODS.map((period) => (
                  <SelectItem key={period.value} value={period.value}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedJobPosting}
              onValueChange={setSelectedJobPosting}
            >
              <SelectTrigger className="w-[180px] h-6! text-xs">
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

            <Button variant="outline" size="xs" onClick={handleExport}>
              <Download />
              Xuất báo cáo
            </Button>
          </div>
        </div>
      </div>

      {/* Content - scrollable */}
      <div className="flex-1 overflow-auto space-y-4 p-3">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">
              <BarChart3 className="h-4 w-4 mr-2" />
              Tổng quan
            </TabsTrigger>
            <TabsTrigger value="candidates">
              <Users className="h-4 w-4 mr-2" />
              Ứng viên
            </TabsTrigger>
            <TabsTrigger value="interviews">
              <Calendar className="h-4 w-4 mr-2" />
              Phỏng vấn
            </TabsTrigger>
            <TabsTrigger value="performance">
              <Target className="h-4 w-4 mr-2" />
              Hiệu suất
            </TabsTrigger>
          </TabsList>

          {/* ─── Overview Tab ─── */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <KPICard
                title="Tổng ứng viên"
                value={metrics.totalCandidates}
                subtitle={`${statsData?.activeCandidates || 0} đang active`}
                icon={Users}
                color={CHART_COLORS.info}
              />
              <KPICard
                title="Tuyển thành công"
                value={metrics.hired}
                subtitle={`${metrics.hiringRate}% tỷ lệ tuyển`}
                icon={UserCheck}
                color={CHART_COLORS.success}
                trend="up"
                trendValue="+12%"
              />
              <KPICard
                title="Từ chối"
                value={metrics.rejected}
                subtitle={`${metrics.rejectionRate}% tỷ lệ từ chối`}
                icon={UserX}
                color={CHART_COLORS.danger}
              />
              <KPICard
                title="Tổng phỏng vấn"
                value={metrics.interviews}
                subtitle={`${metrics.completedInterviews} đã hoàn thành`}
                icon={Clock}
                color={CHART_COLORS.warning}
              />
              <KPICard
                title="Đang xử lý"
                value={metrics.inProcess}
                subtitle="Ứng viên trong pipeline"
                icon={Activity}
                color={CHART_COLORS.purple}
              />
            </div>

            {/* Main Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Monthly Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Xu hướng tuyển dụng 12 tháng
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ChartContainer
                      config={{
                        candidates: {
                          label: "Ứng viên",
                          color: CHART_COLORS.info,
                        },
                        hired: { label: "Tuyển", color: CHART_COLORS.success },
                        interviews: {
                          label: "Phỏng vấn",
                          color: CHART_COLORS.warning,
                        },
                      }}
                    >
                      <AreaChart data={monthlyTrendData}>
                        <defs>
                          <linearGradient
                            id="colorCandidates"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor={CHART_COLORS.info}
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor={CHART_COLORS.info}
                              stopOpacity={0}
                            />
                          </linearGradient>
                          <linearGradient
                            id="colorHired"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor={CHART_COLORS.success}
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor={CHART_COLORS.success}
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 10 }}
                          interval="preserveStartEnd"
                        />
                        <YAxis tick={{ fontSize: 10 }} />
                        <ChartTooltip
                          content={<ChartTooltipContent />}
                          labelFormatter={(label) => {
                            const item = monthlyTrendData.find(
                              (d) => d.month === label,
                            );
                            return item?.fullMonth || label;
                          }}
                        />
                        <ChartLegendContent />
                        <Area
                          type="monotone"
                          dataKey="candidates"
                          stroke={CHART_COLORS.info}
                          fillOpacity={1}
                          fill="url(#colorCandidates)"
                          strokeWidth={2}
                        />
                        <Area
                          type="monotone"
                          dataKey="hired"
                          stroke={CHART_COLORS.success}
                          fillOpacity={1}
                          fill="url(#colorHired)"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="interviews"
                          stroke={CHART_COLORS.warning}
                          strokeWidth={2}
                          dot={false}
                        />
                      </AreaChart>
                    </ChartContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Stage Funnel */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    Phễu tuyển dụng
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {funnelChartData.map((stage, index) => {
                      const maxValue = funnelChartData[0].value;
                      const percentage =
                        maxValue > 0 ? (stage.value / maxValue) * 100 : 0;
                      const conversionRate =
                        index > 0 && funnelChartData[index - 1].value > 0
                          ? (
                              (stage.value / funnelChartData[index - 1].value) *
                              100
                            ).toFixed(0)
                          : "100";

                      return (
                        <div key={stage.name} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{stage.name}</span>
                            <div className="flex items-center gap-3">
                              <span className="font-bold">{stage.value}</span>
                              {index > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {conversionRate}% chuyển đổi
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="h-3 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: stage.fill,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Secondary Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Stage Distribution Pie */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Phân bổ theo giai đoạn
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    {stageChartData.length > 0 ? (
                      <ChartContainer config={{}}>
                        <PieChart>
                          <Pie
                            data={stageChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={90}
                            dataKey="value"
                            labelLine={false}
                            label={renderCustomizedLabel}
                          >
                            {stageChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <ChartTooltip />
                          <ChartLegendContent />
                        </PieChart>
                      </ChartContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        Chưa có dữ liệu
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Source Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Phân bổ theo nguồn
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    {sourceChartData.length > 0 ? (
                      <ChartContainer config={{}}>
                        <PieChart>
                          <Pie
                            data={sourceChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={90}
                            dataKey="value"
                            labelLine={false}
                            label={renderCustomizedLabel}
                          >
                            {sourceChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <ChartTooltip />
                          <ChartLegendContent />
                        </PieChart>
                      </ChartContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        Chưa có dữ liệu
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Interview Type Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Hình thức phỏng vấn
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ChartContainer config={{}}>
                      <BarChart data={interviewTypeChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis
                          dataKey="name"
                          type="category"
                          width={80}
                          tick={{ fontSize: 11 }}
                        />
                        <ChartTooltip />
                        <Bar
                          dataKey="value"
                          fill={CHART_COLORS.info}
                          radius={[0, 4, 4, 0]}
                        >
                          {interviewTypeChartData.map((_, idx) => (
                            <Cell
                              key={`cell-${idx}`}
                              fill={SOURCE_COLORS[idx % SOURCE_COLORS.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ─── Candidates Tab ─── */}
          <TabsContent value="candidates" className="space-y-4 mt-4">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MiniChartCard
                title="Tổng ứng viên"
                value={metrics.totalCandidates}
                chartData={monthlyTrendData.map((d) => ({
                  name: d.month,
                  value: d.candidates,
                }))}
                chartType="bar"
              />
              <KPICard
                title="Tỷ lệ tuyển"
                value={`${metrics.hiringRate}%`}
                subtitle={`${metrics.hired} ứng viên`}
                icon={Award}
                color={CHART_COLORS.success}
                trend={Number(metrics.hiringRate) > 10 ? "up" : "down"}
                trendValue="vs kỳ trước"
              />
              <KPICard
                title="Tỷ lệ từ chối"
                value={`${metrics.rejectionRate}%`}
                subtitle={`${metrics.rejected} ứng viên`}
                icon={UserX}
                color={CHART_COLORS.danger}
              />
              <KPICard
                title="Tỷ lệ chấp nhận offer"
                value={`${metrics.offerAcceptanceRate}%`}
                subtitle="Ứng viên đồng ý"
                icon={UserCheck}
                color={CHART_COLORS.purple}
              />
            </div>

            {/* Stage Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Chi tiết theo giai đoạn
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ChartContainer
                    config={{
                      APPLIED: {
                        label: CANDIDATE_STAGE.APPLIED.label,
                        color: STAGE_COLORS.APPLIED,
                      },
                      SCREENING: {
                        label: CANDIDATE_STAGE.SCREENING.label,
                        color: STAGE_COLORS.SCREENING,
                      },
                      INTERVIEW: {
                        label: CANDIDATE_STAGE.INTERVIEW.label,
                        color: STAGE_COLORS.INTERVIEW,
                      },
                      OFFER: {
                        label: CANDIDATE_STAGE.OFFER.label,
                        color: STAGE_COLORS.OFFER,
                      },
                      HIRED: {
                        label: CANDIDATE_STAGE.HIRED.label,
                        color: STAGE_COLORS.HIRED,
                      },
                      REJECTED: {
                        label: CANDIDATE_STAGE.REJECTED.label,
                        color: STAGE_COLORS.REJECTED,
                      },
                    }}
                  >
                    <BarChart data={stageChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {stageChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>

            {/* Source Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Chi tiết theo nguồn tuyển
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sourceChartData.map((source) => {
                    const percentage =
                      metrics.totalCandidates > 0
                        ? (
                            (source.value / metrics.totalCandidates) *
                            100
                          ).toFixed(1)
                        : "0";
                    return (
                      <div
                        key={source.name}
                        className="flex items-center gap-3"
                      >
                        <div className="w-24 text-sm">{source.name}</div>
                        <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: source.fill,
                            }}
                          />
                        </div>
                        <div className="w-16 text-sm text-right font-medium">
                          {source.value}
                        </div>
                        <div className="w-12 text-xs text-muted-foreground text-right">
                          {percentage}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Interviews Tab ─── */}
          <TabsContent value="interviews" className="space-y-4 mt-4">
            {/* Interview Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPICard
                title="Tổng lịch phỏng vấn"
                value={metrics.interviews}
                subtitle={`${metrics.completedInterviews} đã hoàn thành`}
                icon={Calendar}
                color={CHART_COLORS.info}
              />
              <KPICard
                title="Tỷ lệ qua phỏng vấn"
                value={`${metrics.interviewPassRate}%`}
                subtitle={`${metrics.passedInterviews} đạt`}
                icon={UserCheck}
                color={CHART_COLORS.success}
                trend="up"
                trendValue="vs kỳ trước"
              />
              <KPICard
                title="Trung bình PV/ứng viên"
                value={metrics.avgInterviewsPerCandidate}
                subtitle="Vòng phỏng vấn"
                icon={Clock}
                color={CHART_COLORS.warning}
              />
              <KPICard
                title="Sắp tới"
                value={statsData?.upcomingInterviews || 0}
                subtitle="Lịch chưa diễn ra"
                icon={Activity}
                color={CHART_COLORS.purple}
              />
            </div>

            {/* Interview Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Xu hướng phỏng vấn theo tháng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ChartContainer
                    config={{
                      interviews: {
                        label: "Tổng phỏng vấn",
                        color: CHART_COLORS.info,
                      },
                      completed: {
                        label: "Hoàn thành",
                        color: CHART_COLORS.success,
                      },
                    }}
                  >
                    <LineChart data={monthlyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegendContent />
                      <Line
                        type="monotone"
                        dataKey="interviews"
                        stroke={CHART_COLORS.info}
                        strokeWidth={2}
                        dot={{ fill: CHART_COLORS.info }}
                      />
                    </LineChart>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>

            {/* Interview Type Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Hình thức phỏng vấn
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {interviewTypeChartData.map((type, index) => {
                      const total = metrics.interviews;
                      const percentage =
                        total > 0
                          ? ((type.value / total) * 100).toFixed(1)
                          : "0";
                      return (
                        <div
                          key={type.name}
                          className="flex items-center gap-3"
                        >
                          <div className="w-24 text-sm">{type.name}</div>
                          <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor:
                                  SOURCE_COLORS[index % SOURCE_COLORS.length],
                              }}
                            />
                          </div>
                          <div className="w-16 text-sm text-right font-medium">
                            {type.value}
                          </div>
                          <div className="w-12 text-xs text-muted-foreground text-right">
                            {percentage}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Interview Status Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Trạng thái phỏng vấn
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(
                      Object.entries(INTERVIEW_STATUS) as [
                        InterviewStatus,
                        { label: string },
                      ][]
                    ).map(([key, value]) => {
                      const count = filteredData.interviews.filter(
                        (i) => i.status === key,
                      ).length;
                      const percentage =
                        metrics.interviews > 0
                          ? ((count / metrics.interviews) * 100).toFixed(1)
                          : "0";
                      return (
                        <div key={key} className="flex items-center gap-3">
                          <Badge
                            className={
                              key === "COMPLETED"
                                ? "bg-green-100 text-green-700"
                                : key === "SCHEDULED"
                                  ? "bg-blue-100 text-blue-700"
                                  : key === "CANCELLED" || key === "NO_SHOW"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-yellow-100 text-yellow-700"
                            }
                          >
                            {value.label}
                          </Badge>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="w-12 text-sm text-right font-medium">
                            {count}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ─── Performance Tab ─── */}
          <TabsContent value="performance" className="space-y-4 mt-4">
            {/* Performance Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPICard
                title="Tin tuyển dụng mở"
                value={statsData?.openJobPostings || 0}
                subtitle={`/ ${statsData?.totalJobPostings || 0} tổng tin`}
                icon={Briefcase}
                color={CHART_COLORS.info}
              />
              <KPICard
                title="Tuyển tháng này"
                value={statsData?.hiredThisMonth || 0}
                subtitle="Người"
                icon={Award}
                color={CHART_COLORS.success}
                trend="up"
                trendValue="vs tháng trước"
              />
              <KPICard
                title="Tỷ lệ tuyển"
                value={`${metrics.hiringRate}%`}
                subtitle="Ứng viên -> Tuyển"
                icon={Target}
                color={CHART_COLORS.warning}
              />
              <KPICard
                title="Hiệu suất TB"
                value={`${metrics.hiringRate}%`}
                subtitle="Trung bình ngành"
                icon={TrendingUp}
                color={CHART_COLORS.purple}
              />
            </div>

            {/* Job Posting Performance Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Hiệu suất tin tuyển dụng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div className="space-y-4">
                    {jobPostingPerformance.slice(0, 10).map((posting) => {
                      const progress =
                        posting.headcount > 0
                          ? Math.min(
                              (posting.hired / posting.headcount) * 100,
                              100,
                            )
                          : 0;
                      return (
                        <div
                          key={posting.id}
                          className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">
                                {posting.title}
                              </span>
                              <Badge
                                variant={
                                  posting.status === "OPEN"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {posting.status === "OPEN"
                                  ? "Đang tuyển"
                                  : posting.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {posting.totalCandidates} ứng viên
                              </span>
                              <span className="flex items-center gap-1">
                                <Activity className="h-3 w-3" />
                                {posting.inProgress} đang xử lý
                              </span>
                              <span className="flex items-center gap-1 text-green-600">
                                <UserCheck className="h-3 w-3" />
                                {posting.hired} đã tuyển
                              </span>
                              <span className="flex items-center gap-1 text-red-600">
                                <UserX className="h-3 w-3" />
                                {posting.rejected} từ chối
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-32">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span>Tiến độ</span>
                                <span className="font-medium">
                                  {posting.hired}/{posting.headcount}
                                </span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-500 rounded-full transition-all"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                            <div className="w-16 text-right">
                              <div className="text-sm font-medium">
                                {posting.conversionRate}%
                              </div>
                              <div className="text-xs text-muted-foreground">
                                CVR
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Performing Postings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Top vị trí tuyển nhiều nhất
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ChartContainer config={{}}>
                      <BarChart
                        data={jobPostingPerformance.slice(0, 5).map((p) => ({
                          name:
                            p.title.length > 15
                              ? p.title.substring(0, 15) + "..."
                              : p.title,
                          candidates: p.totalCandidates,
                          hired: p.hired,
                        }))}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis
                          dataKey="name"
                          type="category"
                          width={100}
                          tick={{ fontSize: 10 }}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegendContent />
                        <Bar
                          dataKey="candidates"
                          fill={CHART_COLORS.info}
                          radius={[0, 4, 4, 0]}
                        />
                        <Bar
                          dataKey="hired"
                          fill={CHART_COLORS.success}
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ChartContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Top vị trí tỷ lệ chuyển đổi cao
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {jobPostingPerformance
                      .filter((p) => p.totalCandidates >= 3)
                      .sort(
                        (a, b) =>
                          Number(b.conversionRate) - Number(a.conversionRate),
                      )
                      .slice(0, 5)
                      .map((posting, index) => (
                        <div
                          key={posting.id}
                          className="flex items-center gap-3"
                        >
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {posting.title}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-green-600">
                              {posting.conversionRate}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ({posting.hired}/{posting.totalCandidates})
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
