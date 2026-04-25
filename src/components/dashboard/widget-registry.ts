import type {
  DashboardStats,
  AttendanceTrendItem,
  DepartmentDistributionItem,
  TurnoverTrendItem,
  GenderDistributionItem,
  TodayAttendanceSummary,
  ContractExpiryDashboardItem,
} from "@/app/(protected)/dashboard/actions";
import type { GetEmployeesResult } from "@/app/(protected)/employees/actions";

// ─── Saved Widget (minimal data stored in DB) ─────────────────────
export interface SavedWidget {
  widgetType: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

// ─── All fresh data needed to build widget content ────────────────
export interface DashboardDataContext {
  stats: DashboardStats;
  initialEmployees: GetEmployeesResult;
  attendanceTrendData: AttendanceTrendItem[];
  departmentData: DepartmentDistributionItem[];
  turnoverTrendData: TurnoverTrendItem[];
  genderData: GenderDistributionItem[];
  todayAttendanceData: TodayAttendanceSummary;
  contractExpiryWarnings: ContractExpiryDashboardItem[];
}

// ─── Widget Type Registry ─────────────────────────────────────────
// Maps widgetType → component name, default sizes
export const WIDGET_REGISTRY: Record<
  string,
  { componentName: string; defaultW: number; defaultH: number; minW: number; minH: number }
> = {
  "ai-executive-summary": { componentName: "cardAIExecutiveSummary", defaultW: 6, defaultH: 6, minW: 3, minH: 4 },
  "total-employees":      { componentName: "totalEmployees",        defaultW: 3, defaultH: 3, minW: 2, minH: 3 },
  "new-employees":        { componentName: "newEmployees",          defaultW: 3, defaultH: 3, minW: 2, minH: 3 },
  "total-employees-working": { componentName: "totalEmployeesWorking", defaultW: 3, defaultH: 3, minW: 2, minH: 3 },
  "resigned-employees":   { componentName: "resignedEmployees",     defaultW: 3, defaultH: 3, minW: 2, minH: 3 },
  "pie-chart":            { componentName: "cardChartPie",          defaultW: 5, defaultH: 9, minW: 2, minH: 3 },
  "turnover-chart":       { componentName: "cardChartTurnoverRate", defaultW: 4, defaultH: 9, minW: 2, minH: 3 },
  "gender-chart":         { componentName: "cardChartGender",       defaultW: 3, defaultH: 9, minW: 2, minH: 3 },
  "list-employees":       { componentName: "listEmployees",         defaultW: 7, defaultH: 9, minW: 2, minH: 3 },
  "area-chart":           { componentName: "cardChartAreaInteractive", defaultW: 5, defaultH: 9, minW: 2, minH: 3 },
  "timesheet-summary":    { componentName: "cardTimesheetSummary",  defaultW: 6, defaultH: 6, minW: 3, minH: 4 },
  "contract-expiry-list": { componentName: "cardContractExpiryList", defaultW: 4, defaultH: 8, minW: 2, minH: 3 },
};

// ─── Build widget content (component name + fresh props) ──────────
export function buildWidgetContent(
  widgetType: string,
  data: DashboardDataContext,
): string {
  switch (widgetType) {
    case "total-employees":
      return JSON.stringify({
        name: "totalEmployees",
        props: { title: "Tổng nhân viên", total: data.stats.totalEmployees, label: "nhân viên", percentage: data.stats.totalPercentage },
      });
    case "new-employees":
      return JSON.stringify({
        name: "newEmployees",
        props: { title: "Tổng nhân viên mới", total: data.stats.newEmployees, label: "nhân viên mới", percentage: data.stats.newPercentage },
      });
    case "total-employees-working":
      return JSON.stringify({
        name: "totalEmployeesWorking",
        props: { title: "Tổng nhân viên đang làm việc", total: data.stats.totalEmployeesWorking, label: "nhân viên", percentage: data.stats.workingPercentage },
      });
    case "resigned-employees":
      return JSON.stringify({
        name: "resignedEmployees",
        props: { title: "Tổng nhân viên nghỉ", total: data.stats.resignedEmployees, label: "nhân viên nghỉ", percentage: data.stats.resignedPercentage },
      });
    case "pie-chart":
      return JSON.stringify({ name: "cardChartPie", props: { departmentData: data.departmentData } });
    case "turnover-chart":
      return JSON.stringify({ name: "cardChartTurnoverRate", props: { trendData: data.turnoverTrendData } });
    case "gender-chart":
      return JSON.stringify({ name: "cardChartGender", props: { genderData: data.genderData } });
    case "list-employees":
      return JSON.stringify({ name: "listEmployees", props: { initialEmployees: data.initialEmployees } });
    case "area-chart":
      return JSON.stringify({ name: "cardChartAreaInteractive", props: { trendData: data.attendanceTrendData } });
    case "ai-executive-summary":
      return JSON.stringify({ name: "cardAIExecutiveSummary", props: {} });
    case "timesheet-summary":
      return JSON.stringify({ name: "cardTimesheetSummary", props: { summaryData: data.todayAttendanceData } });
    case "contract-expiry-list":
      return JSON.stringify({ name: "cardContractExpiryList", props: { items: data.contractExpiryWarnings } });
    default:
      return JSON.stringify({ name: "cardComingSoon", props: { title: widgetType } });
  }
}

// ─── Default layout (used when user has no saved layout) ──────────
export const DEFAULT_LAYOUT: SavedWidget[] = [
  { widgetType: "ai-executive-summary",    x: 0, y: 0,  w: 6, h: 6 },
  { widgetType: "total-employees",         x: 6, y: 0,  w: 3, h: 3 },
  { widgetType: "new-employees",           x: 9, y: 0,  w: 3, h: 3 },
  { widgetType: "total-employees-working", x: 6, y: 3,  w: 3, h: 3 },
  { widgetType: "resigned-employees",      x: 9, y: 3,  w: 3, h: 3 },
  { widgetType: "pie-chart",               x: 0, y: 6,  w: 5, h: 9 },
  { widgetType: "turnover-chart",          x: 5, y: 6,  w: 4, h: 9 },
  { widgetType: "gender-chart",            x: 9, y: 6,  w: 3, h: 9 },
  { widgetType: "list-employees",          x: 0, y: 15, w: 7, h: 9 },
  { widgetType: "area-chart",              x: 7, y: 15, w: 5, h: 9 },
];

// ─── Extract widgetType from GridStack widget ID ──────────────────
// Default: "pie-chart" → "pie-chart"
// Dynamic: "pie-chart__1714xxx" → "pie-chart"
export function getWidgetType(widgetId: string): string {
  return widgetId.includes("__") ? widgetId.split("__")[0] : widgetId;
}

// ─── Build GridStack children from saved layout + fresh data ──────
export function buildGridStackChildren(
  layout: SavedWidget[],
  data: DashboardDataContext,
) {
  // Safety guard: ensure layout is a valid array
  if (!Array.isArray(layout) || layout.length === 0) {
    return buildGridStackChildren(DEFAULT_LAYOUT, data);
  }

  return layout.map((item, index) => {
    const reg = WIDGET_REGISTRY[item.widgetType];
    const content = buildWidgetContent(item.widgetType, data);
    // For dynamic widgets (duplicates), use index-based unique ID
    const isDefault = DEFAULT_LAYOUT.some(
      (d) => d.widgetType === item.widgetType && d.x === item.x && d.y === item.y,
    );
    const id = isDefault
      ? item.widgetType
      : `${item.widgetType}__${index}`;

    return {
      id,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      minW: reg?.minW ?? 2,
      minH: reg?.minH ?? 3,
      content,
    };
  });
}
