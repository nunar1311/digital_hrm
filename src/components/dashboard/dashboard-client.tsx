"use client";

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock7, Maximize2, Minimize2, RefreshCw } from "lucide-react";
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";
import { Button } from "../ui/button";
import DashboardDownload from "./dashboard-download";
import DashboardOption from "./dashboard-option";
import { toast } from "sonner";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import DashboardMain from "./dashboard-main";
import { PdfExportOverlay } from "./pdf-export-overlay";
import { GridStackProvider } from "@/providers/grid-stack-provider";
import { GridStackRenderProvider } from "@/providers/grid-stack-render-provider";
import { FullscreenCardProvider } from "@/contexts/fullscreen-card-context";
import { GridStackOptions } from "gridstack";
import AddCardDialog from "./add-card-dialog";
import {
  getDashboardStats,
  getAttendanceTrend,
  getDepartmentDistribution,
  getTurnoverRateTrend,
  getGenderDistribution,
  getTodayAttendanceSummary,
} from "@/app/(protected)/dashboard/actions";
import type {
  DashboardStats,
  AttendanceTrendItem,
  DepartmentDistributionItem,
  TurnoverTrendItem,
  GenderDistributionItem,
  TodayAttendanceSummary,
} from "@/app/(protected)/dashboard/actions";
import type { GetEmployeesResult } from "@/app/(protected)/employees/actions";
import { cn } from "@/lib/utils";
import { Separator } from "../ui/separator";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface DashboardClientProps {
  initialStats: DashboardStats;
  initialEmployees: GetEmployeesResult;
  attendanceTrendData: AttendanceTrendItem[];
  departmentData: DepartmentDistributionItem[];
  turnoverTrendData: TurnoverTrendItem[];
  genderData: GenderDistributionItem[];
  todayAttendanceData: TodayAttendanceSummary;
}

