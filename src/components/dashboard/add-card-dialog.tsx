"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import {
  Plus,
  User,
  Users,
  UserPlus,
  UserMinus,
  PieChart as PieChartIcon,
  LineChart,
  Activity,
  Star,
  LayoutDashboard,
  Calculator,
  List,
  Blocks,
  Puzzle,
  HelpCircle,
  Video,
  BookOpen,
  Search,
  X,
  CalendarCheck,
  Sparkles,
  Building2,
  CalendarRange,
  Clock,
  HandCoins,
  GraduationCap,
} from "lucide-react";
import { useGridStackContext } from "@/contexts/grid-stack-context";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";
import type {
  DashboardStats, AttendanceTrendItem, DepartmentDistributionItem,
  TurnoverTrendItem, GenderDistributionItem, TodayAttendanceSummary,
} from "@/app/[locale]/(protected)/dashboard/actions";
import type { GetEmployeesResult } from "@/app/[locale]/(protected)/employees/actions";

interface AddCardDialogProps {
  stats: DashboardStats;
  attendanceTrendData: AttendanceTrendItem[];
  departmentData: DepartmentDistributionItem[];
  turnoverTrendData: TurnoverTrendItem[];
  genderData: GenderDistributionItem[];
  initialEmployees: GetEmployeesResult;
  todayAttendanceData: TodayAttendanceSummary;
}

// Map color strings to tailwind classes
const coverColors: Record<string, string> = {
  purple: "bg-purple-500",
  blue: "bg-blue-500",
  yellow: "bg-amber-400",
  red: "bg-rose-500",
  green: "bg-emerald-500",
  orange: "bg-orange-500",
  indigo: "bg-indigo-500",
  teal: "bg-teal-500",
  pink: "bg-pink-500",
};

let widgetIdSeed = 0;

const createWidgetId = () => {
  widgetIdSeed += 1;
  return `widget-${widgetIdSeed}`;
};

type TemplateItem = {
  id: string;
  nameKey: string;
  descriptionKey: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  color: string;
  w: number;
  h: number;
  minW: number;
  minH: number;
  category: string;
  badge: string;
};

