"use client";

import { useCallback, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Maximize2,
  Minimize2,
  FoldVertical,
  UnfoldVertical,
  Plus,
  LayoutTemplate,
  Lock,
  Unlock,
  X,
  List,
  GitBranch,
  ChevronDown,
  Share2,
  ImageDown,
  Palette,
  LayoutGrid,
  ListFilter,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { COMPANY_STRUCTURE_TEMPLATES } from "@/lib/org-chart-templates";
import {
  TOOLTIPS,
  CHART_THEMES,
  CHART_CARD_STYLES,
  CHART_LAYOUT_LABELS,
  type ChartThemeId,
  type ChartCardStyle,
  type ChartLayoutMode,
} from "./org-chart-constants";
import { ExportControl } from "./export-control";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export type ViewMode = "tree" | "list";
export type StatusFilter = "all" | "ACTIVE" | "INACTIVE";

interface OrgChartToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  isLocked: boolean;
  onToggleLock: () => void;
  matchCount: number;
  onCreateDepartment: () => void;
  onApplyTemplate: (templateId: string) => void;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  statusFilter?: StatusFilter;
  onStatusFilterChange?: (status: StatusFilter) => void;
  chartTheme?: ChartThemeId;
  onChartThemeChange?: (theme: ChartThemeId) => void;
  cardStyle?: ChartCardStyle;
  onCardStyleChange?: (style: ChartCardStyle) => void;
  chartLayout?: ChartLayoutMode;
  onChartLayoutChange?: (mode: ChartLayoutMode) => void;
  onShare?: () => void;
  onExportImage?: () => void;
  canvasRef?: React.RefObject<HTMLElement | null>;
}

