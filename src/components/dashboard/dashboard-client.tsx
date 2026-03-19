"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Maximize2, Minimize2, RefreshCw } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { Button } from "../ui/button";
import DashboardDownload from "./dashboard-download";
import DashboardOption from "./dashboard-option";
import { toast } from "sonner";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import DashboardMain from "./dashboard-main";

/** Light and dark theme CSS variables (mirrors globals.css + ThemesProvider dynamic values). */
const LIGHT_THEME_OVERRIDE = [
    "--background: #ffffff",
    "--foreground: #1a1a1a",
    "--card: #ffffff",
    "--card-foreground: #1a1a1a",
    "--popover: #ffffff",
    "--popover-foreground: #1a1a1a",
    "--primary: #1a1a1a",
    "--primary-foreground: #ffffff",
    "--secondary: #f4f4f5",
    "--secondary-foreground: #1a1a1a",
    "--muted: #f4f4f5",
    "--muted-foreground: #71717a",
    "--accent: #f4f4f5",
    "--accent-foreground: #1a1a1a",
    "--destructive: #dc2626",
    "--border: #e4e4e7",
    "--input: #e4e4e7",
    "--ring: #a1a1aa",
    "--chart-1: #a1a1aa",
    "--chart-2: #a1a1aa",
    "--chart-3: #a1a1aa",
    "--chart-4: #a1a1aa",
    "--chart-5: #a1a1aa",
    "--sidebar: #fafafa",
    "--sidebar-foreground: #1a1a1a",
    "--sidebar-primary: #1a1a1a",
    "--sidebar-primary-foreground: #ffffff",
    "--sidebar-accent: #f4f4f5",
    "--sidebar-accent-foreground: #1a1a1a",
    "--sidebar-border: #e4e4e7",
    "--sidebar-ring: #a1a1aa",
    "--radius: 0.625rem",
].join("; ");

const DARK_THEME_OVERRIDE = [
    "--background: #09090b",
    "--foreground: #fafafa",
    "--card: #18181b",
    "--card-foreground: #fafafa",
    "--popover: #18181b",
    "--popover-foreground: #fafafa",
    "--primary: #fafafa",
    "--primary-foreground: #18181b",
    "--secondary: #27272a",
    "--secondary-foreground: #fafafa",
    "--muted: #27272a",
    "--muted-foreground: #a1a1aa",
    "--accent: #27272a",
    "--accent-foreground: #fafafa",
    "--destructive: #b91c1c",
    "--border: rgba(255, 255, 255, 0.1)",
    "--input: rgba(255, 255, 255, 0.15)",
    "--ring: #a1a1aa",
    "--chart-1: #818cf8",
    "--chart-2: #34d399",
    "--chart-3: #fbbf24",
    "--chart-4: #f87171",
    "--chart-5: #c084fc",
    "--sidebar: #18181b",
    "--sidebar-foreground: #fafafa",
    "--sidebar-primary: #818cf8",
    "--sidebar-primary-foreground: #ffffff",
    "--sidebar-accent: #27272a",
    "--sidebar-accent-foreground: #fafafa",
    "--sidebar-border: rgba(255, 255, 255, 0.1)",
    "--sidebar-ring: #a1a1aa",
].join("; ");

const EXPLICIT_COLOR_RULES = [
    "*:not([style]) { color: inherit !important; background-color: inherit !important; }",
    "* { color: inherit !important; background-color: inherit !important; }",
].join(" ");

const DashboardClient = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const mainRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [editMode, setEditMode] = useState(false);

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
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff",
                onclone: (clonedDoc) => {
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

            const pageWidth = canvas.width;
            const pageHeight = canvas.height;
            const headerHeight = 80;
            const footerHeight = 40;

            const pdf = new jsPDF({
                orientation:
                    pageWidth > pageHeight ? "landscape" : "portrait",
                unit: "px",
                format: [pageWidth, pageHeight],
            });

            // Header background - light blue
            pdf.setFillColor(240, 248, 255);
            pdf.rect(0, 0, pageWidth, headerHeight, "F");

            // Left side - Company info
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(24);
            pdf.setFont("geist", "semibold");
            pdf.text("Dashboard", 20, 20);

            // Right side - Report title
            pdf.setFontSize(20);
            pdf.setFont("geist", "normal");
            const today = new Date();
            const dateStr = `${today.toLocaleDateString("en-US")}`;
            pdf.text(dateStr, pageWidth - 20, 50, { align: "right" });

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
            pdf.text("Trang 1", pageWidth - 20, pageHeight - 25, {
                align: "right",
            });

            pdf.save(
                `dashboard-${new Date().toISOString().split("T")[0]}.pdf`,
            );

            return true;
        };

        toast.promise(exportPdf(), {
            loading: "Đang xuất PDF...",
            success: "Xuất PDF thành công",
            error: (error) =>
                `Lỗi: ${error instanceof Error ? error.message : "Không thể xuất PDF"}`,
        });
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

    return (
        <div
            ref={containerRef}
            className="h-[calc(100vh-3rem)] flex flex-col overflow-hidden min-h-0"
        >
            <section className="flex flex-col overflow-hidden min-h-0">
                <header className="border-b h-12 flex items-center justify-between px-2">
                    <h2 className="font-semibold">Bảng điều khiển</h2>

                    <div className="shrink-0 flex items-center gap-x-2">
                        <DashboardOption onPrint={handleExportPdf} />
                        <DashboardDownload
                            onPrint={handleExportPdf}
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
                    </div>
                </nav>
            </section>
            <main
                ref={mainRef}
                className="flex flex-1 min-h-0 overflow-auto"
            >
                <DashboardMain editMode={editMode} />
            </main>
        </div>
    );
};

export default DashboardClient;
