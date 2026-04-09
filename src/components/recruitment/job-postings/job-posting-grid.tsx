"use client";

import { useState, useCallback } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Briefcase, Users, Clock, MapPin, DollarSign, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, Eye, RefreshCw, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { JobPostingWithStats, JobPostingStatus, JobPostingPriority } from "@/app/(protected)/recruitment/types";

interface JobPostingGridProps {
  data: JobPostingWithStats[];
  isLoading?: boolean;
  onEdit: (posting: JobPostingWithStats) => void;
  onDelete: (posting: JobPostingWithStats) => void;
  onStatusChange: (id: string, status: JobPostingStatus) => void;
  onView?: (posting: JobPostingWithStats) => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
}

const STATUS_LABELS: Record<JobPostingStatus, { label: string; className: string }> = {
  DRAFT: { label: "Nháp", className: "bg-gray-100 text-gray-700 border-gray-200" },
  OPEN: { label: "Đang tuyển", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  ON_HOLD: { label: "Tạm dừng", className: "bg-amber-50 text-amber-700 border-amber-200" },
  CLOSED: { label: "Đã đóng", className: "bg-red-50 text-red-700 border-red-200" },
};

const PRIORITY_LABELS: Record<JobPostingPriority, { label: string; color: string; icon: boolean }> = {
  LOW: { label: "Thấp", color: "text-gray-400", icon: false },
  NORMAL: { label: "Bình thường", color: "text-blue-500", icon: false },
  HIGH: { label: "Cao", color: "text-orange-500", icon: true },
  URGENT: { label: "Khẩn cấp", color: "text-red-500", icon: true },
};

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Toàn thời gian",
  PART_TIME: "Bán thời gian",
  INTERN: "Thực tập",
  CONTRACT: "Hợp đồng",
};

function formatSalary(min?: number | null, max?: number | null) {
  if (!min && !max) return "Thỏa thuận";
  const fmt = (n: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(n);
  if (min && max) return `${fmt(min)} - ${fmt(max)}`;
  if (min) return `Từ ${fmt(min)}`;
  return max ? `Đến ${fmt(max)}` : "Thỏa thuận";
}

function formatDeadline(deadline?: string | null) {
  if (!deadline) return null;
  try {
    return format(new Date(deadline), "dd/MM/yyyy", { locale: vi });
  } catch {
    return deadline;
  }
}

function JobPostingCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 animate-pulse">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-muted shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="h-4 bg-muted rounded w-3/4 mb-1" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        </div>
        <div className="h-5 w-16 bg-muted rounded-full shrink-0" />
      </div>
      <div className="space-y-2 mb-3">
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-2/3" />
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-5 bg-muted rounded-full w-16" />
        ))}
      </div>
      <div className="flex items-center gap-4 pt-3 border-t">
        <div className="h-3 bg-muted rounded w-20" />
        <div className="h-3 bg-muted rounded w-20" />
        <div className="h-3 bg-muted rounded w-16" />
      </div>
    </div>
  );
}

