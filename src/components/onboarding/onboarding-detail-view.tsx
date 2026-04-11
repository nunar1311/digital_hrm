"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Loader2,
  CheckCircle2,
  Clock,
  Users,
  User,
  XCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  getOnboardingDetail,
  updateChecklistItem,
} from "@/app/(protected)/onboarding/actions";
import {
  STATUS_LABELS,
  CATEGORY_LABELS,
  ASSIGNEE_ROLE_LABELS,
  type OnboardingCategory,
} from "@/types/onboarding";
import type { OnboardingChecklistDB } from "@/types/onboarding";
import { cn } from "@/lib/utils";
import type { OnboardingStatus } from "@/types/onboarding";

interface OnboardingDetailViewProps {
  onboardingId: string;
}

interface OnboardingDetailData {
  id: string;
  status: string;
  startDate: Date | string;
  completedDate?: Date | string | null;
  progress: number;
  completedCount: number;
  totalCount: number;
  notes?: string | null;
  user?: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    username?: string | null;
    department?: { id: string; name: string } | null;
    position?: { id: string; name: string } | null;
    manager?: { id: string; name: string } | null;
  };
  template?: { id: string; name: string } | null;
  checklistByCategory: Record<string, OnboardingChecklistDB[]>;
}

function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "—";
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(dateStr));
  } catch {
    return "—";
  }
}

