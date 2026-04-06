"use client";

import { useState } from "react";
import {
  Laptop,
  Mail,
  CreditCard,
  Users,
  BookOpen,
  FileText,
  CheckCircle2,
  Circle,
  AlertCircle,
  Clock,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  CATEGORY_LABELS,
  ASSIGNEE_ROLE_LABELS,
  type OnboardingCategory,
  type OnboardingChecklistDB,
} from "@/types/onboarding";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  EQUIPMENT: Laptop,
  ACCOUNT: Mail,
  TRAINING: BookOpen,
  DOCUMENTS: FileText,
  GENERAL: Users,
};

const CATEGORY_COLORS: Record<string, string> = {
  EQUIPMENT: "bg-orange-100 text-orange-700 border-orange-200",
  ACCOUNT: "bg-blue-100 text-blue-700 border-blue-200",
  TRAINING: "bg-purple-100 text-purple-700 border-purple-200",
  DOCUMENTS: "bg-green-100 text-green-700 border-green-200",
  GENERAL: "bg-slate-100 text-slate-700 border-slate-200",
};

interface OnboardingChecklistViewProps {
  data: {
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
      employeeCode?: string;
      department?: { id: string; name: string } | null;
      position?: { id: string; name: string } | null;
      manager?: { id: string; name: string } | null;
    };
    template?: { id: string; name: string } | null;
    checklistByCategory: Record<string, OnboardingChecklistDB[]>;
  };
  onCheckItem: (id: string, isCompleted: boolean) => void;
  isUpdating: boolean;
}

