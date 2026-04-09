"use client";

import { useState, useCallback, useRef } from "react";
import { Search, Plus, ListFilter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClickOutside, useMergedRef } from "@mantine/hooks";
import { cn } from "@/lib/utils";

interface JobPostingToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (value: string) => void;
  departmentIdFilter: string;
  onDepartmentIdFilterChange: (value: string) => void;
  departments: Array<{ id: string; name: string }>;
  onCreateClick: () => void;
  isLoading?: boolean;
}

const STATUS_OPTIONS = [
  { value: "ALL", label: "Tất cả" },
  { value: "DRAFT", label: "Nháp" },
  { value: "OPEN", label: "Đang tuyển" },
  { value: "ON_HOLD", label: "Tạm dừng" },
  { value: "CLOSED", label: "Đã đóng" },
];

const PRIORITY_OPTIONS = [
  { value: "ALL", label: "Tất cả ưu tiên" },
  { value: "LOW", label: "Thấp" },
  { value: "NORMAL", label: "Bình thường" },
  { value: "HIGH", label: "Cao" },
  { value: "URGENT", label: "Khẩn cấp" },
];

export function JobPostingToolbar({
  searchValue,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  departmentIdFilter,
  onDepartmentIdFilterChange,
  departments,
  onCreateClick,
  isLoading,
}: JobPostingToolbarProps) {
  const [searchExpanded, setSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const clickOutsideRef = useClickOutside(() => {
    if (searchExpanded) {
      if (searchValue.trim()) {
        onSearchChange("");
      }
      setSearchExpanded(false);
    }
  });
  const mergedSearchRef = useMergedRef(searchContainerRef, clickOutsideRef);

  const handleSearchToggle = useCallback(() => {
    if (!searchExpanded) {
      setSearchExpanded(true);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      if (searchValue.trim()) {
        onSearchChange("");
      }
      setSearchExpanded(false);
    }
  }, [searchExpanded, searchValue, onSearchChange]);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        onSearchChange("");
        setSearchExpanded(false);
      }
    },
    [onSearchChange],
  );

  const hasActiveFilters =
    statusFilter !== "ALL" ||
    priorityFilter !== "ALL" ||
    departmentIdFilter !== "ALL" ||
    searchValue !== "";

  const clearFilters = useCallback(() => {
    onSearchChange("");
    onStatusFilterChange("ALL");
    onPriorityFilterChange("ALL");
    onDepartmentIdFilterChange("ALL");
    setSearchExpanded(false);
  }, [onSearchChange, onStatusFilterChange, onPriorityFilterChange, onDepartmentIdFilterChange]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col sm:flex-row gap-2 justify-between">
        <div className="flex flex-1 gap-2 flex-wrap items-center">
          {/* Search */}
          <div className="relative flex items-center" ref={mergedSearchRef}>
            <Input
              ref={searchInputRef}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Tìm kiếm tin tuyển dụng..."
              className={cn(
                "h-7 text-xs transition-all duration-300 ease-in-out pr-6",
                searchExpanded
                  ? "w-56 opacity-100 pl-3"
                  : "w-32 opacity-100 pl-7",
              )}
            />
            <Button
              size={"icon-xs"}
              variant={"ghost"}
              onClick={handleSearchToggle}
              className={cn(
                "absolute right-0.5 z-10",
                searchExpanded && "[&_svg]:text-primary",
              )}
            >
              {searchExpanded && searchValue ? (
                <X className="h-3 w-3" />
              ) : (
                <Search className="h-3 w-3" />
              )}
            </Button>
          </div>

          {/* Status filter */}
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger
              className={cn(
                "h-7 text-xs w-[140px]",
                statusFilter !== "ALL" && "bg-primary/10 border-primary text-primary",
              )}
            >
              <ListFilter className="h-3 w-3 mr-1" />
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Priority filter */}
          <Select value={priorityFilter} onValueChange={onPriorityFilterChange}>
            <SelectTrigger
              className={cn(
                "h-7 text-xs w-[140px]",
                priorityFilter !== "ALL" && "bg-primary/10 border-primary text-primary",
              )}
            >
              <SelectValue placeholder="Độ ưu tiên" />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Department filter */}
          <Select value={departmentIdFilter} onValueChange={onDepartmentIdFilterChange}>
            <SelectTrigger
              className={cn(
                "h-7 text-xs w-[180px]",
                departmentIdFilter !== "ALL" && "bg-primary/10 border-primary text-primary",
              )}
            >
              <SelectValue placeholder="Phòng ban" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả phòng ban</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-7 text-xs text-muted-foreground"
            >
              <X className="h-3 w-3 mr-1" />
              Xóa lọc
            </Button>
          )}
        </div>

        <Button onClick={onCreateClick} disabled={isLoading} size="xs" className="shrink-0">
          <Plus className="h-3 w-3 mr-1" />
          Tạo tin tuyển dụng
        </Button>
      </div>
    </div>
  );
}
