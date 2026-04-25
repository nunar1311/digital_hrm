"use client";

import { useMemo, useState, useCallback } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  UserCheck,
  Phone,
  Mail,
  Briefcase,
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
  headerBg: string;
  bgColor: string;
  borderColor: string;
  ringColor: string;
}

const STAGE_COLUMNS: StageColumn[] = [
  {
    id: "APPLIED",
    label: "Ứng tuyển",
    color: "text-blue-700 dark:text-blue-400",
    headerBg: "bg-blue-100/80 dark:bg-blue-900/40",
    bgColor: "bg-blue-50/30 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-800",
    ringColor: "ring-blue-500/30",
  },
  {
    id: "SCREENING",
    label: "Sàng lọc",
    color: "text-indigo-700 dark:text-indigo-400",
    headerBg: "bg-indigo-100/80 dark:bg-indigo-900/40",
    bgColor: "bg-indigo-50/30 dark:bg-indigo-950/20",
    borderColor: "border-indigo-200 dark:border-indigo-800",
    ringColor: "ring-indigo-500/30",
  },
  {
    id: "INTERVIEW",
    label: "Phỏng vấn",
    color: "text-amber-700 dark:text-amber-400",
    headerBg: "bg-amber-100/80 dark:bg-amber-900/40",
    bgColor: "bg-amber-50/30 dark:bg-amber-950/20",
    borderColor: "border-amber-200 dark:border-amber-800",
    ringColor: "ring-amber-500/30",
  },
  {
    id: "OFFER",
    label: "Offer",
    color: "text-purple-700 dark:text-purple-400",
    headerBg: "bg-purple-100/80 dark:bg-purple-900/40",
    bgColor: "bg-purple-50/30 dark:bg-purple-950/20",
    borderColor: "border-purple-200 dark:border-purple-800",
    ringColor: "ring-purple-500/30",
  },
  {
    id: "HIRED",
    label: "Đã tuyển",
    color: "text-emerald-700 dark:text-emerald-400",
    headerBg: "bg-emerald-100/80 dark:bg-emerald-900/40",
    bgColor: "bg-emerald-50/30 dark:bg-emerald-950/20",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    ringColor: "ring-emerald-500/30",
  },
  {
    id: "REJECTED",
    label: "Từ chối",
    color: "text-rose-700 dark:text-rose-400",
    headerBg: "bg-rose-100/80 dark:bg-rose-900/40",
    bgColor: "bg-rose-50/30 dark:bg-rose-950/20",
    borderColor: "border-rose-200 dark:border-rose-800",
    ringColor: "ring-rose-500/30",
  },
];

