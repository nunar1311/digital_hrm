"use client";

import { useMemo, useState } from "react";
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
  AlertTriangle,
} from "lucide-react";
import { useGridStackContext } from "@/contexts/grid-stack-context";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";
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

interface AddCardDialogProps {
  stats: DashboardStats;
  attendanceTrendData: AttendanceTrendItem[];
  departmentData: DepartmentDistributionItem[];
  turnoverTrendData: TurnoverTrendItem[];
  genderData: GenderDistributionItem[];
  initialEmployees: GetEmployeesResult;
  todayAttendanceData: TodayAttendanceSummary;
  contractExpiryWarnings: ContractExpiryDashboardItem[];
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

const templates = [
  {
    id: "total-employees",
    name: "Tổng nhân viên",
    description: "Hiển thị tổng số nhân sự hiện có",
    icon: User,
    color: "purple",
    w: 3,
    h: 4,
    minW: 2,
    minH: 3,
    category: "Thống kê",
    badge: "Business",
  },
  {
    id: "total-employees-working",
    name: "Đang làm việc",
    description: "Tổng số nhân sự đang làm việc",
    icon: Users,
    color: "blue",
    w: 3,
    h: 4,
    minW: 2,
    minH: 3,
    category: "Thống kê",
    badge: "",
  },
  {
    id: "new-employees",
    name: "Nhân viên mới",
    description: "Tổng số nhân viên mới trong tháng",
    icon: UserPlus,
    color: "green",
    w: 3,
    h: 4,
    minW: 2,
    minH: 3,
    category: "Thống kê",
    badge: "",
  },
  {
    id: "resigned-employees",
    name: "Nhân viên nghỉ",
    description: "Tổng số nhân viên đã nghỉ việc",
    icon: UserMinus,
    color: "red",
    w: 3,
    h: 4,
    minW: 2,
    minH: 3,
    category: "Thống kê",
    badge: "",
  },
  {
    id: "area-chart",
    name: "Xu hướng điểm danh",
    description: "Biểu đồ xu hướng điểm danh theo thời gian",
    icon: Activity,
    color: "indigo",
    w: 6,
    h: 8,
    minW: 2,
    minH: 3,
    category: "Biểu đồ",
    badge: "Unlimited",
  },
  {
    id: "pie-chart",
    name: "Phân bổ phòng ban",
    description: "Hiển thị biểu đồ phân bổ nhân viên theo phòng",
    icon: PieChartIcon,
    color: "orange",
    w: 4,
    h: 8,
    minW: 2,
    minH: 3,
    category: "Biểu đồ",
    badge: "",
  },
  {
    id: "turnover-chart",
    name: "Tỷ lệ nghỉ việc",
    description: "Biểu đồ tỷ lệ biến động nhân sự",
    icon: LineChart,
    color: "pink",
    w: 4,
    h: 8,
    minW: 2,
    minH: 3,
    category: "Biểu đồ",
    badge: "",
  },
  {
    id: "gender-chart",
    name: "Phân bổ giới tính",
    description: "Thống kê giới tính nhân viên toàn công ty",
    icon: PieChartIcon,
    color: "teal",
    w: 4,
    h: 8,
    minW: 2,
    minH: 3,
    category: "Biểu đồ",
    badge: "",
  },
  {
    id: "list-employees",
    name: "Danh sách chi tiết",
    description: "Bảng danh sách chi tiết nhân viên",
    icon: List,
    color: "yellow",
    w: 8,
    h: 8,
    minW: 2,
    minH: 3,
    category: "Danh sách",
    badge: "Pro",
  },

  // NEW MOCKUP CARDS
  {
    id: "mock-ai-assistant",
    name: "Trợ lý AI HR",
    description: "Chatbot thông minh hỗ trợ giải đáp chính sách",
    icon: Sparkles,
    color: "purple",
    w: 4,
    h: 8,
    minW: 2,
    minH: 3,
    category: "Trí tuệ nhân tạo (AI)",
    badge: "New",
  },
  {
    id: "mock-company-news",
    name: "Bản tin nội bộ",
    description: "Cập nhật các tin tức và thông báo mới nhất",
    icon: Building2,
    color: "blue",
    w: 4,
    h: 8,
    minW: 2,
    minH: 3,
    category: "Tiện ích",
    badge: "",
  },
  {
    id: "mock-upcoming-birthdays",
    name: "Sinh nhật sắp tới",
    description: "Danh sách nhân viên có sinh nhật trong tháng",
    icon: CalendarCheck,
    color: "pink",
    w: 3,
    h: 5,
    minW: 2,
    minH: 3,
    category: "Danh sách",
    badge: "",
  },
  {
    id: "mock-leave-balance",
    name: "Quỹ nghỉ phép",
    description: "Theo dõi quỹ phép năm của toàn bộ công ty",
    icon: CalendarRange,
    color: "yellow",
    w: 4,
    h: 6,
    minW: 2,
    minH: 3,
    category: "Thống kê",
    badge: "Mới",
  },
  {
    id: "mock-timesheet-summary",
    name: "Tổng hợp công",
    description: "Tóm tắt dữ liệu chấm công hàng tuần",
    icon: Clock,
    color: "green",
    w: 6,
    h: 6,
    minW: 3,
    minH: 4,
    category: "Chấm công",
    badge: "Premium",
  },
  {
    id: "contract-expiry-list",
    name: "Cảnh báo hợp đồng",
    description: "Danh sách hợp đồng sắp hết hạn trong 30 ngày tới",
    icon: AlertTriangle,
    color: "orange",
    w: 4,
    h: 8,
    minW: 2,
    minH: 3,
    category: "Danh sách",
    badge: "HR",
  },
  {
    id: "mock-payroll-overview",
    name: "Tổng quan quỹ lương",
    description: "Biểu đồ biến động quỹ lương qua các tháng",
    icon: HandCoins,
    color: "indigo",
    w: 6,
    h: 8,
    minW: 4,
    minH: 4,
    category: "Biểu đồ",
    badge: "Doanh nghiệp",
  },
  {
    id: "mock-training-progress",
    name: "Tiến độ đào tạo",
    description: "Theo dõi tiến độ hoàn thành các khoá học",
    icon: GraduationCap,
    color: "teal",
    w: 4,
    h: 6,
    minW: 2,
    minH: 3,
    category: "Tiện ích",
    badge: "",
  },
];

const categories = [
  { id: "all", label: "Tất cả thẻ", icon: LayoutDashboard },
  { id: "Featured", label: "Nổi bật", icon: Star },
  { id: "Trí tuệ nhân tạo (AI)", label: "AI Cards", icon: Sparkles },
  { id: "Thống kê", label: "Thống kê", icon: Calculator },
  { id: "Biểu đồ", label: "Biểu đồ", icon: LineChart },
  { id: "Danh sách", label: "Danh sách", icon: List },
  { id: "Tiện ích", label: "Tiện ích", icon: Blocks },
  { id: "Chấm công", label: "Chấm công", icon: Clock },
  { id: "Tích hợp", label: "Ứng dụng tích hợp", icon: Puzzle },
];

const AddCardDialog = ({
  stats,
  attendanceTrendData,
  departmentData,
  turnoverTrendData,
  genderData,
  initialEmployees,
  todayAttendanceData,
  contractExpiryWarnings,
}: AddCardDialogProps) => {
  const { addWidget } = useGridStackContext();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredTemplates = useMemo(() => {
    let result = templates;
    if (activeCategory !== "all" && activeCategory !== "Featured") {
      result = result.filter((t) => t.category === activeCategory);
    } else if (activeCategory === "Featured") {
      // Pick a few cards to feature
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
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(lowerQuery) ||
          t.description.toLowerCase().includes(lowerQuery),
      );
    }
    return result;
  }, [activeCategory, searchQuery]);

