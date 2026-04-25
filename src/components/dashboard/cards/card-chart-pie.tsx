"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { EChartsOption } from "echarts";
import ReactEChartsCore from "echarts-for-react/lib/core";
import * as echarts from "echarts/core";
import { PieChart } from "echarts/charts";
import { TooltipComponent, LegendComponent } from "echarts/components";
import { LabelLayout } from "echarts/features";
import { CanvasRenderer, SVGRenderer } from "echarts/renderers";
import {
  useExtendedChartColors,
  useThemeColor,
} from "@/hooks/use-chart-colors";
import CardToolbar from "./card-toolbar";
import type { DepartmentDistributionItem } from "@/app/(protected)/dashboard/actions";
import { useFullscreenCardContext } from "@/contexts/fullscreen-card-context";
import { useGridStackWidgetContext } from "@/contexts/grid-stack-widget-context";
import { cardRegistry } from "@/contexts/fullscreen-card-registry";
import { DepartmentEmployeesClient } from "@/app/(protected)/departments/[id]/department-employees-client";
import { ChartPie } from "lucide-react";
import { useRouter } from "next/navigation";

// Register required ECharts modules
echarts.use([
  PieChart,
  TooltipComponent,
  LegendComponent,
  LabelLayout,
  SVGRenderer,
]);

interface CardChartPieProps {
  departmentData: DepartmentDistributionItem[];
}