export function OrgChartToolbar({
  searchQuery,
  onSearchChange,
  isExpanded,
  onToggleExpand,
  onToggleFullscreen,
  isFullscreen,
  isLocked,
  onToggleLock,
  matchCount,
  onCreateDepartment,
  onApplyTemplate,
  viewMode = "tree",
  onViewModeChange,
  statusFilter = "all",
  onStatusFilterChange,
  chartTheme = "default",
  onChartThemeChange,
  cardStyle = "default",
  onCardStyleChange,
  chartLayout = "hierarchy",
  onChartLayoutChange,
  onShare,
  onExportImage,
  canvasRef,
}: OrgChartToolbarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const isMobile = useIsMobile();

  const onSearchClear = () => {
    onSearchChange("");
  };

  const handleStatusFilter = useCallback(
    (status: StatusFilter) => {
      onStatusFilterChange?.(status);
    },
    [onStatusFilterChange],
  );

  // Mobile toolbar: icon-only with overflow menu
  if (isMobile) {
    return (
      <div className="flex items-center gap-1">
        {/* Search icon button */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => setFiltersOpen(true)}
          title="Tìm kiếm"
        >
          <Search className="h-3.5 w-3.5" />
        </Button>

        {/* Lock */}
        <Button
          variant={isLocked ? "default" : "outline"}
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={onToggleLock}
        >
          {isLocked ? (
            <Lock className="h-3.5 w-3.5" />
          ) : (
            <Unlock className="h-3.5 w-3.5" />
          )}
        </Button>

        {/* Expand/Collapse */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={onToggleExpand}
        >
          {isExpanded ? (
            <FoldVertical className="h-3.5 w-3.5" />
          ) : (
            <UnfoldVertical className="h-3.5 w-3.5" />
          )}
        </Button>

        {/* View mode */}
        {onViewModeChange && (
          <Button
            variant={viewMode === "tree" ? "secondary" : "outline"}
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => onViewModeChange(viewMode === "tree" ? "list" : "tree")}
          >
            {viewMode === "tree" ? (
              <GitBranch className="h-3.5 w-3.5" />
            ) : (
              <List className="h-3.5 w-3.5" />
            )}
          </Button>
        )}

        {/* More actions */}
        <DropdownMenu onOpenChange={setFiltersOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-8 w-8 shrink-0">
              <PanelLeft className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {/* Filters */}
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              Trạng thái
            </div>
            <DropdownMenuCheckboxItem
              checked={statusFilter === "all"}
              onCheckedChange={() => handleStatusFilter("all")}
            >
              Tất cả
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={statusFilter === "ACTIVE"}
              onCheckedChange={() => handleStatusFilter("ACTIVE")}
            >
              Đang hoạt động
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={statusFilter === "INACTIVE"}
              onCheckedChange={() => handleStatusFilter("INACTIVE")}
            >
              Ngừng hoạt động
            </DropdownMenuCheckboxItem>

            {/* Layout */}
            {onChartLayoutChange && viewMode === "tree" && (
              <>
                <div className="h-px bg-border my-1" />
                <DropdownMenuItem onClick={() => onChartLayoutChange("hierarchy")}>
                  <GitBranch className="h-3.5 w-3.5 mr-2" />
                  Phân cấp
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onChartLayoutChange("functional")}>
                  <LayoutGrid className="h-3.5 w-3.5 mr-2" />
                  Theo nhóm chức năng
                </DropdownMenuItem>
              </>
            )}

            <div className="h-px bg-border my-1" />

            {/* Share & Export */}
            {onShare && (
              <DropdownMenuItem onClick={onShare}>
                <Share2 className="h-3.5 w-3.5 mr-2" />
                Chia sẻ liên kết
              </DropdownMenuItem>
            )}
            {onExportImage && (
              <DropdownMenuItem onClick={onExportImage}>
                <ImageDown className="h-3.5 w-3.5 mr-2" />
                Xuất ảnh
              </DropdownMenuItem>
            )}

            {/* Theme & Card Style */}
            {(onChartThemeChange || onCardStyleChange) && (
              <>
                <div className="h-px bg-border my-1" />
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  Màu nổi bật
                </div>
                {(Object.entries(CHART_THEMES) as [ChartThemeId, { label: string }][]).map(
                  ([id, { label }]) => (
                    <DropdownMenuCheckboxItem
                      key={id}
                      checked={chartTheme === id}
                      onCheckedChange={() => onChartThemeChange?.(id)}
                    >
                      {label}
                    </DropdownMenuCheckboxItem>
                  ),
                )}
                <div className="h-px bg-border my-1" />
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  Kiểu thẻ
                </div>
                {(Object.entries(CHART_CARD_STYLES) as [ChartCardStyle, { label: string }][]).map(
                  ([id, { label }]) => (
                    <DropdownMenuCheckboxItem
                      key={id}
                      checked={cardStyle === id}
                      onCheckedChange={() => onCardStyleChange?.(id)}
                    >
                      {label}
                    </DropdownMenuCheckboxItem>
                  ),
                )}
              </>
            )}

            <div className="h-px bg-border my-1" />

            {/* Templates */}
            {onApplyTemplate && (
              <>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  Mẫu cơ cấu
                </div>
                {COMPANY_STRUCTURE_TEMPLATES.map((t) => (
                  <DropdownMenuItem
                    key={t.id}
                    onClick={() => onApplyTemplate(t.id)}
                    className="cursor-pointer"
                  >
                    {t.name}
                  </DropdownMenuItem>
                ))}
                <div className="h-px bg-border my-1" />
              </>
            )}

            {/* Fullscreen */}
            <DropdownMenuItem onClick={onToggleFullscreen}>
              {isFullscreen ? (
                <Minimize2 className="h-3.5 w-3.5 mr-2" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5 mr-2" />
              )}
              {isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Create button */}
        <Button size="sm" onClick={onCreateDepartment} className="h-8 px-2 shrink-0">
          <Plus className="h-3.5 w-3.5" />
        </Button>

        {/* Search overlay on mobile */}
        {filtersOpen && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-start justify-center pt-4 px-4">
            <div className="w-full max-w-md bg-card border rounded-xl shadow-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Tìm kiếm</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setFiltersOpen(false)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm phòng ban, nhân viên..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-9 h-9"
                  autoFocus
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
                    onClick={onSearchClear}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              {searchQuery && matchCount > 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  Tìm thấy {matchCount} kết quả
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Search */}
      <div className="relative flex-1 min-w-32 max-w-50">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-7 bg-accent"
        />
        {searchQuery && matchCount > 0 && (
          <span className="absolute right-10 top-1/2 -translate-y-1/2 text-xs font-bold bg-primary text-primary-foreground rounded-sm size-5.5 flex items-center justify-center shadow-sm">
            {matchCount}
          </span>
        )}
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon-xs"
            className="absolute right-2 top-1/2 -translate-y-1/2"
            onClick={onSearchClear}
            title="Xóa tìm kiếm"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Filters Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="xs" className="h-7 gap-1.5">
            <ListFilter className="size-3.5" />
            Lọc
            <ChevronDown className="size-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
            Trạng thái
          </div>
          <DropdownMenuCheckboxItem
            checked={statusFilter === "all"}
            onCheckedChange={() => handleStatusFilter("all")}
          >
            Tất cả
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={statusFilter === "ACTIVE"}
            onCheckedChange={() => handleStatusFilter("ACTIVE")}
          >
            Đang hoạt động
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={statusFilter === "INACTIVE"}
            onCheckedChange={() => handleStatusFilter("INACTIVE")}
          >
            Ngừng hoạt động
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Layout mode: Phân cấp / Theo nhóm chức năng */}
      {onChartLayoutChange && viewMode === "tree" && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="xs" className="h-7 gap-1.5">
              <LayoutGrid className="h-3.5 w-3.5" />
              {CHART_LAYOUT_LABELS[chartLayout]}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuItem onClick={() => onChartLayoutChange("hierarchy")}>
              <GitBranch className="h-3.5 w-3.5 mr-2" />
              Phân cấp
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onChartLayoutChange("functional")}>
              <LayoutGrid className="h-3.5 w-3.5 mr-2" />
              Theo nhóm chức năng
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* View Mode Toggle */}
      {onViewModeChange && (
        <div className="flex items-center border rounded-md overflow-hidden">
          <Button
            variant={viewMode === "tree" ? "secondary" : "ghost"}
            size="xs"
            className=" px-2 rounded-none"
            onClick={() => onViewModeChange("tree")}
            tooltip="Cây"
          >
            <GitBranch className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="xs"
            className=" px-2 rounded-none"
            onClick={() => onViewModeChange("list")}
            tooltip="Danh sách"
          >
            <List className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Chia sẻ & Xuất ảnh */}
      {(onShare || onExportImage || canvasRef) && (
        <div className="flex items-center border rounded-md overflow-hidden">
          {onShare && (
            <Button
              variant="ghost"
              size="xs"
              className=" px-2 rounded-none"
              onClick={onShare}
              tooltip={TOOLTIPS.SHARE}
            >
              <Share2 className="h-3.5 w-3.5" />
            </Button>
          )}
          {onExportImage && (
            <Button
              variant="ghost"
              size="xs"
              className=" px-2 rounded-none"
              onClick={onExportImage}
              tooltip={TOOLTIPS.EXPORT_IMAGE}
            >
              <ImageDown className="h-3.5 w-3.5" />
            </Button>
          )}
          {canvasRef && <ExportControl canvasRef={canvasRef} />}
        </div>
      )}

      {/* Tùy chỉnh giao diện (theme + card style) */}
      {(onChartThemeChange || onCardStyleChange) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon-xs"
              tooltip={TOOLTIPS.CUSTOMIZE}
            >
              <Palette className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              Màu nổi bật
            </div>
            {(
              Object.entries(CHART_THEMES) as [
                ChartThemeId,
                { label: string },
              ][]
            ).map(([id, { label }]) => (
              <DropdownMenuCheckboxItem
                key={id}
                checked={chartTheme === id}
                onCheckedChange={() => onChartThemeChange?.(id)}
              >
                {label}
              </DropdownMenuCheckboxItem>
            ))}
            <div className="h-px bg-border my-1" />
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              Kiểu thẻ
            </div>
            {(
              Object.entries(CHART_CARD_STYLES) as [
                ChartCardStyle,
                { label: string },
              ][]
            ).map(([id, { label }]) => (
              <DropdownMenuCheckboxItem
                key={id}
                checked={cardStyle === id}
                onCheckedChange={() => onCardStyleChange?.(id)}
              >
                {label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-xs"
          onClick={onToggleExpand}
          tooltip={isExpanded ? TOOLTIPS.COLLAPSE_ALL : TOOLTIPS.EXPAND_ALL}
        >
          {isExpanded ? (
            <FoldVertical className="h-3.5 w-3.5" />
          ) : (
            <UnfoldVertical className="h-3.5 w-3.5" />
          )}
        </Button>
        <Button
          variant="outline"
          size="icon-xs"
          onClick={onToggleFullscreen}
          tooltip={
            isFullscreen ? TOOLTIPS.EXIT_FULLSCREEN : TOOLTIPS.FULLSCREEN
          }
        >
          {isFullscreen ? (
            <Minimize2 className="h-3.5 w-3.5" />
          ) : (
            <Maximize2 className="h-3.5 w-3.5" />
          )}
        </Button>

        <Button
          variant={isLocked ? "default" : "outline"}
          size="icon-xs"
          onClick={onToggleLock}
          tooltip={isLocked ? TOOLTIPS.UNLOCK : TOOLTIPS.LOCK}
        >
          {isLocked ? (
            <Lock className="h-3.5 w-3.5" />
          ) : (
            <Unlock className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="xs" className="ml-auto border">
            <LayoutTemplate className="h-3.5 w-3.5" />
            {TOOLTIPS.TEMPLATES}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {COMPANY_STRUCTURE_TEMPLATES.map((t) => (
            <DropdownMenuItem
              key={t.id}
              onClick={() => onApplyTemplate(t.id)}
              className="cursor-pointer"
            >
              {t.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button size="xs" onClick={onCreateDepartment}>
        <Plus className="h-3.5 w-3.5" />
        {TOOLTIPS.CREATE_DEPT}
      </Button>
    </div>
  );
}
