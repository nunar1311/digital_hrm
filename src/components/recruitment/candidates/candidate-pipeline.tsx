"use client";

import { useMemo, useState, useCallback } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  UserCheck,
  Phone,
  Mail,
  Briefcase,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  ChevronRight,
  ArrowRight,
  GripVertical,
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
import { cn } from "@/lib/utils";
import type {
  CandidateBasic,
  CandidateStage,
  CandidateSource,
} from "@/app/(protected)/recruitment/types";

interface CandidatePipelineProps {
  data: CandidateBasic[];
  isLoading?: boolean;
  onEdit: (candidate: CandidateBasic) => void;
  onDelete: (candidate: CandidateBasic) => void;
  onViewDetail: (candidate: CandidateBasic) => void;
  onStageChange?: (candidateId: string, newStage: CandidateStage) => void;
  jobPostings?: Array<{ id: string; title: string }>;
}

interface StageColumn {
  id: CandidateStage;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const STAGE_COLUMNS: StageColumn[] = [
  {
    id: "APPLIED",
    label: "Ứng tuyển",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  {
    id: "SCREENING",
    label: "Sàng lọc",
    color: "text-violet-600",
    bgColor: "bg-violet-50",
    borderColor: "border-violet-200",
  },
  {
    id: "INTERVIEW",
    label: "Phỏng vấn",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  {
    id: "OFFER",
    label: "Offer",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
  {
    id: "HIRED",
    label: "Đã tuyển",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
  },
  {
    id: "REJECTED",
    label: "Từ chối",
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
];

const SOURCE_COLORS: Record<CandidateSource | string, string> = {
  WEBSITE: "bg-blue-100 text-blue-700",
  LINKEDIN: "bg-sky-100 text-sky-700",
  FACEBOOK: "bg-indigo-100 text-indigo-700",
  REFERRAL: "bg-green-100 text-green-700",
  AGENCY: "bg-orange-100 text-orange-700",
  OTHER: "bg-gray-100 text-gray-700",
  ALL: "bg-gray-100 text-gray-700",
};

const SOURCE_LABELS: Record<string, string> = {
  WEBSITE: "Website",
  LINKEDIN: "LinkedIn",
  FACEBOOK: "Facebook",
  REFERRAL: "Giới thiệu",
  AGENCY: "Agency",
  OTHER: "Khác",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function CandidateCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card shadow-sm p-3 animate-pulse">
      <div className="flex items-start gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
        <div className="flex-1">
          <div className="h-3 bg-muted rounded w-3/4 mb-1" />
          <div className="h-2.5 bg-muted rounded w-1/2" />
        </div>
      </div>
      <div className="h-2.5 bg-muted rounded w-full mb-1.5" />
      <div className="h-2.5 bg-muted rounded w-2/3" />
    </div>
  );
}

export function CandidatePipeline({
  data,
  isLoading,
  onEdit,
  onDelete,
  onViewDetail,
  onStageChange,
}: CandidatePipelineProps) {
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Group candidates by stage
  const grouped = useMemo(() => {
    const map: Record<string, CandidateBasic[]> = {};
    for (const col of STAGE_COLUMNS) {
      map[col.id] = [];
    }
    for (const c of data) {
      const stage = c.stage ?? "APPLIED";
      if (!map[stage]) map[stage] = [];
      map[stage].push(c);
    }
    return map;
  }, [data]);

  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, stage: CandidateStage) => {
      e.preventDefault();
      if (draggedId && onStageChange) {
        onStageChange(draggedId, stage);
      }
      setDraggedId(null);
    },
    [draggedId, onStageChange],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
  }, []);

  if (isLoading) {
    return (
      <div className="flex gap-3 h-full overflow-x-auto p-3">
        {STAGE_COLUMNS.map((col) => (
          <div
            key={col.id}
            className={cn(
              "flex flex-col w-64 shrink-0 rounded-xl border-2 border-dashed",
              col.borderColor,
              col.bgColor,
            )}
          >
            <div className={cn("p-2 border-b border-dashed", col.borderColor)}>
              <div className="h-4 bg-muted rounded w-24 animate-pulse mx-auto" />
            </div>
            <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-240px)]">
              {[1, 2, 3].map((i) => (
                <CandidateCardSkeleton key={i} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <UserCheck className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-1">Chưa có ứng viên nào</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Thêm ứng viên hoặc lọc theo tiêu chí khác để xem pipeline
        </p>
      </div>
    );
  }

  return (
    <div className="flex gap-3 h-full overflow-x-auto p-3">
      {STAGE_COLUMNS.map((col) => {
        const cards = grouped[col.id] ?? [];
        return (
          <div
            key={col.id}
            className={cn(
              "flex flex-col w-64 shrink-0 rounded-xl border-2",
              "bg-background transition-colors",
              draggedId && "ring-2 ring-primary/30 ring-inset",
            )}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            {/* Column header */}
            <div
              className={cn(
                "p-2 border-b flex items-center justify-between rounded-t-xl",
                col.bgColor,
                col.borderColor,
              )}
            >
              <div className="flex items-center gap-1.5">
                <span className={cn("font-semibold text-sm", col.color)}>
                  {col.label}
                </span>
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-[10px] px-1.5 py-0 h-4 font-bold min-w-[20px] text-center",
                    col.bgColor,
                    col.color,
                    "border-0",
                  )}
                >
                  {cards.length}
                </Badge>
              </div>
              <ArrowRight className={cn("h-3 w-3", col.color, "opacity-40")} />
            </div>

            {/* Cards container */}
            <div
              className="flex-1 p-2 space-y-2 overflow-y-auto"
              style={{ maxHeight: "calc(100vh - 240px)" }}
            >
              {cards.length === 0 && !isLoading && (
                <div
                  className={cn(
                    "rounded-lg border-2 border-dashed p-4 text-center text-xs text-muted-foreground/60",
                    col.borderColor,
                    col.bgColor,
                  )}
                >
                  Kéo ứng viên vào đây
                </div>
              )}
              {cards.map((candidate) => {
                const isHovered = hoveredCardId === candidate.id;
                const isDragging = draggedId === candidate.id;

                return (
                  <article
                    key={candidate.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, candidate.id)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "group relative rounded-lg border bg-card shadow-sm p-3 cursor-grab active:cursor-grabbing transition-all duration-150",
                      "hover:shadow-md hover:border-primary/30",
                      isDragging && "opacity-40 scale-95",
                    )}
                    onMouseEnter={() => setHoveredCardId(candidate.id)}
                    onMouseLeave={() => setHoveredCardId(null)}
                    onClick={() => onViewDetail(candidate)}
                  >
                    {/* Drag handle indicator */}
                    <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-40 transition-opacity">
                      <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>

                    {/* Card content */}
                    <div className="pl-3">
                      {/* Avatar + name + source */}
                      <div className="flex items-start gap-2 mb-2">
                        <Avatar className="w-8 h-8 shrink-0 border">
                          <AvatarFallback
                            className={cn(
                              "text-[10px] font-bold",
                              col.bgColor,
                              col.color,
                            )}
                          >
                            {getInitials(candidate.name ?? "UN")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-xs leading-tight line-clamp-1">
                            {candidate.name}
                          </p>
                          {candidate.jobPosting && (
                            <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
                              <Briefcase className="h-2.5 w-2.5 shrink-0" />
                              <span className="truncate">
                                {candidate.jobPosting.title}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Contact row */}
                      <div className="flex flex-wrap gap-x-2 gap-y-0.5 mb-2">
                        {candidate.email && (
                          <a
                            href={`mailto:${candidate.email}`}
                            className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-0.5 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Mail className="h-2.5 w-2.5 shrink-0" />
                            <span className="truncate max-w-[100px]">{candidate.email}</span>
                          </a>
                        )}
                        {candidate.phone && (
                          <a
                            href={`tel:${candidate.phone}`}
                            className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-0.5 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Phone className="h-2.5 w-2.5 shrink-0" />
                            {candidate.phone}
                          </a>
                        )}
                      </div>

                      {/* Source badge */}
                      <div className="flex items-center justify-between">
                        {candidate.source && (
                          <Badge
                            className={cn(
                              "text-[9px] px-1 py-0 h-3.5 font-normal",
                              SOURCE_COLORS[candidate.source] ?? "bg-gray-100 text-gray-700",
                            )}
                          >
                            {SOURCE_LABELS[candidate.source] ?? candidate.source}
                          </Badge>
                        )}
                        {candidate.createdAt && (
                          <span className="text-[9px] text-muted-foreground">
                            {format(new Date(candidate.createdAt), "dd/MM/yy", {
                              locale: vi,
                            })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action menu - appears on hover */}
                    <div
                      className={cn(
                        "absolute top-1 right-1 transition-all duration-150",
                        isHovered ? "opacity-100" : "opacity-0",
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="secondary"
                            size="icon-xs"
                            className="h-6 w-6 shadow-sm bg-background/90"
                          >
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => onViewDetail(candidate)}>
                            <Eye className="h-3.5 w-3.5 mr-2" />
                            Xem chi tiết
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(candidate)}>
                            <Pencil className="h-3.5 w-3.5 mr-2" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          {onStageChange && (
                            <>
                              <DropdownMenuSeparator />
                              {STAGE_COLUMNS.filter(
                                (c) => c.id !== candidate.stage,
                              ).map((c) => (
                                <DropdownMenuItem
                                  key={c.id}
                                  onClick={() => onStageChange(candidate.id, c.id)}
                                  className="text-xs"
                                >
                                  <ChevronRight className="h-3 w-3 mr-1" />
                                  Chuyển sang {c.label}
                                </DropdownMenuItem>
                              ))}
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => onDelete(candidate)}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