  const activeCategoryObj = categories.find((c) => c.id === activeCategory);
  const CategoryIcon = activeCategoryObj?.icon || LayoutDashboard;

  const handleAddCard = (templateId: string) => {
    const id = `widget-${Date.now()}`;
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    let content = "";

    switch (templateId) {
      case "total-employees":
        content = JSON.stringify({
          name: "totalEmployees",
          props: {
            title: "Tổng nhân viên",
            total: stats.totalEmployees,
            label: "nhân viên",
            percentage: stats.totalPercentage,
          },
        });
        break;
      case "total-employees-working":
        content = JSON.stringify({
          name: "totalEmployeesWorking",
          props: {
            title: "Tổng nhân viên đang làm việc",
            total: stats.totalEmployeesWorking,
            label: "nhân viên",
            percentage: stats.workingPercentage,
          },
        });
        break;
      case "new-employees":
        content = JSON.stringify({
          name: "newEmployees",
          props: {
            title: "Tổng nhân viên mới",
            total: stats.newEmployees,
            label: "nhân viên mới",
            percentage: stats.newPercentage,
          },
        });
        break;
      case "resigned-employees":
        content = JSON.stringify({
          name: "resignedEmployees",
          props: {
            title: "Tổng nhân viên nghỉ",
            total: stats.resignedEmployees,
            label: "nhân viên nghỉ",
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
        content = JSON.stringify({
          name: "cardChartGender",
          props: { genderData },
        });
        break;
      case "list-employees":
        content = JSON.stringify({
          name: "listEmployees",
          props: { initialEmployees },
        });
        break;
      case "mock-timesheet-summary":
        content = JSON.stringify({
          name: "cardTimesheetSummary",
          props: { summaryData: todayAttendanceData },
        });
        break;
      case "contract-expiry-list":
        content = JSON.stringify({
          name: "cardContractExpiryList",
          props: { items: contractExpiryWarnings },
        });
        break;
      default:
        // Mock cards
        content = JSON.stringify({
          name: "cardComingSoon",
          props: { title: template.name },
        });
        break;
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
          <Plus /> Thẻ
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-6xl w-[90vw] h-[85vh] p-0 flex flex-row overflow-hidden border-0 shadow-2xl gap-0">
        {/* ─── Sidebar ─── */}
        <div className="w-65 bg-secondary/30 border-r flex flex-col h-full overflow-hidden shrink-0">
          <div className="p-4 flex items-center gap-2 border-b mb-2 bg-background/50 text-foreground">
            <div className="bg-primary/10 text-primary p-1 rounded-md">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <span className="font-bold text-base">Thư viện thẻ</span>
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
                  {cat.label}
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
              Tài liệu hướng dẫn
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs font-medium h-8"
            >
              <Video className="mr-2 w-3.5 h-3.5" />
              Webinar bảng điều khiển
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs font-medium h-8"
            >
              <BookOpen className="mr-2 w-3.5 h-3.5" />
              Wiki ứng dụng
            </Button>
          </div>
        </div>

        {/* ─── Main Content ─── */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
          {/* Header */}
          <div className="h-16 border-b flex items-center justify-between px-6 shrink-0 bg-background/95 backdrop-blur z-10 sticky top-0">
            <div className="flex items-center gap-2 text-foreground font-semibold text-lg">
              <CategoryIcon className="w-5 h-5 opacity-70" />
              {activeCategoryObj?.label || "Tất cả"}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm danh mục thẻ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-70 h-9 pl-9 bg-secondary/50 border-input text-sm placeholder:text-muted-foreground/70"
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
                            {item.name}
                          </h4>
                        </div>
                        <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-2">
                          {item.description}
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
                  Không tìm thấy thẻ nào
                </p>
                <p className="text-sm text-muted-foreground">
                  Hãy thử tìm với từ khoá khác hoặc xem danh mục khác.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setSearchQuery("")}
                >
                  Xoá tìm kiếm
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