export function JobPostingGrid({
  data,
  isLoading,
  onEdit,
  onDelete,
  onStatusChange,
  onView,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: JobPostingGridProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleStatusToggle = useCallback(
    (posting: JobPostingWithStats, newStatus: JobPostingStatus) => {
      onStatusChange(posting.id, newStatus);
    },
    [onStatusChange],
  );

  const getEmploymentTypeBadge = (type?: string | null) => {
    if (!type) return null;
    return (
      <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal border-dashed">
        {EMPLOYMENT_TYPE_LABELS[type] ?? type}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <JobPostingCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Briefcase className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-1">Chưa có tin tuyển dụng nào</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Tạo tin tuyển dụng đầu tiên để bắt đầu quy trình tuyển dụng
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {data.map((posting) => {
          const priorityInfo = PRIORITY_LABELS[posting.priority ?? "NORMAL"];
          const deadlineStr = formatDeadline(posting.deadline);
          const deadlinePassed =
            deadlineStr &&
            posting.deadline &&
            new Date(posting.deadline) < new Date() &&
            posting.status === "OPEN";

          return (
            <article
              key={posting.id}
              className={cn(
                "group relative rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-200 cursor-pointer overflow-hidden",
                "hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5",
                posting.status === "OPEN" && "hover:ring-2 hover:ring-primary/20",
                posting.status === "DRAFT" && "opacity-80",
                posting.status === "CLOSED" && "opacity-70",
              )}
              onMouseEnter={() => setHoveredId(posting.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onView?.(posting)}
            >
              {/* Priority accent bar */}
              {posting.priority === "URGENT" && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-red-500 to-orange-400" />
              )}
              {posting.priority === "HIGH" && posting.status !== "URGENT" && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-orange-400 to-amber-400" />
              )}

              <div className="p-4">
                {/* Header: icon + title + status */}
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg shrink-0 flex items-center justify-center",
                      posting.status === "OPEN"
                        ? "bg-emerald-100 text-emerald-600"
                        : posting.status === "CLOSED"
                          ? "bg-gray-100 text-gray-500"
                          : posting.status === "ON_HOLD"
                            ? "bg-amber-100 text-amber-600"
                            : "bg-blue-50 text-blue-500",
                    )}
                  >
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm leading-tight line-clamp-2 mb-0.5">
                      {posting.title}
                    </h3>
                    {posting.department && (
                      <p className="text-xs text-muted-foreground">{posting.department.name}</p>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("shrink-0 text-[10px] px-1.5 py-0 font-medium", STATUS_LABELS[posting.status].className)}
                  >
                    {STATUS_LABELS[posting.status].label}
                  </Badge>
                </div>

                {/* Description preview */}
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                  {posting.description?.replace(/<[^>]*>/g, "").substring(0, 120)}
                  {posting.description && posting.description.length > 120 ? "..." : ""}
                </p>

                {/* Tags row */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {posting.employmentType && getEmploymentTypeBadge(posting.employmentType)}
                  {posting.workLocation && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal border-dashed">
                      <MapPin className="h-2.5 w-2.5 mr-0.5" />
                      {posting.workLocation}
                    </Badge>
                  )}
                  {posting.salaryMin || posting.salaryMax ? (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal border-dashed">
                      <DollarSign className="h-2.5 w-2.5 mr-0.5" />
                      {formatSalary(posting.salaryMin, posting.salaryMax)}
                    </Badge>
                  ) : null}
                  {priorityInfo.icon && (
                    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 font-normal border-dashed", priorityInfo.color)}>
                      <Star className="h-2.5 w-2.5 mr-0.5 fill-current" />
                      {priorityInfo.label}
                    </Badge>
                  )}
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-4 pt-3 border-t text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <strong className="text-foreground">{posting._count?.candidates ?? 0}</strong>
                    <span>ứng viên</span>
                  </span>
                  {posting.headcount && (
                    <span className="flex items-center gap-1">
                      <span className="font-medium text-foreground">{posting.headcount}</span>
                      <span>vị trí</span>
                    </span>
                  )}
                  {deadlineStr && (
                    <span
                      className={cn(
                        "flex items-center gap-1 ml-auto",
                        deadlinePassed && "text-red-500 font-medium",
                      )}
                    >
                      <Clock className="h-3 w-3" />
                      {deadlinePassed ? "Đã hết hạn" : deadlineStr}
                    </span>
                  )}
                </div>
              </div>

              {/* Action buttons - appear on hover */}
              <div
                className={cn(
                  "absolute top-2 right-2 flex items-center gap-1 transition-all duration-200",
                  hoveredId === posting.id ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2",
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon-xs" className="h-7 w-7 shadow-sm bg-background/90">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onClick={() => onView?.(posting)}>
                      <Eye className="h-3.5 w-3.5 mr-2" />
                      Xem chi tiết
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(posting)}>
                      <Pencil className="h-3.5 w-3.5 mr-2" />
                      Chỉnh sửa
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {posting.status !== "OPEN" && (
                      <DropdownMenuItem onClick={() => handleStatusToggle(posting, "OPEN")}>
                        <RefreshCw className="h-3.5 w-3.5 mr-2" />
                        Mở tuyển dụng
                      </DropdownMenuItem>
                    )}
                    {posting.status === "OPEN" && (
                      <DropdownMenuItem onClick={() => handleStatusToggle(posting, "ON_HOLD")}>
                        <RefreshCw className="h-3.5 w-3.5 mr-2" />
                        Tạm dừng
                      </DropdownMenuItem>
                    )}
                    {posting.status !== "CLOSED" && (
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => onDelete(posting)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        Xóa
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </article>
          );
        })}
      </div>

      {/* Load more */}
      {hasNextPage && (
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Đang tải..." : "Tải thêm tin tuyển dụng"}
          </Button>
        </div>
      )}
    </div>
  );
}