const DashboardClient = ({
  initialStats,
  initialEmployees,
  attendanceTrendData: attendanceTrendDataProp,
  departmentData: departmentDataProp,
  turnoverTrendData: turnoverTrendDataProp,
  genderData: genderDataProp,
  todayAttendanceData: todayAttendanceDataProp,
}: DashboardClientProps) => {
  const mainRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const queryClient = useQueryClient();

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("dashboard-auto-refresh") === "true";
    }
    return false;
  });
  const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Save auto-refresh to localStorage
  useEffect(() => {
    localStorage.setItem("dashboard-auto-refresh", String(autoRefresh));
  }, [autoRefresh]);

  // TanStack Query for dashboard data
  const { data: stats = initialStats, isRefetching: isRefetchingStats } =
    useQuery({
      queryKey: ["dashboard-stats"],
      queryFn: getDashboardStats,
      initialData: initialStats,
      staleTime: 0,
    });

  const {
    data: attendanceTrendData = attendanceTrendDataProp,
    isRefetching: isRefetchingTrend,
  } = useQuery({
    queryKey: ["dashboard-attendance-trend"],
    queryFn: getAttendanceTrend,
    initialData: attendanceTrendDataProp,
    staleTime: 0,
  });

  const {
    data: departmentData = departmentDataProp,
    isRefetching: isRefetchingDept,
  } = useQuery({
    queryKey: ["dashboard-department-distribution"],
    queryFn: getDepartmentDistribution,
    initialData: departmentDataProp,
    staleTime: 0,
  });

  const {
    data: turnoverTrendData = turnoverTrendDataProp,
    isRefetching: isRefetchingTurnover,
  } = useQuery({
    queryKey: ["dashboard-turnover-trend"],
    queryFn: getTurnoverRateTrend,
    initialData: turnoverTrendDataProp,
    staleTime: 0,
  });

  const {
    data: genderData = genderDataProp,
    isRefetching: isRefetchingGender,
  } = useQuery({
    queryKey: ["dashboard-gender-distribution"],
    queryFn: getGenderDistribution,
    initialData: genderDataProp,
    staleTime: 0,
  });

  const {
    data: todayAttendanceData = todayAttendanceDataProp,
    isRefetching: isRefetchingToday,
  } = useQuery({
    queryKey: ["dashboard-today-attendance"],
    queryFn: getTodayAttendanceSummary,
    initialData: todayAttendanceDataProp,
    staleTime: 0,
  });

  // Check if any query is refetching
  const isRefetching =
    isRefetchingStats ||
    isRefetchingTrend ||
    isRefetchingDept ||
    isRefetchingTurnover ||
    isRefetchingGender ||
    isRefetchingToday;

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      toast.error("Không thể chuyển sang chế độ toàn màn hình");
    }
  }, []);

  const handleExportPdf = useCallback(async () => {
    const element = mainRef.current;
    if (!element) {
      toast.error("Không tìm thấy nội dung để xuất");
      return;
    }

    if (!element.innerHTML.trim()) {
      toast.error("Nội dung trống, không thể xuất PDF");
      return;
    }

    // Export PDF
    const exportPdf = async () => {
      setExportProgress("Đang chuẩn bị dữ liệu...");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Temporarily expand the element to show all content
      const originalOverflow = element.style.overflow;
      const originalHeight = element.style.height;
      const originalMinHeight = element.style.minHeight;

      element.style.overflow = "visible";
      element.style.height = "auto";
      element.style.minHeight = "auto";

      // Force layout recalculation
      await new Promise((resolve) => setTimeout(resolve, 100));

      setExportProgress("Đang chuyển đổi sang hình ảnh...");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowHeight: element.scrollHeight,
        height: element.scrollHeight,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector(
            "[data-dashboard-export]",
          ) as HTMLElement | null;
          if (clonedElement) {
            clonedElement.style.overflow = "visible";
            clonedElement.style.height = "auto";
          }
          const style = clonedDoc.createElement("style");
          style.textContent = `
                        * {
                            color: #333333 !important;
                            background-color: #ffffff !important;
                            border-color: #e5e7eb !important;
                        }
                    `;
          clonedDoc.head.appendChild(style);
        },
      });

      setExportProgress("Đang tạo file PDF...");
      setTimeout(() => {
        // Restore original styles
        element.style.overflow = originalOverflow;
        element.style.height = originalHeight;
        element.style.minHeight = originalMinHeight;

        const pageWidth = canvas.width;
        const pageHeight = canvas.height;
        const headerHeight = 100;
        const footerHeight = 50;

        const pdf = new jsPDF({
          orientation: pageWidth > pageHeight ? "landscape" : "portrait",
          unit: "px",
          format: [pageWidth, pageHeight],
        });

        // Header background - light blue
        pdf.setFillColor(240, 248, 255);
        pdf.rect(0, 0, pageWidth, headerHeight, "F");

        // Left side - Company info
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(24);
        pdf.setFont("geist", "normal");
        pdf.text("Dashboard", 20, 50);

        // Right side - Report title
        pdf.setFontSize(20);
        pdf.setFont("geist", "normal");
        const today = new Date();
        const dateStr = `${today.toLocaleDateString("en-US")}`;
        pdf.text(dateStr, pageWidth - 20, 50, {
          align: "right",
        });

        // Content
        const imgData = canvas.toDataURL("image/png");
        pdf.addImage(
          imgData,
          "PNG",
          0,
          headerHeight,
          pageWidth,
          pageHeight - headerHeight - footerHeight,
        );

        // Footer
        pdf.setFillColor(248, 250, 252);
        pdf.rect(0, pageHeight - footerHeight, pageWidth, footerHeight, "F");

        pdf.setTextColor(100, 100, 100);
        pdf.setFontSize(10);
        pdf.text("Digital HRM - Hệ thống quản lý nhân sự", 20, pageHeight - 25);

        pdf.save(`dashboard-${new Date().toISOString().split("T")[0]}.pdf`);

        return true;
      }, 3000);
    };

    setIsExporting(true);
    try {
      await exportPdf();
    } catch (error) {
      toast.error(
        `Lỗi: ${error instanceof Error ? error.message : "Không thể xuất PDF"}`,
      );
    } finally {
      setIsExporting(false);
      setExportProgress("");
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    try {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["dashboard-stats"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["dashboard-attendance-trend"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["dashboard-department-distribution"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["dashboard-turnover-trend"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["dashboard-gender-distribution"],
        }),
      ]);
      setLastUpdated(new Date());
    } catch {
      toast.error("Không thể làm mới dữ liệu");
    }
  }, [queryClient]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const gridOptions: GridStackOptions = useMemo(
    () => ({
      acceptWidgets: true,
      row: 24,
      cellHeight: 53,
      margin: 8,
      animate: true,
      float: false,
      resizable: {
        handles: "w, s, e, n",
      },
      draggable: {
        handle: ".dragging",
      },
      children: [
        {
          id: "total-employees",
          w: 3,
          h: 4,
          minW: 2,
          minH: 3,
          content: JSON.stringify({
            name: "totalEmployees",
            props: {
              title: "Tổng nhân viên",
              total: stats.totalEmployees,
              label: "nhân viên",
              percentage: stats.totalPercentage,
            },
          }),
        },
        {
          id: "total-employees-working",
          w: 3,
          h: 4,
          minW: 2,
          minH: 3,
          content: JSON.stringify({
            name: "totalEmployeesWorking",
            props: {
              title: "Tổng nhân viên đang làm việc",
              total: stats.totalEmployeesWorking,
              label: "nhân viên",
              percentage: stats.workingPercentage,
            },
          }),
        },
        {
          id: "new-employees",
          w: 3,
          h: 4,
          minW: 2,
          minH: 3,
          content: JSON.stringify({
            name: "newEmployees",
            props: {
              title: "Tổng nhân viên mới",
              total: stats.newEmployees,
              label: "nhân viên mới",
              percentage: stats.newPercentage,
            },
          }),
        },
        {
          id: "resigned-employees",
          w: 3,
          h: 4,
          minW: 2,
          minH: 3,
          content: JSON.stringify({
            name: "resignedEmployees",
            props: {
              title: "Tổng nhân viên nghỉ",
              total: stats.resignedEmployees,
              label: "nhân viên nghỉ",
              percentage: stats.resignedPercentage,
            },
          }),
        },
        {
          id: "area-chart",
          x: 0,
          w: 6,
          h: 8,
          minW: 2,
          minH: 3,
          content: JSON.stringify({
            name: "cardChartAreaInteractive",
            props: { trendData: attendanceTrendData },
          }),
        },
        {
          id: "list-employees",
          x: 0,
          w: 8,
          h: 8,
          minW: 2,
          minH: 3,
          content: JSON.stringify({
            name: "listEmployees",
            props: {
              initialEmployees,
            },
          }),
        },
        {
          id: "pie-chart",
          w: 4,
          h: 8,
          minW: 2,
          minH: 3,
          content: JSON.stringify({
            name: "cardChartPie",
            props: { departmentData },
          }),
        },
        {
          id: "turnover-chart",
          w: 4,
          h: 8,
          minW: 2,
          minH: 3,
          content: JSON.stringify({
            name: "cardChartTurnoverRate",
            props: { trendData: turnoverTrendData },
          }),
        },
        {
          id: "gender-chart",
          w: 4,
          h: 8,
          minW: 2,
          minH: 3,
          content: JSON.stringify({
            name: "cardChartGender",
            props: { genderData: genderData },
          }),
        },
      ],
      lazyLoad: true,
    }),
    [
      attendanceTrendData,
      departmentData,
      turnoverTrendData,
      genderData,
      initialEmployees,
      stats.newEmployees,
      stats.newPercentage,
      stats.resignedEmployees,
      stats.resignedPercentage,
      stats.totalEmployees,
      stats.totalEmployeesWorking,
      stats.totalPercentage,
      stats.workingPercentage,
    ],
  );

  // Auto-refresh timer (60 seconds)
  useEffect(() => {
    if (autoRefresh) {
      autoRefreshTimerRef.current = setInterval(() => {
        queryClient.invalidateQueries({
          queryKey: ["dashboard-stats"],
        });
        queryClient.invalidateQueries({
          queryKey: ["dashboard-attendance-trend"],
        });
        queryClient.invalidateQueries({
          queryKey: ["dashboard-department-distribution"],
        });
        queryClient.invalidateQueries({
          queryKey: ["dashboard-turnover-trend"],
        });
        queryClient.invalidateQueries({
          queryKey: ["dashboard-gender-distribution"],
        });
        setLastUpdated(new Date());
      }, 60 * 1000);
    } else {
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current);
        autoRefreshTimerRef.current = null;
      }
    }

    return () => {
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current);
        autoRefreshTimerRef.current = null;
      }
    };
  }, [autoRefresh, queryClient]);

  return (
    <GridStackProvider initialOptions={gridOptions} editMode={editMode}>
      <FullscreenCardProvider>
        <div
          className={cn(
            "flex flex-col bg-background text-foreground",
            isFullscreen
              ? "fixed inset-0 z-40"
              : "h-[calc(100%)] overflow-hidden min-h-0",
          )}
        >
          <section className="flex flex-col overflow-hidden min-h-0">
            <header className="border-b h-12 flex items-center justify-between px-2">
              <h2 className="font-semibold">Bảng điều khiển</h2>

              <div className="shrink-0 flex items-center gap-x-2">
                <DashboardOption
                  onPrint={handleExportPdf}
                  isExporting={isExporting}
                />
                <DashboardDownload
                  onPrint={handleExportPdf}
                  isExporting={isExporting}
                />
                <Button
                  onClick={toggleFullscreen}
                  tooltip={
                    isFullscreen
                      ? "Thoát toàn màn hình"
                      : "Mở bảng điều khiển trên toàn màn hình"
                  }
                  size={"icon-sm"}
                  variant={"ghost"}
                >
                  {isFullscreen ? <Minimize2 /> : <Maximize2 />}
                </Button>
              </div>
            </header>
            <nav className="flex items-center justify-between p-2 border-b h-10">
              <div className="flex items-center gap-x-2">
                <Switch
                  id="edit-mode"
                  checked={editMode}
                  onCheckedChange={setEditMode}
                  className="h-4 w-6"
                />
                <Label htmlFor="edit-mode">Chế độ chỉnh sửa</Label>
              </div>
              <div className="flex items-center gap-x-2">
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={handleRefresh}
                  disabled={isRefetching}
                >
                  <RefreshCw className={cn(isRefetching && "animate-spin")} />

                  {isRefetching
                    ? "Đang tải..."
                    : `Làm mới ${
                        lastUpdated
                          ? formatDistanceToNow(lastUpdated, {
                              addSuffix: true,
                              locale: vi,
                            })
                          : "vừa xong"
                      }`}
                </Button>

                <Button
                  variant={autoRefresh ? "outline" : "ghost"}
                  size="xs"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={cn(
                    autoRefresh &&
                      "text-primary hover:text-primary bg-primary/10 hover:bg-primary/10",
                  )}
                  suppressHydrationWarning
                >
                  <Clock7 />
                  Tự động làm mới: {autoRefresh ? "Bật" : "Tắt"}
                </Button>

                <Separator orientation="vertical" className="h-4!" />

                <AddCardDialog
                  stats={stats}
                  attendanceTrendData={attendanceTrendData}
                  departmentData={departmentData}
                  turnoverTrendData={turnoverTrendData}
                  genderData={genderData}
                  initialEmployees={initialEmployees}
                  todayAttendanceData={todayAttendanceData}
                />
              </div>
            </nav>
          </section>
          <main
            ref={mainRef}
            data-dashboard-export
            className="flex flex-1 min-h-0 overflow-auto"
          >
            <GridStackRenderProvider>
              <DashboardMain />
            </GridStackRenderProvider>
          </main>
          <PdfExportOverlay
            isOpen={isExporting}
            progress={exportProgress}
            onCancel={() => setIsExporting(false)}
          />
        </div>
      </FullscreenCardProvider>
    </GridStackProvider>
  );
};

export default DashboardClient;
