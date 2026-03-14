"use client";

import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import {
    Calendar as CalendarIcon,
    Clock,
    Filter,
    X,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import type {
    InterviewResponse,
    InterviewFilters,
    JobPostingResponse,
    InterviewStatus,
} from "@/app/(protected)/recruitment/types";
import { cn } from "@/lib/utils";

interface CalendarSidebarProps {
    currentDate: Date;
    filters: InterviewFilters;
    stats: {
        today: number;
        upcoming: number;
        completed: number;
        cancelled: number;
    };
    filteredInterviews: InterviewResponse[];
    jobPostingsData?: JobPostingResponse[];
    onDateSelect: (date: Date) => void;
    onFiltersChange: (filters: InterviewFilters) => void;
    onInterviewSelect: (interview: InterviewResponse) => void;
    hasActiveFilters: boolean;
    onClearFilters: () => void;
}

export function CalendarSidebar({
    currentDate,
    filters,
    stats,
    filteredInterviews,
    jobPostingsData,
    onDateSelect,
    onFiltersChange,
    onInterviewSelect,
    hasActiveFilters,
    onClearFilters,
}: CalendarSidebarProps) {
    const QuickFilterChip = ({
        label,
        value,
        active,
        onClick,
    }: {
        label: string;
        value: string;
        active: boolean;
        onClick: () => void;
    }) => (
        <button
            onClick={onClick}
            className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-all",
                active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground",
            )}
        >
            {label}
        </button>
    );

    const scheduledInterviews = filteredInterviews.filter(
        (i: InterviewResponse) => i.status === "SCHEDULED",
    );

    return (
        <div className="w-full lg:w-72 shrink-0 space-y-4 overflow-y-auto no-scrollbar">
            {/* Stats Card */}
            <Card className="gap-2">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        Tổng quan
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-primary">
                            {stats.today}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Hôm nay
                        </div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-blue-600">
                            {stats.upcoming}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Sắp tới
                        </div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-green-600">
                            {stats.completed}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Hoàn thành
                        </div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-red-600">
                            {stats.cancelled}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Đã hủy
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Filters */}
            <Card className="gap-2">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Lọc nhanh
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                            Trạng thái
                        </Label>
                        <div className="flex flex-wrap gap-1.5">
                            {[
                                { value: "", label: "Tất cả" },
                                {
                                    value: "SCHEDULED",
                                    label: "Đã lên lịch",
                                },
                                {
                                    value: "COMPLETED",
                                    label: "Hoàn thành",
                                },
                            ].map((item) => (
                                <QuickFilterChip
                                    key={item.value}
                                    label={item.label}
                                    value={item.value}
                                    active={
                                        item.value === ""
                                            ? !filters.status
                                            : filters.status ===
                                              item.value
                                    }
                                    onClick={() =>
                                        onFiltersChange({
                                            ...filters,
                                            status: (item.value ||
                                                undefined) as
                                                | InterviewStatus
                                                | undefined,
                                        })
                                    }
                                />
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                            Vị trí
                        </Label>
                        <Select
                            value={filters.jobPostingId || "all"}
                            onValueChange={(value) =>
                                onFiltersChange({
                                    ...filters,
                                    jobPostingId:
                                        value === "all"
                                            ? undefined
                                            : value,
                                })
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Chọn vị trí" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    Tất cả vị trí
                                </SelectItem>
                                {jobPostingsData?.map(
                                    (posting: JobPostingResponse) => (
                                        <SelectItem
                                            key={posting.id}
                                            value={posting.id}
                                        >
                                            {posting.title}
                                        </SelectItem>
                                    ),
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    {hasActiveFilters && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={onClearFilters}
                        >
                            <X className="h-3 w-3 mr-1" />
                            Xóa bộ lọc
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Upcoming Interviews */}
            <Card className="gap-2">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Sắp tới
                    </CardTitle>
                </CardHeader>
                <CardContent className="max-h-64 overflow-y-auto space-y-2">
                    {scheduledInterviews
                        .slice(0, 5)
                        .map((interview: InterviewResponse) => (
                            <div
                                key={interview.id}
                                className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                                onClick={() =>
                                    onInterviewSelect(interview)
                                }
                            >
                                <div className="font-medium text-sm truncate">
                                    {interview.candidateName}
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {format(
                                        parseISO(
                                            interview.scheduledDate,
                                        ),
                                        "dd/MM",
                                        { locale: vi },
                                    )}{" "}
                                    - {interview.scheduledTime}
                                </div>
                            </div>
                        ))}
                    {scheduledInterviews.length === 0 && (
                        <div className="text-center text-muted-foreground py-4 text-sm">
                            Không có phỏng vấn sắp tới
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