export function OnboardingDetailView({
  onboardingId,
}: OnboardingDetailViewProps) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<OnboardingDetailData | null>({
    queryKey: ["onboarding-detail", onboardingId],
    queryFn: () => getOnboardingDetail(onboardingId),
    enabled: !!onboardingId,
  });

  const checklistMutation = useMutation({
    mutationFn: ({ id, isCompleted }: { id: string; isCompleted: boolean }) =>
      updateChecklistItem(id, { isCompleted }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboardings"] });
      queryClient.invalidateQueries({ queryKey: ["onboarding-detail"] });
    },
    onError: () => {
      toast.error("Cập nhật thất bại");
    },
  });

  const getDaysUntilDue = (dueDate: Date | string | null) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <p className="text-muted-foreground text-sm">
          Không tìm thấy thông tin
        </p>
      </div>
    );
  }

  const categories = Object.keys(data.checklistByCategory);

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Header */}
      <div className="shrink-0 p-4 border-b space-y-4">
        {/* Employee Header */}
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarImage src={data.user?.image || undefined} />
            <AvatarFallback className="text-lg">
              {data.user?.name?.charAt(0)?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base text-foreground leading-tight">
              {data.user?.name || "—"}
            </h3>
            <p className="text-xs text-muted-foreground leading-tight mt-0.5">
              {data.user?.username || "—"} •{" "}
              {data.user?.department?.name || "—"} •{" "}
              {data.user?.position?.name || "—"}
            </p>
            {data.user?.manager && (
              <p className="text-xs text-muted-foreground mt-0.5">
                QL: {data.user.manager.name}
              </p>
            )}
          </div>
          <Badge
            className={cn(
              "text-[10px] font-semibold shrink-0",
              data.status === "COMPLETED"
                ? "bg-green-100 text-green-800"
                : data.status === "IN_PROGRESS"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-yellow-100 text-yellow-800",
            )}
          >
            {STATUS_LABELS[data.status as OnboardingStatus] || data.status}
          </Badge>
        </div>

        {/* Progress */}
        <div className="bg-slate-50 rounded-lg p-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium">Tiến độ</span>
            <span className="text-xs font-bold text-blue-600">
              {data.completedCount}/{data.totalCount} ({data.progress}%)
            </span>
          </div>
          <Progress value={data.progress} className="h-2" />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Bắt đầu: {formatDate(data.startDate)}</span>
            {data.completedDate && (
              <span>HT: {formatDate(data.completedDate)}</span>
            )}
          </div>
        </div>

        {/* Notes */}
        {data.notes && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
            <p className="text-xs text-yellow-800">
              <span className="font-medium">Ghi chú:</span> {data.notes}
            </p>
          </div>
        )}
      </div>

      {/* Scrollable Content */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-3">
          <Accordion type="multiple" className="space-y-2">
            {categories.map((category) => {
              const categoryTasks = data.checklistByCategory[category];
              const completedInCategory = categoryTasks.filter(
                (t) => t.isCompleted,
              ).length;
              const totalInCategory = categoryTasks.length;
              const categoryPercent =
                totalInCategory > 0
                  ? Math.round((completedInCategory / totalInCategory) * 100)
                  : 0;

              return (
                <AccordionItem
                  key={category}
                  value={category}
                  className="border rounded-lg px-3 bg-white"
                >
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center gap-2 w-full pr-2">
                      <div className="p-1.5 rounded border bg-slate-100 shrink-0">
                        <Users className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-xs font-medium">
                          {CATEGORY_LABELS[category as OnboardingCategory] ||
                            category}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {completedInCategory}/{totalInCategory} hoàn thành
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Progress
                          value={categoryPercent}
                          className="h-1.5 w-12"
                        />
                        <span className="text-[10px] font-medium min-w-[28px] text-right">
                          {categoryPercent}%
                        </span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-1.5 pb-2">
                      {categoryTasks.map((task) => {
                        const daysUntil = getDaysUntilDue(task.dueDate);
                        const isOverdue =
                          daysUntil !== null &&
                          daysUntil < 0 &&
                          !task.isCompleted;
                        const isDueSoon =
                          daysUntil !== null &&
                          daysUntil >= 0 &&
                          daysUntil <= 2 &&
                          !task.isCompleted;

                        return (
                          <div
                            key={task.id}
                            className={cn(
                              "flex items-start gap-2 p-2 rounded-lg border transition-colors",
                              task.isCompleted
                                ? "bg-green-50/50 border-green-100"
                                : "bg-white border-slate-100 hover:border-blue-200",
                            )}
                          >
                            <Checkbox
                              checked={task.isCompleted}
                              onCheckedChange={(checked) =>
                                checklistMutation.mutate({
                                  id: task.id,
                                  isCompleted: !!checked,
                                })
                              }
                              disabled={
                                checklistMutation.isPending ||
                                data.status === "COMPLETED"
                              }
                              className="mt-0.5 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p
                                className={cn(
                                  "text-xs font-medium leading-tight",
                                  task.isCompleted &&
                                    "line-through text-muted-foreground",
                                )}
                              >
                                {task.taskTitle}
                              </p>
                              {task.taskDescription && (
                                <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                                  {task.taskDescription}
                                </p>
                              )}
                              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                {task.assigneeRole && (
                                  <Badge
                                    variant="outline"
                                    className="text-[9px] px-1 py-0 h-4"
                                  >
                                    <User className="h-2.5 w-2.5 mr-0.5" />
                                    {ASSIGNEE_ROLE_LABELS[
                                      task.assigneeRole as keyof typeof ASSIGNEE_ROLE_LABELS
                                    ] || task.assigneeRole}
                                  </Badge>
                                )}
                                {task.assignee && (
                                  <Badge
                                    variant="outline"
                                    className="text-[9px] px-1 py-0 h-4 bg-blue-50"
                                  >
                                    {task.assignee.name}
                                  </Badge>
                                )}
                                {task.dueDate && (
                                  <span
                                    className={cn(
                                      "flex items-center gap-0.5 text-[10px]",
                                      isOverdue
                                        ? "text-red-600"
                                        : isDueSoon
                                          ? "text-orange-600"
                                          : "text-muted-foreground",
                                    )}
                                  >
                                    <Clock className="h-2.5 w-2.5" />
                                    {isOverdue
                                      ? `Quá hạn ${Math.abs(daysUntil!)} ngày`
                                      : isDueSoon
                                        ? `Còn ${daysUntil} ngày`
                                        : formatDate(task.dueDate)}
                                  </span>
                                )}
                              </div>
                            </div>
                            {isOverdue && !task.isCompleted && (
                              <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>

          {/* All Completed */}
          {data.completedCount === data.totalCount && data.totalCount > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto mb-1" />
              <p className="text-xs font-medium text-green-800">
                Tất cả công việc đã hoàn thành!
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
