"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  parseISO,
} from "date-fns";
import { useClickOutside, useMergedRef } from "@mantine/hooks";

import {
  getInterviews,
  getJobPostings,
} from "@/app/(protected)/recruitment/actions";
import type {
  InterviewFilters,
  InterviewResponse,
  JobPostingResponse,
} from "@/app/(protected)/recruitment/types";
import {
  CalendarHeader,
  CalendarSidebar,
  CalendarGrid,
  InterviewDetailDialog,
} from "@/components/recruitment/calendar";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  ListFilter,
  Search,
  Settings,
  CalendarPlus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ViewMode = "month" | "week" | "day";

type InterviewStatus = "ALL" | "SCHEDULED" | "COMPLETED" | "CANCELLED";

const STATUS_OPTIONS: { value: InterviewStatus; label: string }[] = [
  { value: "ALL", label: "Tất cả" },
  { value: "SCHEDULED", label: "Đã lên lịch" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "CANCELLED", label: "Đã hủy" },
];

interface CalendarClientProps {
  initialInterviews: InterviewResponse[];
  initialJobPostings: JobPostingResponse[];
}

export function RecruitmentCalendarClient({
  initialInterviews: _initialInterviews,
  initialJobPostings: _initialJobPostings,
}: CalendarClientProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [filters, setFilters] = useState<InterviewFilters>({});
  const [statusFilter, setStatusFilter] = useState<InterviewStatus>("ALL");

  // Search state
  const [search, setSearch] = useState("");
  const [searchExpanded, setSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Click outside to close search
  const clickOutsideRef = useClickOutside(() => {
    if (searchExpanded) {
      if (search.trim()) {
        setSearch("");
      }
      setSearchExpanded(false);
    }
  });
  const mergedSearchRef = useMergedRef(searchContainerRef, clickOutsideRef);

  // Settings panel state
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [selectedInterview, setSelectedInterview] =
    useState<InterviewResponse | null>(null);

  // Apply status filter to filters
  const appliedFilters = useMemo<InterviewFilters>(() => {
    if (statusFilter !== "ALL") {
      return { ...filters, status: statusFilter };
    }
    return filters;
  }, [filters, statusFilter]);

  const { data: interviewsData, isLoading: interviewsLoading } = useQuery({
    queryKey: ["recruitment", "interviews", appliedFilters],
    queryFn: () => getInterviews(appliedFilters, { limit: 500 }),
  });

  const { data: jobPostingsData } = useQuery({
    queryKey: ["recruitment", "job-postings"],
    queryFn: () => getJobPostings({}, { limit: 100 }),
  });

  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(currentDate, {
      weekStartsOn: 1,
    });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [currentDate]);

  const getInterviewsForDay = useCallback(
    (day: Date) => {
      if (!interviewsData?.items) return [];
      return interviewsData.items.filter((interview: InterviewResponse) => {
        const interviewDate = parseISO(interview.scheduledDate);
        return (
          interviewDate.getFullYear() === day.getFullYear() &&
          interviewDate.getMonth() === day.getMonth() &&
          interviewDate.getDate() === day.getDate()
        );
      });
    },
    [interviewsData],
  );

  const filteredInterviews = useMemo(() => {
    if (!search.trim()) return interviewsData?.items || [];
    const query = search.toLowerCase();
    return (interviewsData?.items || []).filter(
      (interview: InterviewResponse) =>
        interview.candidateName?.toLowerCase().includes(query) ||
        interview.jobPostingTitle?.toLowerCase().includes(query),
    );
  }, [interviewsData, search]);

  const stats = useMemo(() => {
    const items = interviewsData?.items || [];
    const today = new Date();
    const upcoming = items.filter((i: InterviewResponse) => {
      const date = parseISO(i.scheduledDate);
      return date >= today && i.status === "SCHEDULED";
    });
    return {
      total: items.length,
      upcoming: upcoming.length,
      completed: items.filter(
        (i: InterviewResponse) => i.status === "COMPLETED",
      ).length,
      cancelled: items.filter(
        (i: InterviewResponse) => i.status === "CANCELLED",
      ).length,
      today: getInterviewsForDay(today).length,
    };
  }, [interviewsData, getInterviewsForDay]);

  const handleDateChange = (date: Date) => {
    setCurrentDate(date);
  };

  const handleDateClick = (date: Date) => {
    setCurrentDate(date);
    setViewMode("day");
  };

  const handleInterviewSelect = (interview: InterviewResponse) => {
    setSelectedInterview(interview);
  };

  const clearFilters = () => {
    setFilters({});
    setSearch("");
    setStatusFilter("ALL");
  };

  const hasActiveFilters =
    Object.values(appliedFilters).some(
      (v) => v !== undefined && v !== "",
    ) ||
    search.trim() !== "" ||
    statusFilter !== "ALL";

  // ─── Search toggle handlers ───
  const handleSearchToggle = useCallback(() => {
    if (!searchExpanded) {
      setSearchExpanded(true);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      if (search.trim()) {
        setSearch("");
      }
      setSearchExpanded(false);
    }
  }, [searchExpanded, search]);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        setSearch("");
        setSearchExpanded(false);
      }
    },
    [],
  );

  return (
    <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
      <div className="w-full min-h-0 h-full min-w-0 flex flex-col relative">
        {/* Header */}
        <section>
          <header className="p-2 flex items-center h-10 border-b">
            <h1 className="font-bold">Lịch phỏng vấn</h1>
          </header>
          <div className="flex items-center justify-end gap-2 px-2 py-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={statusFilter !== "ALL" ? "outline" : "ghost"}
                  size="xs"
                  className={cn(
                    statusFilter !== "ALL" &&
                      "bg-primary/10 border-primary text-primary hover:text-primary",
                  )}
                >
                  <ListFilter />
                  {statusFilter !== "ALL" && (
                    <span className="ml-1 text-xs">
                      {
                        STATUS_OPTIONS.find((s) => s.value === statusFilter)
                          ?.label
                      }
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Trạng thái
                </DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={statusFilter}
                  onValueChange={(value) =>
                    setStatusFilter(value as InterviewStatus)
                  }
                >
                  {STATUS_OPTIONS.map((option) => (
                    <DropdownMenuCheckboxItem
                      key={option.value}
                      checked={statusFilter === option.value}
                      onCheckedChange={() =>
                        setStatusFilter(option.value as InterviewStatus)
                      }
                      className="text-sm"
                    >
                      {option.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Search */}
            <div className="relative flex items-center" ref={mergedSearchRef}>
              <Input
                ref={searchInputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Tìm kiếm phỏng vấn..."
                className={cn(
                  "h-7 text-xs transition-all duration-300 ease-in-out pr-6",
                  searchExpanded
                    ? "w-50 opacity-100 pl-3"
                    : "w-0 opacity-0 pl-0",
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
                <Search />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-4!" />

            <Button
              variant={"outline"}
              size={"xs"}
              onClick={() => setSettingsOpen(true)}
            >
              <Settings />
            </Button>
          </div>
        </section>

        {/* Calendar Content */}
        <section className="flex-1 relative h-full min-h-0 overflow-hidden">
          <div className="absolute inset-0 flex flex-col">
            {/* Calendar Header */}
            <div className="shrink-0 border-b">
              <CalendarHeader
                currentDate={currentDate}
                viewMode={viewMode}
                searchQuery={search}
                onDateChange={handleDateChange}
                onViewModeChange={setViewMode}
                onSearchChange={setSearch}
                weekDays={weekDays}
              />
            </div>

            {/* Calendar Body with Sidebar */}
            <div className="flex-1 min-h-0 flex overflow-hidden">
              <CalendarSidebar
                currentDate={currentDate}
                filters={appliedFilters}
                stats={stats}
                filteredInterviews={filteredInterviews}
                jobPostingsData={jobPostingsData?.items}
                onDateSelect={(date) => {
                  setCurrentDate(date);
                  setViewMode("day");
                }}
                onFiltersChange={setFilters}
                onInterviewSelect={handleInterviewSelect}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={clearFilters}
              />

              <div className="flex-1 min-w-0 overflow-auto">
                <CalendarGrid
                  viewMode={viewMode}
                  currentDate={currentDate}
                  interviews={filteredInterviews}
                  isLoading={interviewsLoading}
                  onDateClick={handleDateClick}
                  onInterviewClick={handleInterviewSelect}
                />
              </div>
            </div>
          </div>

          {selectedInterview && (
            <InterviewDetailDialog
              interview={selectedInterview}
              onClose={() => setSelectedInterview(null)}
            />
          )}
        </section>
      </div>
    </div>
  );
}
