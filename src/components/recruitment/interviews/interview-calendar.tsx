"use client";

import { useMemo, useState } from "react";
import { format, startOfWeek, addDays, isSameDay, isToday, startOfMonth, isSameMonth, addMonths, subMonths } from "date-fns";
import { vi } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Users,
  Video,
  MapPin,
  Phone,
  UserCheck,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  InterviewBasic,
  InterviewStatus,
  InterviewResult,
} from "@/app/(protected)/recruitment/types";

interface InterviewCalendarProps {
  data: InterviewBasic[];
  isLoading?: boolean;
  onEdit: (interview: InterviewBasic) => void;
  onDelete: (interview: InterviewBasic) => void;
  onViewDetail: (interview: InterviewBasic) => void;
  onFeedback?: (interview: InterviewBasic) => void;
  onStatusChange?: (id: string, status: InterviewStatus) => void;
}

const STATUS_COLORS: Record<InterviewStatus, { label: string; bg: string; text: string; border: string }> = {
  SCHEDULED: { label: "Đã lên lịch", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  IN_PROGRESS: { label: "Đang PV", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  COMPLETED: { label: "Hoàn thành", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  CANCELLED: { label: "Đã hủy", bg: "bg-gray-100", text: "text-gray-500", border: "border-gray-200" },
  NO_SHOW: { label: "Không đến", bg: "bg-red-50", text: "text-red-600", border: "border-red-200" },
};

const INTERVIEW_TYPE_ICONS: Record<string, React.ReactNode> = {
  ONLINE: <Video className="h-3 w-3" />,
  ONSITE: <MapPin className="h-3 w-3" />,
  PHONE: <Phone className="h-3 w-3" />,
};

const RESULT_COLORS: Record<InterviewResult | string, { label: string; color: string }> = {
  PASS: { label: "Đạt", color: "text-emerald-600" },
  FAIL: { label: "Không đạt", color: "text-red-600" },
  PENDING: { label: "Chờ kết quả", color: "text-amber-500" },
};

function getInitials(name: string) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function InterviewCardMini({ interview, onEdit, onDelete, onViewDetail, onFeedback, onStatusChange }: {
  interview: InterviewBasic;
  onEdit: (i: InterviewBasic) => void;
  onDelete: (i: InterviewBasic) => void;
  onViewDetail: (i: InterviewBasic) => void;
  onFeedback?: (i: InterviewBasic) => void;
  onStatusChange?: (id: string, s: InterviewStatus) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const statusInfo = STATUS_COLORS[interview.status ?? "SCHEDULED"];

  return (
    <article
      className={cn(
        "relative rounded-lg border bg-card p-2.5 transition-all duration-150 cursor-pointer group",
        "hover:shadow-sm hover:border-primary/30",
        statusInfo.border,
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onViewDetail(interview)}
    >
      {/* Time + Type */}
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <div className="flex items-center gap-1 text-xs font-semibold text-foreground">
          <Clock className="h-3 w-3 shrink-0" />
          <span>{interview.scheduledTime}</span>
          {interview.duration && (
            <span className="text-muted-foreground font-normal">({interview.duration}p)</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {interview.type && (
            <span className="text-muted-foreground">
              {INTERVIEW_TYPE_ICONS[interview.type]}
            </span>
          )}
          {interview.round && interview.round > 1 && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 font-normal">
              Vòng {interview.round}
            </Badge>
          )}
        </div>
      </div>

      {/* Candidate name */}
      <p className="font-medium text-xs leading-tight line-clamp-1 mb-1">
        {interview.candidateName}
      </p>

      {/* Position */}
      {interview.jobPostingTitle && (
        <p className="text-[10px] text-muted-foreground line-clamp-1 mb-1.5">
          {interview.jobPostingTitle}
        </p>
      )}

      {/* Interviewers */}
      {interview.interviewerNames && interview.interviewerNames.length > 0 && (
        <div className="flex items-center gap-0.5 mb-1">
          <Users className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
          <div className="flex -space-x-1">
            {interview.interviewerNames.slice(0, 3).map((name: string, i: number) => (
              <Avatar key={i} className="w-4 h-4 border border-background">
                <AvatarFallback className="text-[7px] bg-primary/10 text-primary">
                  {getInitials(name ?? "?")}
                </AvatarFallback>
              </Avatar>
            ))}
            {interview.interviewerNames.length > 3 && (
              <span className="text-[9px] text-muted-foreground ml-1">
                +{interview.interviewerNames.length - 3}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Result badge */}
      {interview.result && (
        <Badge variant="outline" className={cn("text-[9px] px-1 py-0 h-3.5 font-normal", RESULT_COLORS[interview.result]?.color)}>
          {RESULT_COLORS[interview.result]?.label ?? interview.result}
        </Badge>
      )}

      {/* Actions */}
      <div
        className={cn(
          "absolute top-1 right-1 transition-all duration-150",
          hovered ? "opacity-100" : "opacity-0",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon-xs" className="h-5 w-5 shadow-sm bg-background/90">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => onViewDetail(interview)}>
              <Eye className="h-3.5 w-3.5 mr-2" />
              Xem chi tiết
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(interview)}>
              <Pencil className="h-3.5 w-3.5 mr-2" />
              Chỉnh sửa
            </DropdownMenuItem>
            {onFeedback && interview.status === "COMPLETED" && (
              <DropdownMenuItem onClick={() => onFeedback(interview)}>
                <UserCheck className="h-3.5 w-3.5 mr-2" />
                Nhận xét
              </DropdownMenuItem>
            )}
            {onStatusChange && (
              <>
                <DropdownMenuSeparator />
                {(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as InterviewStatus[]).map((s) => (
                  <DropdownMenuItem
                    key={s}
                    onClick={() => onStatusChange(interview.id, s)}
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-2" />
                    {STATUS_COLORS[s].label}
                  </DropdownMenuItem>
                ))}
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => onDelete(interview)}>
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </article>
  );
}

export function InterviewCalendar({
  data,
  isLoading,
  onEdit,
  onDelete,
  onViewDetail,
  onFeedback,
  onStatusChange,
}: InterviewCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const weekDays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  const monthStart = startOfMonth(currentDate);

  // Build calendar grid (6 weeks)
  const calendarDays = useMemo(() => {
    const start = startOfWeek(monthStart, { weekStartsOn: 1 });
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      days.push(addDays(start, i));
    }
    return days;
  }, [monthStart]);

  // Group interviews by date
  const interviewsByDate = useMemo(() => {
    const map: Record<string, InterviewBasic[]> = {};
    for (const interview of data) {
      if (interview.scheduledDate) {
        const key = format(new Date(interview.scheduledDate), "yyyy-MM-dd");
        if (!map[key]) map[key] = [];
        map[key].push(interview);
      }
    }
    // Sort each day by time
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => {
        const ta = a.scheduledTime ?? "";
        const tb = b.scheduledTime ?? "";
        return ta.localeCompare(tb);
      });
    }
    return map;
  }, [data]);

  const navigateMonth = (direction: number) => {
    setCurrentDate((d) => (direction > 0 ? addMonths(d, 1) : subMonths(d, 1)));
  };

  const goToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const selectedDateKey = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;
  const selectedInterviews = selectedDateKey ? interviewsByDate[selectedDateKey] ?? [] : [];

  if (isLoading) {
    return (
      <div className="flex h-full">
        {/* Calendar skeleton */}
        <div className="flex-1 p-3">
          <div className="animate-pulse">
            <div className="flex items-center justify-between mb-3">
              <div className="h-5 bg-muted rounded w-32" />
              <div className="flex gap-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-7 bg-muted rounded w-7" />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {weekDays.map((d) => (
                <div key={d} className="h-6 bg-muted rounded text-center text-xs" />
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="aspect-square bg-muted rounded" />
              ))}
            </div>
          </div>
        </div>
        <div className="w-72 border-l p-3 animate-pulse">
          <div className="h-4 bg-muted rounded w-24 mb-3" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Calendar Grid */}
      <div className="flex-1 p-3 overflow-auto">
        <div className="min-w-[500px]">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm">
              {format(currentDate, "MMMM yyyy", { locale: vi })}
            </h2>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-xs" onClick={goToday}>
                Hôm nay
              </Button>
              <Button variant="ghost" size="icon-xs" onClick={() => navigateMonth(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon-xs" onClick={() => navigateMonth(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Week day headers */}
          <div className="grid grid-cols-7 mb-1">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-[10px] font-semibold text-muted-foreground py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-0.5">
            {calendarDays.map((day, idx) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayInterviews = interviewsByDate[dateKey] ?? [];
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);

              return (
                <div
                  key={idx}
                  className={cn(
                    "min-h-[70px] border rounded-md p-1 transition-colors cursor-pointer relative group",
                    !isCurrentMonth && "opacity-30 bg-muted/30",
                    isCurrentMonth && "bg-background hover:bg-muted/30",
                    isSelected && "ring-2 ring-primary bg-primary/5",
                    isTodayDate && !isSelected && "border-primary/50 bg-primary/5",
                  )}
                  onClick={() => setSelectedDate(day)}
                >
                  {/* Day number */}
                  <div className="flex items-center justify-center mb-0.5">
                    <span
                      className={cn(
                        "text-xs w-5 h-5 flex items-center justify-center rounded-full",
                        isTodayDate && "bg-primary text-primary-foreground font-bold",
                        isSelected && !isTodayDate && "bg-primary/10 font-semibold text-primary",
                      )}
                    >
                      {format(day, "d")}
                    </span>
                  </div>

                  {/* Interview dots */}
                  {dayInterviews.length > 0 && (
                    <div className="space-y-0.5">
                      {dayInterviews.slice(0, 2).map((iv, i) => (
                        <div
                          key={i}
                          className={cn(
                            "text-[8px] px-0.5 py-0.5 rounded truncate font-medium",
                            STATUS_COLORS[iv.status ?? "SCHEDULED"].bg,
                            STATUS_COLORS[iv.status ?? "SCHEDULED"].text,
                          )}
                        >
                          {iv.scheduledTime} {iv.candidateName ?? ""}
                        </div>
                      ))}
                      {dayInterviews.length > 2 && (
                        <div className="text-[8px] text-center text-muted-foreground font-medium">
                          +{dayInterviews.length - 2} khác
                        </div>
                      )}
                    </div>
                  )}

                  {/* Interview count badge */}
                  {dayInterviews.length > 0 && (
                    <div className="absolute top-0.5 right-0.5">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[8px] px-1 py-0 h-3.5 min-w-[16px] text-center justify-center font-bold",
                          STATUS_COLORS[dayInterviews[0].status ?? "SCHEDULED"].bg,
                          STATUS_COLORS[dayInterviews[0].status ?? "SCHEDULED"].text,
                        )}
                      >
                        {dayInterviews.length}
                      </Badge>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Day detail panel */}
      <div className="w-80 border-l flex flex-col bg-muted/10 overflow-hidden">
        <div className="p-3 border-b bg-background shrink-0">
          {selectedDate ? (
            <>
              <div className="flex items-center gap-2 mb-0.5">
                <CalendarIcon className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">
                  {format(selectedDate, "EEEE", { locale: vi })}
                </span>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                {format(selectedDate, "dd/MM/yyyy", { locale: vi })}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 ml-6">
                {selectedInterviews.length} lịch phỏng vấn
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">Chọn ngày để xem chi tiết</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {!selectedDate && (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <CalendarIcon className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-xs text-muted-foreground">
                Nhấp vào ngày trên lịch để xem lịch phỏng vấn
              </p>
            </div>
          )}

          {selectedDate && selectedInterviews.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <CalendarIcon className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-xs text-muted-foreground">
                Không có lịch phỏng vấn nào trong ngày này
              </p>
            </div>
          )}

          {selectedInterviews.map((interview) => (
            <InterviewCardMini
              key={interview.id}
              interview={interview}
              onEdit={onEdit}
              onDelete={onDelete}
              onViewDetail={onViewDetail}
              onFeedback={onFeedback}
              onStatusChange={onStatusChange}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
