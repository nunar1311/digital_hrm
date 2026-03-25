import {
  CalendarDays,
  Lock,
  Calculator,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { STATUS_CELL } from "./monthly-constants";
import type { DepartmentBasic } from "../types";

interface MonthlyToolbarProps {
  month: number;
  year: number;
  onMonthChange: (direction: number) => void;
  onTodayClick: () => void;
  departments: DepartmentBasic[];
  departmentId: string;
  onDepartmentChange: (val: string) => void;
  viewMode: "grid" | "summary";
  onViewModeChange: (mode: "grid" | "summary") => void;
  showWeekend: boolean;
  onShowWeekendChange: (val: boolean) => void;
  canManage: boolean;
  isPending: boolean;
  onCalculate: () => void;
  onLock: () => void;
  onExport: () => void;
  isExporting: boolean;
}

export function MonthlyToolbar({
  month,
  year,
  onMonthChange,
  onTodayClick,
  departments,
  departmentId,
  onDepartmentChange,
  viewMode,
  onViewModeChange,
  showWeekend,
  onShowWeekendChange,
  canManage,
  isPending,
  onCalculate,
  onLock,
  onExport,
  isExporting,
}: MonthlyToolbarProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b p-2">
        <h1 className="font-bold tracking-tight">Bảng công tổng hợp</h1>

        <div className="flex items-center gap-2">
          {canManage && (
            <>
              <Button
                variant="outline"
                size="xs"
                onClick={onCalculate}
                disabled={isPending}
              >
                <Calculator /> Tính công
              </Button>
              <Button
                variant="outline"
                size={"xs"}
                onClick={onLock}
                disabled={isPending}
              >
                <Lock /> Khóa bảng công
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="xs"
            onClick={onExport}
            disabled={isExporting}
          >
            <Download />
            {isExporting ? "Đang xuất file..." : "Xuất file Excel"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center px-2">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="xs" onClick={onTodayClick}>
            Hôm nay
          </Button>
          <Button
            variant="outline"
            size="icon-xs"
            onClick={() => onMonthChange(-1)}
          >
            <ChevronLeft />
          </Button>

          <Button
            variant="outline"
            size="icon-xs"
            onClick={() => onMonthChange(1)}
          >
            <ChevronRight />
          </Button>
          <span className="font-medium px-3 min-w-[120px] text-center">
            Tháng {month}, {year}
          </span>
        </div>

        {departments.length > 0 && (
          <Select
            value={departmentId || "all"}
            onValueChange={(val) =>
              onDepartmentChange(val === "all" ? "" : val)
            }
          >
            <SelectTrigger size="sm" className="w-[200px]">
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
        )}

        {viewMode === "grid" && (
          <div className="flex items-center gap-2">
            <Switch
              id="show-weekend"
              checked={showWeekend}
              onCheckedChange={onShowWeekendChange}
            />
            <Label htmlFor="show-weekend" className="text-sm cursor-pointer">
              Hiện cuối tuần
            </Label>
          </div>
        )}

        <div className="flex gap-1 ml-auto">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="xs"
            onClick={() => onViewModeChange("grid")}
          >
            <CalendarDays className="h-4 w-4" /> Lưới
          </Button>
          <Button
            variant={viewMode === "summary" ? "default" : "outline"}
            size="xs"
            onClick={() => onViewModeChange("summary")}
          >
            Tổng hợp
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs px-2">
        {Object.entries(STATUS_CELL).map(([key, val]) => (
          <span
            key={key}
            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 ${val.className}`}
          >
            <strong>{val.symbol}</strong> {val.label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 bg-muted text-muted-foreground">
          <strong>—</strong> Cuối tuần / Chưa đến
        </span>
      </div>
    </div>
  );
}