const CardChartPie = ({ departmentData }: CardChartPieProps) => {
  const router = useRouter();
  const [showLegend, setShowLegend] = useState(true);
  const [selectedDept, setSelectedDept] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const colors = useExtendedChartColors(departmentData.length);
  const bgColor = useThemeColor("background");
  const accentColor = useThemeColor("accent");
  const accentFgColor = useThemeColor("accent-foreground");
  const cardColor = useThemeColor("card");

  const {
    openFullscreen,
    fullscreenOpen,
    currentFullscreenCardId,
    setCardSidebarOpen,
  } = useFullscreenCardContext();
  const { widget } = useGridStackWidgetContext() ?? {
    widget: null,
  };
  const isCurrentlyFullscreen =
    fullscreenOpen && widget?.id === currentFullscreenCardId;

  const option = useMemo(
    () =>
      ({
        tooltip: {
          trigger: "item" as const,
          confine: true,
          formatter: (params: {
            color: string;
            name: string;
            percent: number;
            value: number;
          }) =>
            `<span style="display:inline-block;width:8px;height:8px;border-radius:10%;background:${params.color};margin-right:6px;vertical-align:middle;"></span>${params.name}: <strong>${params.percent}%</strong> (${params.value})`,
          backgroundColor: accentColor,
          borderColor: accentColor,
          textStyle: {
            color: accentFgColor,
            fontSize: 11,
            fontFamily: "Roboto",
          },
          borderRadius: 8,
          padding: [4, 8],
        },
        legend: {
          show: showLegend,
          orient: "horizontal" as const,
          bottom: 0,
          type: "scroll" as const,
          textStyle: {
            fontSize: 11,
            color: accentFgColor,
            fontFamily: "Roboto",
          },
          itemWidth: 12,
          itemHeight: 12,
          itemGap: 12,
        },
        color: colors,
        series: [
          {
            type: "pie",
            selectedMode: "single",
            animationDuration: 0,
            radius: ["0%", "70%"],
            avoidLabelOverlap: true,
            selectedOffset: 15,
            itemStyle: {
              borderRadius: 5,
              borderColor: cardColor,
              borderWidth: 2,
            },
            // Outside labels with leader lines (matching reference design)
            label: {
              show: true,
              formatter: "{b}: {c}",
              fontWeight: "bold",
              fontFamily: "Roboto",
              lineHeight: 16,
              fontSize: 11,
              color: accentFgColor,
              overflow: "break",
              lineOverflow: "truncate",
            },
            labelLayout: {
              hideOverlap: true,
            },
            labelLine: {},
            emphasis: {
              focus: "self",
              scale: false,
            },
            blur: {
              itemStyle: { opacity: 0.6 },
              label: { opacity: 0.6 },
              labelLine: {
                lineStyle: { opacity: 0.6 },
              },
            },
            data: departmentData.map((item, i) => {
              const color = colors[i] ?? colors[i % colors.length];
              return {
                name: item.department,
                value: item.count,
                selected: selectedDept?.id === item.id,
                itemStyle: {
                  color: color,
                },
                emphasis: {
                  itemStyle: { color: color },
                },
                select: {
                  itemStyle: { color: color },
                },
                blur: {
                  // Only override color here (prevents CSS variable → white bug).
                  // Opacity is inherited from series-level blur above.
                  itemStyle: { color: color },
                },
              };
            }),
          },
        ],
      }) as EChartsOption,
    [
      departmentData,
      colors,
      bgColor,
      accentColor,
      accentFgColor,
      selectedDept,
      isCurrentlyFullscreen,
      showLegend,
    ],
  );

  const chartRefs = useRef<ReactEChartsCore[]>([]);

  useEffect(() => {
    if (!fullscreenOpen) {
      setSelectedDept(null);
      // Wait for React to apply setSelectedDept(null) before dispatching to ECharts
      setTimeout(() => {
        chartRefs.current.forEach((ref) => {
          try {
            const chart = ref.getEchartsInstance();
            // Create an array of all indices to explicitly unselect and downplay everything
            const allIndices = departmentDataRef.current.map((_, i) => i);
            chart.dispatchAction({
              type: "unselect",
              seriesIndex: 0,
              dataIndex: allIndices,
            });
            chart.dispatchAction({
              type: "downplay",
              seriesIndex: 0,
              dataIndex: allIndices,
            });
          } catch (e) {
            // Ignore errors for unmounted/disposed charts
          }
        });
      }, 0);
    }
  }, [fullscreenOpen]);

  const handleClick = useCallback(
    (withSidebar = false) => {
      const allCards = cardRegistry.getAll();
      let idx = -1;
      if (widget?.id) {
        idx = allCards.findIndex((c) => c.id === widget.id);
      }
      if (idx === -1) {
        idx = allCards.findIndex(
          (c) => c.title === "Phân bổ nhân viên theo phòng ban",
        );
      }
      if (idx >= 0) {
        openFullscreen(idx, withSidebar);
      }
    },
    [widget?.id, openFullscreen],
  );

  // Keep a stable ref to the latest handleClick so the memoized
  // onEvents callback never calls a stale version.
  const handleClickRef = useRef(handleClick);
  handleClickRef.current = handleClick;

  const departmentDataRef = useRef(departmentData);
  departmentDataRef.current = departmentData;

  // Track fullscreen state in a ref so the stable onEvents callback
  // can read the latest value without needing to be recreated.
  const isCurrentlyFullscreenRef = useRef(isCurrentlyFullscreen);
  isCurrentlyFullscreenRef.current = isCurrentlyFullscreen;

  const setCardSidebarOpenRef = useRef(setCardSidebarOpen);
  setCardSidebarOpenRef.current = setCardSidebarOpen;

  const onEvents = useMemo(
    () => ({
      click: (params: any) => {
        const dept = departmentDataRef.current.find(
          (d) => d.department === params.name,
        );
        if (dept) {
          if (isCurrentlyFullscreenRef.current) {
            // Already in fullscreen — set selection immediately so the
            // sidebar updates without needing a second click.
            setSelectedDept({ id: dept.id, name: dept.department });
            // Ensure the sidebar panel is visible
            setCardSidebarOpenRef.current(true);
          } else {
            // 1. Open fullscreen FIRST → triggers instant card hide
            handleClickRef.current(true);
            cardRegistry.forceNotify();

            // 2. Defer selection so the push-out animation only plays
            //    inside the fullscreen dialog (dashboard card is already hidden)
            requestAnimationFrame(() => {
              setSelectedDept({ id: dept.id, name: dept.department });
            });
          }
        }
      },
    }),
    // Stable — refs ensure fresh data without re-creating the handler
    [],
  );

  return (
    <CardToolbar
      title="Phân bổ nhân viên theo phòng ban"
      onRefresh={() => {
        router.refresh();
      }}
      showLegend={showLegend}
      onToggleLegend={setShowLegend}
      fullscreenSidebarContent={
        selectedDept ? (
          <div className="w-full h-full flex flex-col min-h-0 bg-background overflow-hidden relative">
            <DepartmentEmployeesClient
              departmentId={selectedDept.id}
              departmentName={selectedDept.name}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-2 items-center justify-center h-full w-full text-muted-foreground text-sm">
            <ChartPie className="h-10 w-10" />
            <p>Chọn vào một phần của biểu đồ để xem chi tiết...</p>
          </div>
        )
      }
    >
      {/* <div className="h-full w-full"> */}
      <ReactEChartsCore
        ref={(node) => {
          if (node && !chartRefs.current.includes(node)) {
            chartRefs.current.push(node);
          }
        }}
        echarts={echarts}
        option={option}
        style={{ height: "100%", width: "100%" }}
        opts={{ renderer: "canvas" }}
        lazyUpdate={true}
        onEvents={onEvents}
      />
      {/* </div> */}
    </CardToolbar>
  );
};

export default CardChartPie;
