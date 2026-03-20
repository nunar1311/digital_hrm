"use client";

import {
    useRef,
    useState,
    useCallback,
    useEffect,
    useMemo,
} from "react";
import { Maximize2, Minimize2, RefreshCw } from "lucide-react";
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
import { GridStackOptions } from "gridstack";
import AddCardDialog from "./add-card-dialog";
import type {
    DashboardStats,
    AttendanceTrendItem,
    DepartmentDistributionItem,
} from "@/app/(protected)/dashboard/actions";
import type { GetEmployeesResult } from "@/app/(protected)/employees/actions";

interface DashboardClientProps {
    initialStats: DashboardStats;
    initialEmployees: GetEmployeesResult;
    attendanceTrendData: AttendanceTrendItem[];
    departmentData: DepartmentDistributionItem[];
}

const DashboardClient = ({
    initialStats,
    initialEmployees,
    attendanceTrendData,
    departmentData,
}: DashboardClientProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const mainRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [editMode, setEditMode] = useState(false);

    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState("");

    const toggleFullscreen = useCallback(async () => {
        try {
            const container = containerRef.current;
            if (!container) return;

            if (!document.fullscreenElement) {
                await container.requestFullscreen();
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
                    orientation:
                        pageWidth > pageHeight
                            ? "landscape"
                            : "portrait",
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
                pdf.rect(
                    0,
                    pageHeight - footerHeight,
                    pageWidth,
                    footerHeight,
                    "F",
                );

                pdf.setTextColor(100, 100, 100);
                pdf.setFontSize(10);
                pdf.text(
                    "Digital HRM - Hệ thống quản lý nhân sự",
                    20,
                    pageHeight - 25,
                );

                pdf.save(
                    `dashboard-${new Date().toISOString().split("T")[0]}.pdf`,
                );

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

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(Boolean(document.fullscreenElement));
        };

        document.addEventListener(
            "fullscreenchange",
            handleFullscreenChange,
        );
        return () => {
            document.removeEventListener(
                "fullscreenchange",
                handleFullscreenChange,
            );
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
                            total: initialStats.totalEmployees,
                            label: "nhân viên",
                            percentage: initialStats.totalPercentage,
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
                            total: initialStats.totalEmployeesWorking,
                            label: "nhân viên",
                            percentage:
                                initialStats.workingPercentage,
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
                            total: initialStats.newEmployees,
                            label: "nhân viên mới",
                            percentage: initialStats.newPercentage,
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
                            total: initialStats.resignedEmployees,
                            label: "nhân viên nghỉ",
                            percentage:
                                initialStats.resignedPercentage,
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
            ],
            lazyLoad: true,
        }),
        [
            attendanceTrendData,
            departmentData,
            initialEmployees,
            initialStats.newEmployees,
            initialStats.newPercentage,
            initialStats.resignedEmployees,
            initialStats.resignedPercentage,
            initialStats.totalEmployees,
            initialStats.totalEmployeesWorking,
            initialStats.totalPercentage,
            initialStats.workingPercentage,
        ],
    );

    return (
        <GridStackProvider
            initialOptions={gridOptions}
            editMode={editMode}
        >
            <div
                ref={containerRef}
                className="h-[calc(100vh-3rem)] flex flex-col overflow-hidden min-h-0"
            >
                <section className="flex flex-col overflow-hidden min-h-0">
                    <header className="border-b h-12 flex items-center justify-between px-2">
                        <h2 className="font-semibold">
                            Bảng điều khiển
                        </h2>

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
                                {isFullscreen ? (
                                    <Minimize2 />
                                ) : (
                                    <Maximize2 />
                                )}
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
                            <Label htmlFor="edit-mode">
                                Chế độ chỉnh sửa
                            </Label>
                        </div>
                        <div className="flex items-center gap-x-2">
                            <Button variant="ghost" size="xs">
                                <RefreshCw />
                                Làm mới
                            </Button>

                            <AddCardDialog />
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
        </GridStackProvider>
    );
};

export default DashboardClient;