export function OnboardingChecklistView({
  data,
  onCheckItem,
  isUpdating,
}: OnboardingChecklistViewProps) {
  const [openCategories, setOpenCategories] = useState<string[]>(
    Object.keys(data.checklistByCategory)
  );

  const categories = Object.keys(data.checklistByCategory);

  const completedTasks = data.completedCount;
  const totalTasks = data.totalCount;

  const getDaysUntilDue = (dueDate: Date | string | null) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="space-y-6 py-4">
      {/* ─── Employee Header ──────────────────────────────────────── */}
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
          {data.user?.name?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg text-foreground">
            {data.user?.name || "—"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {data.user?.employeeCode || "—"} • {data.user?.department?.name || "—"} •{" "}
            {data.user?.position?.name || "—"}
          </p>
          {data.user?.manager && (
            <p className="text-xs text-muted-foreground mt-1">
              Quản lý: {data.user.manager.name}
            </p>
          )}
        </div>
        <Badge
          className={cn(
            "text-xs font-semibold",
            data.status === "COMPLETED"
              ? "bg-green-100 text-green-800 border-green-200"
              : data.status === "IN_PROGRESS"
              ? "bg-blue-100 text-blue-800 border-blue-200"
              : "bg-yellow-100 text-yellow-800 border-yellow-200"
          )}
        >
          {data.status === "COMPLETED"
            ? "Hoàn thành"
            : data.status === "IN_PROGRESS"
            ? "Đang tiếp nhận"
            : "Chờ bắt đầu"}
        </Badge>
      </div>

      {/* ─── Progress Section ──────────────────────────────────────── */}
      <div className="bg-slate-50 rounded-lg p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Tiến độ hoàn thành</span>
          <span className="text-sm font-bold text-blue-600">
            {completedTasks}/{totalTasks} ({data.progress}%)
          </span>
        </div>
        <Progress value={data.progress} className="h-3" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            Ngày bắt đầu:{" "}
            {data.startDate
              ? new Date(data.startDate).toLocaleDateString("vi-VN")
              : "—"}
          </span>
          {data.completedDate && (
            <span>
              Hoàn thành: {new Date(data.completedDate).toLocaleDateString("vi-VN")}
            </span>
          )}
        </div>
      </div>

      {/* ─── Template Info ─────────────────────────────────────────── */}
      {data.template && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span>Template: {data.template.name}</span>
        </div>
      )}

      {/* ─── Notes ────────────────────────────────────────────────── */}
      {data.notes && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            <span className="font-medium">Ghi chú:</span> {data.notes}
          </p>
        </div>
      )}

      <Separator />

      {/* ─── Checklist by Category ────────────────────────────────── */}
      <Accordion
        type="multiple"
        value={openCategories}
        onValueChange={setOpenCategories}
        className="space-y-2"
      >
        {categories.map((category) => {
          const categoryTasks = data.checklistByCategory[category];
          const completedInCategory = categoryTasks.filter((t) => t.isCompleted).length;
          const totalInCategory = categoryTasks.length;
          const categoryPercent =
            totalInCategory > 0
              ? Math.round((completedInCategory / totalInCategory) * 100)
              : 0;

          const Icon = CATEGORY_ICONS[category] || FileText;
          const colorClass = CATEGORY_COLORS[category] || CATEGORY_COLORS.GENERAL;

          return (
            <AccordionItem
              key={category}
              value={category}
              className="border rounded-lg px-4 bg-white"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3 w-full pr-4">
                  <div className={cn("p-2 rounded-lg border", colorClass)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm">
                      {CATEGORY_LABELS[category as OnboardingCategory] || category}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {completedInCategory}/{totalInCategory} hoàn thành
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={categoryPercent} className="h-2 w-16" />
                    <span className="text-xs font-medium min-w-[32px]">
                      {categoryPercent}%
                    </span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pb-2">
                  {categoryTasks.map((task) => {
                    const daysUntil = getDaysUntilDue(task.dueDate);
                    const isOverdue =
                      daysUntil !== null && daysUntil < 0 && !task.isCompleted;
                    const isDueSoon =
                      daysUntil !== null && daysUntil >= 0 && daysUntil <= 2 && !task.isCompleted;

                    return (
                      <div
                        key={task.id}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                          task.isCompleted
                            ? "bg-green-50/50 border-green-100"
                            : "bg-white border-slate-100 hover:border-blue-200"
                        )}
                      >
                        <Checkbox
                          checked={task.isCompleted}
                          onCheckedChange={(checked) =>
                            onCheckItem(task.id, !!checked)
                          }
                          disabled={isUpdating || data.status === "COMPLETED"}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              "text-sm font-medium",
                              task.isCompleted && "line-through text-muted-foreground"
                            )}
                          >
                            {task.taskTitle}
                          </p>
                          {task.taskDescription && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {task.taskDescription}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {/* Assignee Role */}
                            {task.assigneeRole && (
                              <Badge variant="outline" className="text-xs">
                                <User className="h-3 w-3 mr-1" />
                                {ASSIGNEE_ROLE_LABELS[
                                  task.assigneeRole as keyof typeof ASSIGNEE_ROLE_LABELS
                                ] || task.assigneeRole}
                              </Badge>
                            )}
                            {/* Assignee Name */}
                            {task.assignee && (
                              <Badge variant="outline" className="text-xs bg-blue-50">
                                {task.assignee.name}
                              </Badge>
                            )}
                            {/* Due Date */}
                            {task.dueDate && (
                              <span
                                className={cn(
                                  "flex items-center gap-1 text-xs",
                                  isOverdue
                                    ? "text-red-600"
                                    : isDueSoon
                                    ? "text-orange-600"
                                    : "text-muted-foreground"
                                )}
                              >
                                <Clock className="h-3 w-3" />
                                {isOverdue
                                  ? `Quá hạn ${Math.abs(daysUntil!)} ngày`
                                  : isDueSoon
                                  ? `Còn ${daysUntil} ngày`
                                  : new Date(task.dueDate).toLocaleDateString("vi-VN")}
                              </span>
                            )}
                            {/* Completed Info */}
                            {task.isCompleted && task.completedAt && (
                              <span className="flex items-center gap-1 text-xs text-green-600">
                                <CheckCircle2 className="h-3 w-3" />
                                {new Date(task.completedAt).toLocaleDateString("vi-VN")}
                              </span>
                            )}
                          </div>
                        </div>
                        {isOverdue && !task.isCompleted && (
                          <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-1" />
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

      {/* ─── All Completed Message ──────────────────────────────────── */}
      {completedTasks === totalTasks && totalTasks > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <p className="font-medium text-green-800">
            Tất cả công việc đã hoàn thành!
          </p>
          <p className="text-sm text-green-600 mt-1">
            Quá trình tiếp nhận nhân viên đã hoàn tất.
          </p>
        </div>
      )}
    </div>
  );
}
