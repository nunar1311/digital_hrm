// =============================================================================
// LeaveSummaryFilters - Filter dropdown sử dụng React Table state
// =============================================================================

"use client";

import { useMemo } from "react";
import { ListFilter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface LeaveSummaryFiltersProps {
  year: number;
  search: string;
  leaveTypes: Array<{ id: string; name: string }>;
  departments: Array<{ id: string; name: string }>;
  years: number[];
  onYearChange: (year: number) => void;
  departmentFilter: string;
  onDepartmentFilterChange: (value: string) => void;
  leaveTypeFilter: string;
  onLeaveTypeFilterChange: (value: string) => void;
  onClearFilters: () => void;
}

export function LeaveSummaryFilters({
  year,
  leaveTypes,
  departments,
  years,
  onYearChange,
  departmentFilter,
  onDepartmentFilterChange,
  leaveTypeFilter,
  onLeaveTypeFilterChange,
  onClearFilters,
}: LeaveSummaryFiltersProps) {
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (leaveTypeFilter !== "all") count++;
    if (departmentFilter !== "all") count++;
    return count;
  }, [leaveTypeFilter, departmentFilter]);

  const hasActiveFilters = activeFilterCount > 0;

  const selectedLeaveType = leaveTypes.find((l) => l.id === leaveTypeFilter);
  const selectedDepartment = departments.find((d) => d.id === departmentFilter);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={hasActiveFilters ? "outline" : "ghost"}
          size="xs"
          className={cn(
            hasActiveFilters &&
              "bg-primary/10 border-primary text-primary hover:text-primary",
          )}
        >
          <ListFilter />
          Bộ lọc
          {hasActiveFilters && (
            <Badge
              variant="secondary"
              className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 space-y-2 p-2">
        <DropdownMenuLabel>Bộ lọc</DropdownMenuLabel>

        <Label>Năm</Label>
        <div className="grid grid-cols-3 gap-1">
          {years.map((y) => (
            <Button
              key={y}
              variant={year === y ? "default" : "outline"}
              size="sm"
              onClick={() => onYearChange(y)}
              className={cn("h-8 text-xs", year === y && "bg-primary")}
            >
              {y}
            </Button>
          ))}
        </div>

        {/* Leave Type */}
        <div className="space-y-2">
          <Label>Loại ngày nghỉ</Label>
          <Select
            value={leaveTypeFilter}
            onValueChange={onLeaveTypeFilterChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Tất cả loại nghỉ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả loại nghỉ</SelectItem>
              {leaveTypes.map((lt) => (
                <SelectItem key={lt.id} value={lt.id}>
                  {lt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {leaveTypeFilter !== "all" && selectedLeaveType && (
            <Badge variant="outline" className="text-xs">
              {selectedLeaveType.name}
            </Badge>
          )}
        </div>

        {/* Department */}

        <Label>Phòng ban</Label>
        <Select
          value={departmentFilter}
          onValueChange={onDepartmentFilterChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Tất cả phòng ban" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả phòng ban</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept.id} value={dept.id}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {departmentFilter !== "all" && selectedDepartment && (
          <Badge variant="outline" className="text-xs">
            {selectedDepartment.name}
          </Badge>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
