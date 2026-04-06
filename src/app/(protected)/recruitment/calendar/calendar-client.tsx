"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    parseISO,
} from "date-fns";

import {
    getInterviews,
    getJobPostings,
} from "@/app/(protected)/recruitment/actions";
import type { InterviewFilters, InterviewResponse, JobPostingResponse } from "@/app/(protected)/recruitment/types";
import {
    CalendarHeader,
    CalendarSidebar,
    CalendarGrid,
    InterviewDetailDialog,
} from "@/components/recruitment/calendar";

type ViewMode = "month" | "week" | "day";

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
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedInterview, setSelectedInterview] =
        useState<InterviewResponse | null>(null);

    const { data: interviewsData, isLoading: interviewsLoading } =
        useQuery({
            queryKey: ["recruitment", "interviews", filters],
            queryFn: () => getInterviews(filters, { limit: 500 }),
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
                const interviewDate = parseISO(
                    interview.scheduledDate,
                );
                return (
                    interviewDate.getFullYear() ===
                        day.getFullYear() &&
                    interviewDate.getMonth() === day.getMonth() &&
                    interviewDate.getDate() === day.getDate()
                );
            });
        },
        [interviewsData],
    );

    const filteredInterviews = useMemo(() => {
        if (!searchQuery.trim()) return interviewsData?.items || [];
        const query = searchQuery.toLowerCase();
        return (interviewsData?.items || []).filter(
            (interview: InterviewResponse) =>
                interview.candidateName
                    ?.toLowerCase()
                    .includes(query) ||
                interview.jobPostingTitle
                    ?.toLowerCase()
                    .includes(query),
        );
    }, [interviewsData, searchQuery]);

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
        setSearchQuery("");
    };

    const hasActiveFilters =
        Object.values(filters).some(
            (v) => v !== undefined && v !== "",
        ) || searchQuery.trim() !== "";

    return (
        <div className="p-4 md:p-6 space-y-6">
            <div>
                <h3 className="text-2xl font-bold">Lịch phỏng vấn</h3>
                <p className="text-sm text-muted-foreground">
                    Quản lý lịch phỏng vấn và ứng viên
                </p>
            </div>
            <div className="flex flex-col lg:flex-row gap-4  h-[calc(100vh-10rem)]">
                <CalendarSidebar
                    currentDate={currentDate}
                    filters={filters}
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

                <div className="flex-1 flex flex-col min-w-0">
                    <CalendarHeader
                        currentDate={currentDate}
                        viewMode={viewMode}
                        searchQuery={searchQuery}
                        onDateChange={handleDateChange}
                        onViewModeChange={setViewMode}
                        onSearchChange={setSearchQuery}
                        weekDays={weekDays}
                    />

                    <CalendarGrid
                        viewMode={viewMode}
                        currentDate={currentDate}
                        interviews={filteredInterviews}
                        isLoading={interviewsLoading}
                        onDateClick={handleDateClick}
                        onInterviewClick={handleInterviewSelect}
                    />
                </div>

                {selectedInterview && (
                    <InterviewDetailDialog
                        interview={selectedInterview}
                        onClose={() => setSelectedInterview(null)}
                    />
                )}
            </div>
        </div>
    );
}
