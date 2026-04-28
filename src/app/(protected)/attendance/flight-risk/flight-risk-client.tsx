"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Loader2,
  ShieldAlert,
  Users,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Brain,
  X,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MarkdownComponents } from "@/components/ai/ai-helpers";
import {
  scanFlightRisk,
  getEmployeeFlightRiskDetail,
  analyzeFlightRiskWithAI,
  getInitialEmployees,
  generateStayInterviewScript,
  injectMockData104,
} from "./actions";
import type { FlightRiskEmployee, EmployeeCheckInTimeSeries } from "./actions";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  MarkAreaComponent,
  MarkLineComponent,
  LegendComponent,
  DataZoomComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { ScrollArea } from "@/components/ui/scroll-area";

echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  MarkAreaComponent,
  MarkLineComponent,
  LegendComponent,
  DataZoomComponent,
  CanvasRenderer,
]);

// ─── Helpers ────────────────────────────────────────────────────────

function minuteToTime(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
}

const RISK_COLORS: Record<string, string> = {
  CRITICAL: "bg-red-500/10 text-red-600 border-red-500/30",
  HIGH: "bg-orange-500/10 text-orange-600 border-orange-500/30",
  MEDIUM: "bg-yellow-500/10 text-yellow-700 border-yellow-500/30",
  LOW: "bg-green-500/10 text-green-600 border-green-500/30",
};

const RISK_LABELS: Record<string, string> = {
  CRITICAL: "Rất cao",
  HIGH: "Cao",
  MEDIUM: "Trung bình",
  LOW: "Thấp",
};

const RISK_ROW_BG: Record<string, string> = {
  CRITICAL: "bg-red-500/8 hover:bg-red-500/15 border-l-4 border-l-red-500",
  HIGH: "bg-orange-500/6 hover:bg-orange-500/12 border-l-4 border-l-orange-400",
  MEDIUM:
    "bg-yellow-500/5 hover:bg-yellow-500/10 border-l-4 border-l-yellow-400",
  LOW: "hover:bg-muted/50 border-l-4 border-l-transparent",
};

// ─── EChart Component ───────────────────────────────────────────────

function CheckInChart({
  timeSeries,
  baselineMinute,
}: {
  timeSeries: EmployeeCheckInTimeSeries[];
  baselineMinute: number;
}) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current || timeSeries.length === 0) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, undefined, {
        renderer: "canvas",
      });
    }
    const chart = chartInstance.current;

    const dates = timeSeries.map((t) => t.date);
    const values = timeSeries.map((t) => t.checkInMinute);

    // Find the 30-day cutoff index
    const totalLen = dates.length;
    const recentStartIdx = Math.max(0, totalLen - 22); // ~30 calendar days ≈ 22 work days

    chart.setOption({
      animation: true,
      tooltip: {
        trigger: "axis",
        formatter: (params: unknown) => {
          const p = (
            params as Array<{ axisValue: string; value: number | null }>
          )[0];
          if (!p || p.value == null) return `${p?.axisValue}<br/>Nghỉ`;
          return `${p.axisValue}<br/>Check-in: <b>${minuteToTime(p.value)}</b>`;
        },
      },
      legend: { data: ["Giờ check-in", "Baseline"], top: 0 },
      grid: { left: 60, right: 30, top: 40, bottom: 60 },
      dataZoom: [
        { type: "inside", start: 0, end: 100 },
        { type: "slider", bottom: 10, height: 20 },
      ],
      xAxis: {
        type: "category",
        data: dates,
        axisLabel: {
          rotate: 45,
          fontSize: 10,
          interval: Math.floor(dates.length / 10),
        },
      },
      yAxis: {
        type: "value",
        min: 450, // 7:30
        max: 600, // 10:00
        axisLabel: { formatter: (v: number) => minuteToTime(v) },
        splitNumber: 6,
      },
      series: [
        {
          name: "Giờ check-in",
          type: "line",
          data: values,
          connectNulls: false,
          smooth: true,
          symbol: "circle",
          symbolSize: 4,
          lineStyle: { width: 2 },
          itemStyle: { color: "#6366f1" },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(99,102,241,0.15)" },
              { offset: 1, color: "rgba(99,102,241,0.01)" },
            ]),
          },
          markArea: {
            silent: true,
            data:
              recentStartIdx < totalLen
                ? [
                    [
                      {
                        xAxis: dates[recentStartIdx],
                        itemStyle: { color: "rgba(239,68,68,0.06)" },
                      },
                      { xAxis: dates[totalLen - 1] },
                    ],
                  ]
                : [],
          },
        },
        {
          name: "Baseline",
          type: "line",
          data: dates.map(() => baselineMinute),
          lineStyle: { type: "dashed", width: 1.5, color: "#22c55e" },
          symbol: "none",
          silent: true,
        },
      ],
    });

    const onResize = () => chart.resize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      chart.dispose();
      chartInstance.current = null;
    };
  }, [timeSeries, baselineMinute]);

  return <div ref={chartRef} className="w-full h-[350px]" />;
}

