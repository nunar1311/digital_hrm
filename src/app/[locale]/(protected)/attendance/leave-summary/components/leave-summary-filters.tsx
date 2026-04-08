// =============================================================================
// LeaveSummaryFilters - Filter dropdown sử dụng React Table state
// =============================================================================

"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ListFilter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const t = useTranslations("ProtectedPages");

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
          {t("attendanceLeaveSummaryFiltersButton")}
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
        <DropdownMenuLabel>{t("attendanceLeaveSummaryFiltersTitle")}</DropdownMenuLabel>

        <Label>{t("attendanceLeaveSummaryFiltersYear")}</Label>
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
          <Label>{t("attendanceLeaveSummaryFiltersLeaveType")}</Label>
          <Select
            value={leaveTypeFilter}
            onValueChange={onLeaveTypeFilterChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("attendanceLeaveSummaryFiltersAllLeaveTypes")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("attendanceLeaveSummaryFiltersAllLeaveTypes")}</SelectItem>
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

        <Label>{t("attendanceLeaveSummaryFiltersDepartment")}</Label>
        <Select
          value={departmentFilter}
          onValueChange={onDepartmentFilterChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("attendanceLeaveSummaryFiltersAllDepartments")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("attendanceLeaveSummaryFiltersAllDepartments")}</SelectItem>
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

        {hasActiveFilters && (
          <>
            <Separator className="my-2" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={onClearFilters}
            >
              <X className="mr-2 h-4 w-4" />
              {t("attendanceLeaveSummaryFiltersClear")}
            </Button>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
