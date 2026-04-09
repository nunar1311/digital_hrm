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

interface CandidateToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  stageFilter: string;
  onStageFilterChange: (value: string) => void;
  sourceFilter: string;
  onSourceFilterChange: (value: string) => void;
  jobPostingIdFilter: string;
  onJobPostingIdFilterChange: (value: string) => void;
  jobPostings: Array<{ id: string; title: string }>;
  onCreateClick: () => void;
  isLoading?: boolean;
}

const STAGE_OPTIONS = [
  { value: "ALL", label: "Tất cả" },
  { value: "APPLIED", label: "Ứng tuyển" },
  { value: "SCREENING", label: "Sàng lọc" },
  { value: "INTERVIEW", label: "Phỏng vấn" },
  { value: "OFFER", label: "Offer" },
  { value: "HIRED", label: "Đã tuyển" },
  { value: "REJECTED", label: "Từ chối" },
];

const SOURCE_OPTIONS = [
  { value: "ALL", label: "Tất cả nguồn" },
  { value: "WEBSITE", label: "Website" },
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "REFERRAL", label: "Giới thiệu" },
  { value: "AGENCY", label: "Agency" },
  { value: "OTHER", label: "Khác" },
];

export function CandidateToolbar({
  searchValue,
  onSearchChange,
  stageFilter,
  onStageFilterChange,
  sourceFilter,
  onSourceFilterChange,
  jobPostingIdFilter,
  onJobPostingIdFilterChange,
  jobPostings,
  onCreateClick,
  isLoading,
}: CandidateToolbarProps) {
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
    stageFilter !== "ALL" ||
    sourceFilter !== "ALL" ||
    jobPostingIdFilter !== "ALL" ||
    searchValue !== "";

  const clearFilters = useCallback(() => {
    onSearchChange("");
    onStageFilterChange("ALL");
    onSourceFilterChange("ALL");
    onJobPostingIdFilterChange("ALL");
    setSearchExpanded(false);
  }, [onSearchChange, onStageFilterChange, onSourceFilterChange, onJobPostingIdFilterChange]);

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
              placeholder="Tìm kiếm ứng viên..."
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

          {/* Stage filter */}
          <Select value={stageFilter} onValueChange={onStageFilterChange}>
            <SelectTrigger
              className={cn(
                "h-7 text-xs w-[140px]",
                stageFilter !== "ALL" && "bg-primary/10 border-primary text-primary",
              )}
            >
              <ListFilter className="h-3 w-3 mr-1" />
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              {STAGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Source filter */}
          <Select value={sourceFilter} onValueChange={onSourceFilterChange}>
            <SelectTrigger
              className={cn(
                "h-7 text-xs w-[140px]",
                sourceFilter !== "ALL" && "bg-primary/10 border-primary text-primary",
              )}
            >
              <SelectValue placeholder="Nguồn" />
            </SelectTrigger>
            <SelectContent>
              {SOURCE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Job posting filter */}
          <Select value={jobPostingIdFilter} onValueChange={onJobPostingIdFilterChange}>
            <SelectTrigger
              className={cn(
                "h-7 text-xs w-[180px]",
                jobPostingIdFilter !== "ALL" && "bg-primary/10 border-primary text-primary",
              )}
            >
              <SelectValue placeholder="Vị trí" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả vị trí</SelectItem>
              {jobPostings.map((jp) => (
                <SelectItem key={jp.id} value={jp.id}>
                  {jp.title}
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
          Thêm ứng viên
        </Button>
      </div>
    </div>
  );
}