// ─── Main Component ─────────────────────────────────────────────────

interface Props {
  departments: { id: string; name: string; code: string | null }[];
  canManage: boolean;
}

export function FlightRiskClient({ departments }: Props) {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [employees, setEmployees] = useState<FlightRiskEmployee[]>([]);
  const [totalScanned, setTotalScanned] = useState(0);
  const [departmentId, setDepartmentId] = useState("");

  // Detail panel state
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailTimeSeries, setDetailTimeSeries] = useState<
    EmployeeCheckInTimeSeries[]
  >([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // AI analysis state
  const [aiContent, setAiContent] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Load initial employees
  useEffect(() => {
    if (scanned || isScanning) return;
    setInitialLoading(true);
    getInitialEmployees(departmentId === "all" ? undefined : departmentId)
      .then((data) => setEmployees(data))
      .catch(() => toast.error("Không thể tải danh sách nhân viên"))
      .finally(() => setInitialLoading(false));
  }, [departmentId, scanned, isScanning]);

  const handleScan = useCallback(async () => {
    setIsScanning(true);
    setScanned(false);
    setScanProgress(0);
    setExpandedId(null);
    setAiContent(null);

    // Fake progress animation
    const interval = setInterval(() => {
      setScanProgress((p) => {
        if (p >= 90) {
          clearInterval(interval);
          return 90;
        }
        return p + Math.random() * 15;
      });
    }, 200);

    try {
      const result = await scanFlightRisk(departmentId || undefined);
      clearInterval(interval);
      setScanProgress(100);

      if (!result.success) {
        toast.error(result.error || "Có lỗi xảy ra khi quét");
        return;
      }

      setEmployees(result.employees);
      setTotalScanned(result.totalScanned);
      setScanned(true);
      toast.success(
        `Đã quét ${result.totalScanned} nhân viên, phát hiện ${result.atRiskCount} có dấu hiệu bất thường`,
      );
    } catch {
      clearInterval(interval);
      toast.error("Có lỗi xảy ra khi quét");
    } finally {
      setIsScanning(false);
      setTimeout(() => setScanProgress(0), 500);
    }
  }, [departmentId]);

  const handleExpand = useCallback(
    async (empId: string) => {
      if (expandedId === empId) {
        setExpandedId(null);
        return;
      }
      setExpandedId(empId);
      setDetailLoading(true);
      setDetailTimeSeries([]);
      try {
        const result = await getEmployeeFlightRiskDetail(empId);
        if (result.success) {
          setDetailTimeSeries(result.timeSeries);
        }
      } catch {
        /* ignore */
      } finally {
        setDetailLoading(false);
      }
    },
    [expandedId],
  );

  const handleAIAnalysis = useCallback(async () => {
    const atRisk = employees.filter((e) => e.riskScore >= 30);
    if (atRisk.length === 0) {
      toast.info("Không có nhân viên nào đủ ngưỡng để phân tích");
      return;
    }
    setAiLoading(true);
    try {
      const result = await analyzeFlightRiskWithAI(atRisk.slice(0, 10));
      if (result.success) {
        setAiContent(result.content as string);
      } else {
        toast.error(result.error || "Không thể kết nối AI");
      }
    } catch {
      toast.error("Lỗi kết nối AI Service");
    } finally {
      setAiLoading(false);
    }
  }, [employees]);

  const atRiskCount = employees.filter((e) => e.riskScore >= 30).length;
  const criticalCount = employees.filter(
    (e) => e.riskLevel === "CRITICAL",
  ).length;
  const topDept = (() => {
    const map = new Map<string, number>();
    for (const e of employees.filter((e) => e.riskScore >= 30)) {
      const d = e.department || "N/A";
      map.set(d, (map.get(d) ?? 0) + 1);
    }
    let max = 0,
      name = "—";
    for (const [k, v] of map) {
      if (v > max) {
        max = v;
        name = k;
      }
    }
    return name;
  })();

  const [isInjecting, setIsInjecting] = useState(false);

  const handleInjectMock = async () => {
    setIsInjecting(true);
    try {
      const res = await injectMockData104();
      if (res.success) {
        toast.success("Đã tiêm Mock Data cho NV 104 (đi trễ liên tục 2 tuần)");
        setInitialLoading(true);
        const data = await getInitialEmployees(
          departmentId === "all" ? undefined : departmentId,
        );
        setEmployees(data);
        setScanned(false);
        setInitialLoading(false);
      } else {
        toast.error(res.error || "Lỗi tiêm Mock Data");
      }
    } catch {
      toast.error("Lỗi hệ thống");
    } finally {
      setIsInjecting(false);
    }
  };

  return (
    <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
      <div className="w-full min-h-0 h-full min-w-0 flex flex-col relative">
        {/* Header */}
        <section className="shrink-0">
          <header className="p-2 flex items-center h-10 border-b justify-between">
            <h1 className="font-bold truncate">Phát hiện nhân sự nghỉ việc</h1>

            <div className="flex items-center gap-1 shrink-0">
              {scanned && (
                <>
                  <Badge
                    variant="outline"
                    className="text-[10px] gap-1 bg-blue-500/10 text-blue-600 border-blue-500/30"
                  >
                    <Users className="size-3" /> {totalScanned}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-[10px] gap-1 bg-red-500/10 text-red-600 border-red-500/30"
                  >
                    <ShieldAlert className="size-3" /> {atRiskCount}
                  </Badge>
                  {criticalCount > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] gap-1 bg-orange-500/10 text-orange-600 border-orange-500/30"
                    >
                      <TrendingUp className="size-3" /> {criticalCount}
                    </Badge>
                  )}
                </>
              )}
            </div>
          </header>

          {/* Toolbar */}
          <div className="flex items-center justify-end gap-2 px-2 py-2">
            <Select
              value={departmentId}
              onValueChange={setDepartmentId}
              disabled={isScanning}
            >
              <SelectTrigger size="sm" className="h-6!">
                <SelectValue placeholder="Tất cả phòng ban" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả phòng ban</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Separator orientation="vertical" className="h-4!" />

            <Button
              variant="outline"
              size="xs"
              onClick={handleInjectMock}
              disabled={isInjecting || isScanning}
              tooltip="Tiêm dữ liệu test"
            >
              {isInjecting ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <AlertTriangle className="size-3" />
              )}
              Mock
            </Button>

            <Button
              size="xs"
              onClick={handleScan}
              disabled={isScanning}
              className="bg-red-600 hover:bg-red-700 text-white"
              tooltip="Quét phát hiện rủi ro"
            >
              {isScanning ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <ShieldAlert className="size-3" />
              )}
              {isScanning ? "Đang quét..." : "Quét"}
            </Button>

            {scanned && atRiskCount > 0 && (
              <Button
                variant="outline"
                size="xs"
                onClick={handleAIAnalysis}
                disabled={aiLoading}
                tooltip="AI phân tích tổng hợp"
              >
                {aiLoading ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Brain className="size-3" />
                )}
                AI
              </Button>
            )}
          </div>

          {/* Scan progress bar */}
          {isScanning && (
            <div className="h-1 bg-muted overflow-hidden">
              <div
                className="h-full bg-red-500 transition-all duration-300 ease-out"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
          )}

          {/* AI Analysis Panel */}
          {aiContent && (
            <div className="border-b bg-purple-500/5 px-3 py-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-purple-700">
                  Phân tích AI
                </span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setAiContent(null)}
                  className="ml-auto"
                >
                  <X className="size-3" />
                </Button>
              </div>
              <div className="text-sm leading-relaxed max-h-[200px] overflow-y-auto overflow-x-hidden w-full break-words">
                <ReactMarkdown
                  components={MarkdownComponents}
                  remarkPlugins={[remarkGfm]}
                >
                  {aiContent}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </section>

        {/* Table */}
        <section className="flex-1 min-h-0 overflow-hidden">
          <div className="relative flex flex-col h-full">
            <div className="flex-1 min-h-0 relative">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-7 px-2" style={{ width: 260 }}>
                      Nhân viên
                    </TableHead>
                    <TableHead className="h-7 px-2" style={{ width: 160 }}>
                      Phòng ban
                    </TableHead>
                    <TableHead
                      className="h-7 px-2 text-center"
                      style={{ width: 130 }}
                    >
                      Risk Score
                    </TableHead>
                    <TableHead
                      className="h-7 px-2 text-center"
                      style={{ width: 130 }}
                    >
                      Check-in drift
                    </TableHead>
                    <TableHead
                      className="h-7 px-2 text-center"
                      style={{ width: 100 }}
                    >
                      Tỷ lệ trễ Δ
                    </TableHead>
                    <TableHead
                      className="h-7 px-2 text-center"
                      style={{ width: 100 }}
                    >
                      Tỷ lệ nghỉ Δ
                    </TableHead>
                    <TableHead
                      className="h-7 px-2 text-center"
                      style={{ width: 80 }}
                    >
                      OT giảm
                    </TableHead>
                    <TableHead className="h-7 px-2" style={{ width: 40 }} />
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {initialLoading && !isScanning && !scanned ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell className="p-2">
                          <Skeleton className="h-4 w-36" />
                        </TableCell>
                        <TableCell className="p-2">
                          <Skeleton className="h-3.5 w-24" />
                        </TableCell>
                        <TableCell className="p-2">
                          <Skeleton className="h-3.5 w-16 mx-auto" />
                        </TableCell>
                        <TableCell className="p-2">
                          <Skeleton className="h-3.5 w-14 mx-auto" />
                        </TableCell>
                        <TableCell className="p-2">
                          <Skeleton className="h-3.5 w-12 mx-auto" />
                        </TableCell>
                        <TableCell className="p-2">
                          <Skeleton className="h-3.5 w-12 mx-auto" />
                        </TableCell>
                        <TableCell className="p-2">
                          <Skeleton className="h-3.5 w-10 mx-auto" />
                        </TableCell>
                        <TableCell className="p-2" />
                      </TableRow>
                    ))
                  ) : employees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <ShieldAlert className="h-6 w-6 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            Không có nhân viên nào
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    employees.map((emp) => {
                      const isExpanded = expandedId === emp.userId;
                      return (
                        <EmployeeRow
                          key={emp.userId}
                          emp={emp}
                          isExpanded={isExpanded}
                          scanned={scanned}
                          detailLoading={detailLoading && isExpanded}
                          detailTimeSeries={isExpanded ? detailTimeSeries : []}
                          onToggle={() => {
                            if (scanned) handleExpand(emp.userId);
                            else
                              toast.info(
                                "Vui lòng Bấm Quét trước khi xem chi tiết",
                              );
                          }}
                        />
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Summary */}
            {!initialLoading && employees.length > 0 && (
              <div className="bg-background flex items-center justify-between px-2 py-2 border-t shrink-0">
                <p className="text-xs text-muted-foreground">
                  Hiển thị <strong>{employees.length}</strong> nhân viên
                  {scanned && (
                    <>
                      {" "}
                      · <strong className="text-red-600">
                        {atRiskCount}
                      </strong>{" "}
                      bất thường
                    </>
                  )}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

// ─── Employee Row Sub-Component ─────────────────────────────────────

function EmployeeRow({
  emp,
  isExpanded,
  scanned,
  detailLoading,
  detailTimeSeries,
  onToggle,
}: {
  emp: FlightRiskEmployee;
  isExpanded: boolean;
  scanned: boolean;
  detailLoading: boolean;
  detailTimeSeries: EmployeeCheckInTimeSeries[];
  onToggle: () => void;
}) {
  const [aiScript, setAiScript] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const handleGenerateScript = async () => {
    setAiLoading(true);
    try {
      const result = await generateStayInterviewScript(emp, detailTimeSeries);
      if (result.success && result.content) {
        setAiScript(result.content);
      } else {
        toast.error(result.error || "Lỗi tạo kịch bản");
      }
    } catch {
      toast.error("Lỗi hệ thống");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <>
      <TableRow
        onClick={onToggle}
        className={cn(
          "group/row cursor-pointer transition-all duration-200",
          RISK_ROW_BG[emp.riskLevel],
          emp.riskLevel === "CRITICAL" && "animate-pulse-subtle",
        )}
      >
        <TableCell className="p-2">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar
              className={cn(
                "size-8 shrink-0",
                (emp.riskLevel === "CRITICAL" || emp.riskLevel === "HIGH") &&
                  "animate-pulse ring-2 ring-red-500 ring-offset-1",
              )}
            >
              <AvatarImage src={emp.image || undefined} />
              <AvatarFallback className="text-xs">
                {emp.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="font-medium truncate">{emp.name}</span>
              <span className="text-[10px] text-muted-foreground truncate">
                {emp.position || emp.username}
              </span>
            </div>
          </div>
        </TableCell>
        <TableCell className="p-2 text-xs text-muted-foreground">
          {emp.department || "—"}
        </TableCell>
        <TableCell className="p-2 text-center">
          {scanned ? (
            <Badge
              variant="outline"
              className={cn("text-xs font-bold", RISK_COLORS[emp.riskLevel])}
            >
              {emp.riskScore} – {RISK_LABELS[emp.riskLevel]}
            </Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>
        <TableCell className="p-2 text-center">
          {scanned ? (
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "text-xs font-mono",
                  emp.signals.checkInDriftMinutes > 10
                    ? "text-red-600 font-bold"
                    : "text-muted-foreground",
                )}
              >
                {emp.signals.checkInDriftMinutes > 0 ? "+" : ""}
                {emp.signals.checkInDriftMinutes} phút
              </span>
              <span
                className={cn(
                  "text-[10px] text-muted-foreground mt-0.5",
                  emp.signals.zScore >= 2 ? "text-orange-600 font-medium" : "",
                )}
              >
                ({emp.signals.zScore > 0 ? "+" : ""}
                {emp.signals.zScore}σ)
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>
        <TableCell className="p-2 text-center">
          {scanned ? (
            <span
              className={cn(
                "text-xs font-mono",
                emp.signals.lateRateChange > 5
                  ? "text-red-600 font-bold"
                  : "text-muted-foreground",
              )}
            >
              {emp.signals.lateRateChange > 0 ? "+" : ""}
              {emp.signals.lateRateChange}%
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>
        <TableCell className="p-2 text-center">
          {scanned ? (
            <span
              className={cn(
                "text-xs font-mono",
                emp.signals.absentRateChange > 5
                  ? "text-red-600 font-bold"
                  : "text-muted-foreground",
              )}
            >
              {emp.signals.absentRateChange > 0 ? "+" : ""}
              {emp.signals.absentRateChange}%
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>
        <TableCell className="p-2 text-center">
          {scanned ? (
            <span
              className={cn(
                "text-xs font-mono",
                emp.signals.otDecline > 0.5
                  ? "text-orange-600 font-bold"
                  : "text-muted-foreground",
              )}
            >
              {emp.signals.otDecline > 0 ? "-" : ""}
              {emp.signals.otDecline}h
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>
        <TableCell className="p-2">
          {isExpanded ? (
            <ChevronUp className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
        </TableCell>
      </TableRow>

      {isExpanded && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={8} className="p-0">
            <div className="p-4 bg-muted/20 border-y space-y-4">
              {/* Comparison Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <CompareCard
                  label="Check-in TB"
                  before={minuteToTime(emp.baseline.avgCheckInMinute)}
                  after={minuteToTime(emp.recent.avgCheckInMinute)}
                  worse={emp.signals.checkInDriftMinutes > 10}
                />
                <CompareCard
                  label="Tỷ lệ trễ"
                  before={`${emp.baseline.lateRate}%`}
                  after={`${emp.recent.lateRate}%`}
                  worse={emp.signals.lateRateChange > 5}
                />
                <CompareCard
                  label="Tỷ lệ nghỉ"
                  before={`${emp.baseline.absentRate}%`}
                  after={`${emp.recent.absentRate}%`}
                  worse={emp.signals.absentRateChange > 5}
                />
                <CompareCard
                  label="OT TB/ngày"
                  before={`${emp.baseline.avgOtHours}h`}
                  after={`${emp.recent.avgOtHours}h`}
                  worse={emp.signals.otDecline > 0.5}
                />
              </div>

              {/* Chart & AI Script */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="bg-background rounded-lg border p-3 flex flex-col">
                  <h4 className="text-sm font-semibold mb-2">
                    Biểu đồ giờ check-in (180 ngày)
                  </h4>
                  {detailLoading ? (
                    <div className="flex items-center justify-center flex-1 min-h-[350px]">
                      <Loader2 className="size-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : detailTimeSeries.length > 0 ? (
                    <div className="flex-1">
                      <CheckInChart
                        timeSeries={detailTimeSeries}
                        baselineMinute={emp.baseline.avgCheckInMinute}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center flex-1 min-h-[350px] text-muted-foreground text-sm">
                      Không có dữ liệu
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    <span className="inline-block w-3 h-3 bg-red-500/10 border border-red-300 mr-1 align-middle" />{" "}
                    Vùng đỏ nhạt = 30 ngày gần nhất &nbsp;|&nbsp;
                    <span className="inline-block w-3 h-0.5 bg-green-500 mr-1 align-middle border-dashed border-t-2 border-green-500" />{" "}
                    Baseline trung bình
                  </p>
                </div>

                {/* AI Script Section */}
                <div className="bg-purple-500/5 rounded-lg border border-purple-500/20 p-4 flex flex-col max-h-110 w-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-purple-700">
                      <h4 className="text-sm font-semibold">
                        Kịch bản Phỏng vấn giữ chân
                      </h4>
                    </div>
                    {!aiScript && (
                      <Button
                        onClick={handleGenerateScript}
                        disabled={aiLoading || detailLoading}
                        size="xs"
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {aiLoading ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <Brain className="size-3" />
                        )}
                        Tạo kịch bản
                      </Button>
                    )}
                  </div>

                  {aiScript ? (
                    <ScrollArea className="text-sm leading-relaxed flex-1 overflow-y-auto overflow-x-hidden bg-background/50 rounded-md p-3 border w-full border-purple-500/10 wrap-break-word">
                      <ReactMarkdown
                        components={MarkdownComponents}
                        remarkPlugins={[remarkGfm]}
                      >
                        {aiScript}
                      </ReactMarkdown>
                    </ScrollArea>
                  ) : (
                    <div className="flex-1 w-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                      <Brain className="size-8 opacity-20 mb-2" />
                      <p className="text-sm text-wrap">
                        AI sẽ phân tích hành vi 30 ngày qua và gợi ý cách tiếp
                        cận, trò chuyện với nhân viên này để gỡ rối tâm lý.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// ─── Compare Card ───────────────────────────────────────────────────

function CompareCard({
  label,
  before,
  after,
  worse,
}: {
  label: string;
  before: string;
  after: string;
  worse: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        worse ? "border-red-300 bg-red-500/5" : "bg-background",
      )}
    >
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">{before}</span>
        <span className="text-xs">→</span>
        <span
          className={cn(
            "text-sm font-bold",
            worse ? "text-red-600" : "text-foreground",
          )}
        >
          {after}
        </span>
      </div>
    </div>
  );
}