const SOURCE_COLORS: Record<CandidateSource | string, string> = {
  WEBSITE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  LINKEDIN: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  FACEBOOK: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  REFERRAL: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  AGENCY: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  OTHER: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  ALL: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
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
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 mb-3 animate-pulse">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
        <div className="flex-1">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4 mb-2" />
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-1/2" />
        </div>
      </div>
      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-full mb-2" />
      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-2/3" />
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
      <div className="flex gap-4 h-full overflow-x-auto p-4 md:p-6 pb-20">
        {STAGE_COLUMNS.map((col) => (
          <div
            key={col.id}
            className={cn(
              "flex flex-col w-[320px] shrink-0 rounded-2xl border-2 border-dashed shadow-sm",
              col.borderColor,
              col.bgColor,
            )}
          >
            <div className={cn("p-4 border-b border-dashed flex justify-between items-center", col.borderColor)}>
              <div className="h-5 bg-slate-200 dark:bg-slate-800/50 rounded-md w-24 animate-pulse" />
              <div className="h-5 w-8 bg-slate-200 dark:bg-slate-800/50 rounded-md animate-pulse" />
            </div>
            <div className="flex-1 p-3 space-y-3 overflow-y-auto hidden-scrollbar">
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
      <div className="flex flex-col items-center justify-center h-full py-20 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center mb-6 shadow-inner">
          <UserCheck className="h-10 w-10 text-slate-400" />
        </div>
        <h3 className="font-bold text-2xl mb-2 text-slate-700 dark:text-slate-200">Chưa có ứng viên nào</h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          Danh sách ứng viên trống. Hãy thêm ứng viên mới hoặc thay đổi bộ lọc để hiển thị pipeline Tuyển dụng.
        </p>
      </div>
    );
  }

  return (
    <div className="flex gap-4 h-full overflow-x-auto p-4 md:p-6 pb-8 items-start snap-x">
      {STAGE_COLUMNS.map((col, index) => {
        const cards = grouped[col.id] ?? [];
        const isDragTarget = draggedId && !cards.find(c => c.id === draggedId);
        
        return (
          <div
            key={col.id}
            className={cn(
              "flex flex-col w-[320px] max-h-full shrink-0 rounded-2xl border snap-start",
              "bg-white/40 dark:bg-slate-950/40 backdrop-blur-md transition-all duration-300 shadow-sm",
              "hover:shadow-md",
              col.borderColor,
              isDragTarget && `ring-2 ring-offset-2 ring-offset-background ${col.ringColor} scale-[1.01] bg-white/80 dark:bg-slate-900/80`
            )}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Column header */}
            <div
              className={cn(
                "p-4 border-b flex items-center justify-between rounded-t-2xl backdrop-blur-xl transition-colors duration-300",
                col.headerBg,
                col.borderColor,
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn("w-2 h-2 rounded-full shadow-sm", col.bgColor.split(' ')[0], col.borderColor.replace('border-','bg-').split(' ')[0])} />
                <span className={cn("font-bold text-base tracking-tight", col.color)}>
                  {col.label}
                </span>
              </div>
              <Badge
                variant="secondary"
                className={cn(
                  "text-xs px-2 py-0.5 font-bold tabular-nums min-w-[24px] flex justify-center",
                  col.bgColor,
                  col.color,
                  "border-0 shadow-sm",
                )}
              >
                {cards.length}
              </Badge>
            </div>

            {/* Cards container */}
            <div
              className="flex-1 p-3 space-y-3 overflow-y-auto hidden-scrollbar"
              style={{ maxHeight: "calc(100vh - 200px)" }}
            >
              {cards.length === 0 && !isLoading && (
                <div
                  className={cn(
                    "rounded-xl border-2 border-dashed p-8 flex flex-col items-center justify-center text-center transition-all duration-300",
                    col.borderColor,
                    isDragTarget ? col.bgColor : "bg-transparent",
                  )}
                >
                  <ArrowRight className={cn("h-6 w-6 mb-2 opacity-20", col.color)} />
                  <span className={cn("text-sm font-medium opacity-60", col.color)}>Kéo ứng viên vào đây</span>
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
                      "group relative rounded-xl border bg-white dark:bg-slate-900 shadow-sm p-4 cursor-grab active:cursor-grabbing transition-all duration-200 ease-out",
                      "hover:shadow-lg hover:-translate-y-0.5",
                      col.borderColor,
                      isDragging && "opacity-30 scale-95 shadow-none",
                    )}
                    onMouseEnter={() => setHoveredCardId(candidate.id)}
                    onMouseLeave={() => setHoveredCardId(null)}
                    onClick={() => onViewDetail(candidate)}
                  >
                    {/* Drag handle indicator */}
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-40 transition-opacity">
                      <GripVertical className="h-4 w-4 text-slate-400" />
                    </div>

                    {/* Card content */}
                    <div className="pl-3">
                      {/* Avatar + name + job */}
                      <div className="flex items-start gap-3 mb-3">
                        <Avatar className={cn("w-10 h-10 shrink-0 border-2 shadow-sm", col.borderColor)}>
                          <AvatarFallback
                            className={cn(
                              "text-xs font-bold",
                              col.bgColor,
                              col.color,
                            )}
                          >
                            {getInitials(candidate.name ?? "UN")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <p className="font-bold text-sm leading-tight line-clamp-1 text-slate-800 dark:text-slate-100">
                            {candidate.name}
                          </p>
                          {candidate.jobPostingTitle && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1 font-medium">
                              <Briefcase className="h-3 w-3 shrink-0" />
                              <span className="truncate">
                                {candidate.jobPostingTitle}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Contact row */}
                      <div className="flex flex-col gap-1.5 mb-3 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                        {candidate.email && (
                          <a
                            href={`mailto:${candidate.email}`}
                            className="text-xs text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 transition-colors w-full group/link"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Mail className="h-3 w-3 shrink-0 text-slate-400 group-hover/link:text-indigo-500" />
                            <span className="truncate font-mono">{candidate.email}</span>
                          </a>
                        )}
                        {candidate.phone && (
                          <a
                            href={`tel:${candidate.phone}`}
                            className="text-xs text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 transition-colors w-full group/link"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Phone className="h-3 w-3 shrink-0 text-slate-400 group-hover/link:text-indigo-500" />
                            <span className="font-mono">{candidate.phone}</span>
                          </a>
                        )}
                      </div>

                      {/* Footer: Source badge + Date */}
                      <div className="flex items-center justify-between mt-auto pt-1">
                        {candidate.source && (
                          <Badge
                            className={cn(
                              "text-[10px] px-2 py-0.5 font-medium uppercase tracking-wider rounded-md",
                              SOURCE_COLORS[candidate.source] ?? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
                            )}
                          >
                            {SOURCE_LABELS[candidate.source] ?? candidate.source}
                          </Badge>
                        )}
                        {candidate.createdAt && (
                          <span className="text-[10px] font-medium text-slate-400 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                            {format(new Date(candidate.createdAt), "dd/MM", {
                              locale: vi,
                            })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action menu - appears on hover */}
                    <div
                      className={cn(
                        "absolute top-2 right-2 transition-all duration-200",
                        isHovered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 pointer-events-none",
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon-xs"
                            className="h-7 w-7 shadow-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            <MoreHorizontal className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 shadow-xl rounded-xl">
                          <DropdownMenuItem onClick={() => onViewDetail(candidate)} className="py-2 cursor-pointer font-medium">
                            <Eye className="h-4 w-4 mr-2 text-slate-500" />
                            Xem chi tiết
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(candidate)} className="py-2 cursor-pointer font-medium">
                            <Pencil className="h-4 w-4 mr-2 text-slate-500" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          {onStageChange && (
                            <>
                              <DropdownMenuSeparator />
                              <div className="px-2 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Chuyển trạng thái</div>
                              {STAGE_COLUMNS.filter(
                                (c) => c.id !== candidate.stage,
                              ).map((c) => (
                                <DropdownMenuItem
                                  key={c.id}
                                  onClick={() => onStageChange(candidate.id, c.id)}
                                  className={cn("text-xs py-2 cursor-pointer", c.color)}
                                >
                                  <ChevronRight className="h-3.5 w-3.5 mr-2 opacity-50" />
                                  <span className="font-semibold">{c.label}</span>
                                </DropdownMenuItem>
                              ))}
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-white focus:text-white bg-red-50 focus:bg-red-500 text-red-600 py-2 cursor-pointer transition-colors"
                            onClick={() => onDelete(candidate)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            <span className="font-semibold">Xóa ứng viên</span>
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