const templates: TemplateItem[] = [
  {
    id: "total-employees",
    nameKey: "templateTotalEmployeesName",
    descriptionKey: "templateTotalEmployeesDesc",
    icon: User,
    color: "purple",
    w: 3,
    h: 4,
    minW: 2,
    minH: 3,
    category: "stats",
    badge: "Business",
  },
  {
    id: "total-employees-working",
    nameKey: "templateActiveEmployeesName",
    descriptionKey: "templateActiveEmployeesDesc",
    icon: Users,
    color: "blue",
    w: 3,
    h: 4,
    minW: 2,
    minH: 3,
    category: "stats",
    badge: "",
  },
  {
    id: "new-employees",
    nameKey: "templateNewEmployeesName",
    descriptionKey: "templateNewEmployeesDesc",
    icon: UserPlus,
    color: "green",
    w: 3,
    h: 4,
    minW: 2,
    minH: 3,
    category: "stats",
    badge: "",
  },
  {
    id: "resigned-employees",
    nameKey: "templateResignedEmployeesName",
    descriptionKey: "templateResignedEmployeesDesc",
    icon: UserMinus,
    color: "red",
    w: 3,
    h: 4,
    minW: 2,
    minH: 3,
    category: "stats",
    badge: "",
  },
  {
    id: "area-chart",
    nameKey: "templateAttendanceTrendName",
    descriptionKey: "templateAttendanceTrendDesc",
    icon: Activity,
    color: "indigo",
    w: 6,
    h: 8,
    minW: 2,
    minH: 3,
    category: "charts",
    badge: "Unlimited",
  },
  {
    id: "pie-chart",
    nameKey: "templateDepartmentDistributionName",
    descriptionKey: "templateDepartmentDistributionDesc",
    icon: PieChartIcon,
    color: "orange",
    w: 4,
    h: 8,
    minW: 2,
    minH: 3,
    category: "charts",
    badge: "",
  },
  {
    id: "turnover-chart",
    nameKey: "templateTurnoverName",
    descriptionKey: "templateTurnoverDesc",
    icon: LineChart,
    color: "pink",
    w: 4,
    h: 8,
    minW: 2,
    minH: 3,
    category: "charts",
    badge: "",
  },
  {
    id: "gender-chart",
    nameKey: "templateGenderDistributionName",
    descriptionKey: "templateGenderDistributionDesc",
    icon: PieChartIcon,
    color: "teal",
    w: 4,
    h: 8,
    minW: 2,
    minH: 3,
    category: "charts",
    badge: "",
  },
  {
    id: "list-employees",
    nameKey: "templateEmployeeListName",
    descriptionKey: "templateEmployeeListDesc",
    icon: List,
    color: "yellow",
    w: 8,
    h: 8,
    minW: 2,
    minH: 3,
    category: "list",
    badge: "Pro",
  },
  {
    id: "mock-ai-assistant",
    nameKey: "templateAiAssistantName",
    descriptionKey: "templateAiAssistantDesc",
    icon: Sparkles,
    color: "purple",
    w: 4,
    h: 8,
    minW: 2,
    minH: 3,
    category: "ai",
    badge: "New",
  },
  {
    id: "mock-company-news",
    nameKey: "templateCompanyNewsName",
    descriptionKey: "templateCompanyNewsDesc",
    icon: Building2,
    color: "blue",
    w: 4,
    h: 8,
    minW: 2,
    minH: 3,
    category: "utilities",
    badge: "",
  },
  {
    id: "mock-upcoming-birthdays",
    nameKey: "templateUpcomingBirthdaysName",
    descriptionKey: "templateUpcomingBirthdaysDesc",
    icon: CalendarCheck,
    color: "pink",
    w: 3,
    h: 5,
    minW: 2,
    minH: 3,
    category: "list",
    badge: "",
  },
  {
    id: "mock-leave-balance",
    nameKey: "templateLeaveBalanceName",
    descriptionKey: "templateLeaveBalanceDesc",
    icon: CalendarRange,
    color: "yellow",
    w: 4,
    h: 6,
    minW: 2,
    minH: 3,
    category: "stats",
    badge: "New",
  },
  {
    id: "mock-timesheet-summary",
    nameKey: "templateTimesheetSummaryName",
    descriptionKey: "templateTimesheetSummaryDesc",
    icon: Clock,
    color: "green",
    w: 6,
    h: 6,
    minW: 3,
    minH: 4,
    category: "attendance",
    badge: "Premium",
  },
  {
    id: "mock-payroll-overview",
    nameKey: "templatePayrollOverviewName",
    descriptionKey: "templatePayrollOverviewDesc",
    icon: HandCoins,
    color: "indigo",
    w: 6,
    h: 8,
    minW: 4,
    minH: 4,
    category: "charts",
    badge: "Business",
  },
  {
    id: "mock-training-progress",
    nameKey: "templateTrainingProgressName",
    descriptionKey: "templateTrainingProgressDesc",
    icon: GraduationCap,
    color: "teal",
    w: 4,
    h: 6,
    minW: 2,
    minH: 3,
    category: "utilities",
    badge: "",
  },
];

const categories = [
  { id: "all", labelKey: "allCards", icon: LayoutDashboard },
  { id: "featured", labelKey: "featured", icon: Star },
  { id: "ai", labelKey: "aiCards", icon: Sparkles },
  { id: "stats", labelKey: "statistics", icon: Calculator },
  { id: "charts", labelKey: "charts", icon: LineChart },
  { id: "list", labelKey: "list", icon: List },
  { id: "utilities", labelKey: "utilities", icon: Blocks },
  { id: "attendance", labelKey: "attendance", icon: Clock },
  { id: "integrations", labelKey: "integrations", icon: Puzzle },
];

const AddCardDialog = ({
  stats, attendanceTrendData, departmentData, turnoverTrendData, genderData, initialEmployees, todayAttendanceData,
}: AddCardDialogProps) => {
  const t = useTranslations("Dashboard");
  const { addWidget } = useGridStackContext();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredTemplates = useMemo(() => {
    let result = templates;
    if (activeCategory !== "all" && activeCategory !== "featured") {
      result = result.filter((template) => template.category === activeCategory);
    } else if (activeCategory === "featured") {
      result = result.filter((t) =>
        [
          "total-employees",
          "area-chart",
          "pie-chart",
          "list-employees",
          "mock-ai-assistant",
        ].includes(t.id),
      );
    }

    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter((template) => {
        const localizedName = t(template.nameKey).toLowerCase();
        const localizedDescription = t(template.descriptionKey).toLowerCase();
        return (
          localizedName.includes(lowerQuery) ||
          localizedDescription.includes(lowerQuery)
        );
      });
    }
    return result;
  }, [activeCategory, searchQuery, t]);

  const activeCategoryObj = categories.find((c) => c.id === activeCategory);
  const CategoryIcon = activeCategoryObj?.icon || LayoutDashboard;

  const handleAddCard = (templateId: string) => {
    const id = createWidgetId();
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    let content = "";

    switch (templateId) {
      case "total-employees":
        content = JSON.stringify({
          name: "totalEmployees",
          props: {
            title: t("totalEmployees"),
            total: stats.totalEmployees,
            label: t("employee"),
            percentage: stats.totalPercentage,
          },
        });
        break;
      case "total-employees-working":
        content = JSON.stringify({
          name: "totalEmployeesWorking",
          props: {
            title: t("activeEmployees"),
            total: stats.totalEmployeesWorking,
            label: t("employee"),
            percentage: stats.workingPercentage,
          },
        });
        break;
      case "new-employees":
        content = JSON.stringify({
          name: "newEmployees",
          props: {
            title: t("newHires"),
            total: stats.newEmployees,
            label: t("newHires"),
            percentage: stats.newPercentage,
          },
        });
        break;
      case "resigned-employees":
        content = JSON.stringify({
          name: "resignedEmployees",
          props: {
            title: t("resignations"),
            total: stats.resignedEmployees,
            label: t("resignations"),
            percentage: stats.resignedPercentage,
          },
        });
        break;
      case "area-chart":
        content = JSON.stringify({
          name: "cardChartAreaInteractive",
          props: { trendData: attendanceTrendData },
        });
        break;
      case "pie-chart":
        content = JSON.stringify({
          name: "cardChartPie",
          props: { departmentData },
        });
        break;
      case "turnover-chart":
        content = JSON.stringify({
          name: "cardChartTurnoverRate",
          props: { trendData: turnoverTrendData },
        });
        break;
      case "gender-chart":
        content = JSON.stringify({ name: "cardChartGender", props: { genderData } }); break;
      case "list-employees":
        content = JSON.stringify({ name: "listEmployees", props: { initialEmployees } }); break;
      case "mock-timesheet-summary":
        content = JSON.stringify({ name: "cardTimesheetSummary", props: { summaryData: todayAttendanceData } }); break;
      default:
        content = JSON.stringify({ name: "cardComingSoon", props: { title: t(template.nameKey) } }); break;
    }

    addWidget({
      id,
      w: template.w,
      h: template.h,
      minW: template.minW,
      minH: template.minH,
      content,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="xs">
          <Plus /> {t("addCard")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-6xl w-[90vw] h-[85vh] p-0 flex flex-row overflow-hidden border-0 shadow-2xl gap-0">
        {/* Sidebar */}
        <div className="w-[260px] bg-secondary/30 border-r flex flex-col h-full overflow-hidden shrink-0">
          <div className="p-4 flex items-center gap-2 border-b mb-2 bg-background/50 text-foreground">
            <div className="bg-primary/10 text-primary p-1 rounded-md">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <span className="font-bold text-base">{t("cardLibrary")}</span>
          </div>

          <div className="flex-1 overflow-y-auto w-full px-3 pb-4 space-y-0.5 custom-scrollbar">
            {categories.map((cat) => {
              const Icon = cat.icon;
              let btnClasses =
                "w-full justify-start py-2 px-3 text-sm font-medium transition-all group";
              if (activeCategory === cat.id) {
                btnClasses += " bg-primary/10 text-primary hover:bg-primary/15";
              } else {
                btnClasses +=
                  " hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground";
              }

              return (
                <Button
                  key={cat.id}
                  variant="ghost"
                  className={btnClasses}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  <Icon
                    className={cn(
                      "mr-3 w-4 h-4",
                      activeCategory === cat.id
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                  />
                  {t(cat.labelKey)}
                </Button>
              );
            })}
          </div>

          <div className="p-3 border-t mt-auto text-muted-foreground space-y-1 bg-background/50">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs font-medium h-8"
            >
              <HelpCircle className="mr-2 w-3.5 h-3.5" />
              {t("guideDocs")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs font-medium h-8"
            >
              <Video className="mr-2 w-3.5 h-3.5" />
              {t("dashboardWebinar")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs font-medium h-8"
            >
              <BookOpen className="mr-2 w-3.5 h-3.5" />
              {t("appWiki")}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
          {/* Header */}
          <div className="h-16 border-b flex items-center justify-between px-6 shrink-0 bg-background/95 backdrop-blur z-10 sticky top-0">
            <div className="flex items-center gap-2 text-foreground font-semibold text-lg">
              <CategoryIcon className="w-5 h-5 opacity-70" />
              {activeCategoryObj ? t(activeCategoryObj.labelKey) : t("allCards")}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t("searchCardsPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-[280px] h-9 pl-9 bg-secondary/50 border-input text-sm placeholder:text-muted-foreground/70"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="flex-1 overflow-y-auto p-6 bg-secondary/10 custom-scrollbar">
            {filteredTemplates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredTemplates.map((item) => {
                  const Icon = item.icon;
                  const bgColorClass = coverColors[item.color] || "bg-primary";

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleAddCard(item.id)}
                      className="group flex flex-col bg-card rounded-2xl border shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer overflow-hidden relative"
                    >
                      {/* Top Banner */}
                      <div
                        className={cn(
                          "h-36 relative flex flex-col items-center justify-center transition-colors p-4",
                          bgColorClass,
                        )}
                      >
                        {/* Card preview mock visual inside the banner */}
                        <div className="bg-white/20 backdrop-blur w-full h-[85%] rounded-lg border border-white/20 flex flex-col items-center justify-center p-3 relative shadow-sm overflow-hidden mt-1">
                          {/* Decorate the mock visual a bit */}
                          <div className="absolute inset-0 bg-linear-to-t from-black/5 to-transparent"></div>
                          <Icon
                            className="w-10 h-10 text-white drop-shadow-md opacity-90 relative z-10"
                            strokeWidth={1.5}
                          />
                        </div>

                        {/* Badge */}
                        {item.badge && (
                          <div className="absolute top-2 right-2 bg-white/95 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm text-foreground uppercase tracking-wider">
                            {item.badge}
                          </div>
                        )}
                      </div>

                      {/* Bottom Info */}
                      <div className="p-4 flex-1 flex flex-col relative bg-card">
                        <div className="flex items-start justify-between mb-1.5 gap-2">
                          <h4 className="font-semibold text-sm leading-tight text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                            {t(item.nameKey)}
                          </h4>
                        </div>
                        <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-2">
                          {t(item.descriptionKey)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-20 opacity-60">
                <Search className="w-12 h-12 mb-4 text-muted-foreground/50" />
                <p className="text-lg font-medium text-foreground">
                  {t("noCardFound")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("tryDifferentKeyword")}
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setSearchQuery("")}
                >
                  {t("clearSearch")}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddCardDialog;

