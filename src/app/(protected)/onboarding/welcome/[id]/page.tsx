"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Loader2, CheckCircle2, Clock, User, Mail, Building2, Calendar, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getWelcomePortalData } from "@/app/(protected)/onboarding/actions";
import { CATEGORY_LABELS, ASSIGNEE_ROLE_LABELS, type OnboardingCategory } from "@/types/onboarding";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  EQUIPMENT: Building2,
  ACCOUNT: Mail,
  TRAINING: Calendar,
  DOCUMENTS: Calendar,
  GENERAL: User,
};

const CATEGORY_COLORS: Record<string, string> = {
  EQUIPMENT: "bg-orange-100 text-orange-700 border-orange-200",
  ACCOUNT: "bg-blue-100 text-blue-700 border-blue-200",
  TRAINING: "bg-purple-100 text-purple-700 border-purple-200",
  DOCUMENTS: "bg-green-100 text-green-700 border-green-200",
  GENERAL: "bg-slate-100 text-slate-700 border-slate-200",
};

export default function WelcomePortalPage() {
  const params = useParams();
  const onboardingId = params.id as string;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["welcome-portal", onboardingId],
    queryFn: () => getWelcomePortalData(onboardingId),
    enabled: !!onboardingId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">
            Không tìm thấy thông tin
          </h2>
          <p className="text-muted-foreground">
            Liên kết không hợp lệ hoặc đã hết hạn.
          </p>
        </div>
      </div>
    );
  }

  const { onboarding, checklistByCategory, completedTasks, totalTasks, assignedUsers } = data;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const categories = Object.keys(checklistByCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* ─── Header ──────────────────────────────────────────────── */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-2xl">
              {onboarding.user?.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Chào mừng, {onboarding.user?.name}!
              </h1>
              <p className="text-muted-foreground">
                {onboarding.user?.username} • {onboarding.user?.department?.name} •{" "}
                {onboarding.user?.position?.name}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Main Content ───────────────────────────────────────── */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* ─── Welcome Message ───────────────────────────────────── */}
        <Card className="border-none shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardContent className="pt-6">
            <h2 className="text-xl font-bold mb-2">
              Chào mừng bạn đến với công ty!
            </h2>
            <p className="text-blue-100 text-sm leading-relaxed">
              Cảm ơn bạn đã gia nhập đội ngũ. Dưới đây là danh sách các việc cần làm
              để hoàn tất quá trình tiếp nhận. Các bộ phận liên quan sẽ liên hệ với
              bạn trong thời gian sớm nhất.
            </p>
          </CardContent>
        </Card>

        {/* ─── Progress Card ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tiến độ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-3xl font-bold text-blue-600">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {completedTasks}/{totalTasks} công việc đã hoàn thành
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ngày bắt đầu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <span className="text-lg font-semibold">
                  {onboarding.startDate
                    ? new Date(onboarding.startDate).toLocaleDateString("vi-VN", {
                        weekday: "long",
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })
                    : "—"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Người quản lý
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <span className="text-lg font-semibold">
                  {onboarding.user?.manager?.name || "—"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Checklist ────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Danh sách công việc cần hoàn thành</CardTitle>
            <p className="text-sm text-muted-foreground">
              Các bộ phận IT, Admin và HR sẽ hỗ trợ bạn hoàn thành những việc sau
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {categories.map((category) => {
              const categoryTasks = checklistByCategory[category];
              const completedInCategory = categoryTasks.filter((t) => t.isCompleted).length;
              const totalInCategory = categoryTasks.length;
              const Icon = CATEGORY_ICONS[category] || Building2;
              const colorClass = CATEGORY_COLORS[category] || CATEGORY_COLORS.GENERAL;

              return (
                <div key={category}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn("p-2 rounded-lg border", colorClass)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {CATEGORY_LABELS[category as OnboardingCategory] || category}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {completedInCategory}/{totalInCategory} hoàn thành
                      </p>
                    </div>
                    {completedInCategory === totalInCategory && (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                  <div className="space-y-2 ml-2">
                    {categoryTasks.map((task) => {
                      const assignee = task.assigneeId ? assignedUsers[task.assigneeId] : null;
                      return (
                        <div
                          key={task.id}
                          className={cn(
                            "flex items-start gap-3 p-3 rounded-lg border transition-all",
                            task.isCompleted
                              ? "bg-green-50/50 border-green-100"
                              : "bg-slate-50/50 border-slate-100"
                          )}
                        >
                          {task.isCompleted ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                          ) : (
                            <Clock className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
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
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              {task.assigneeRole && (
                                <Badge variant="outline" className="text-xs">
                                  {ASSIGNEE_ROLE_LABELS[
                                    task.assigneeRole as keyof typeof ASSIGNEE_ROLE_LABELS
                                  ] || task.assigneeRole}
                                </Badge>
                              )}
                              {assignee && (
                                <Badge variant="outline" className="text-xs bg-blue-50">
                                  <User className="h-3 w-3 mr-1" />
                                  {assignee.name}
                                </Badge>
                              )}
                              {task.dueDate && !task.isCompleted && (
                                <span className="text-xs text-muted-foreground">
                                  Hạn: {new Date(task.dueDate).toLocaleDateString("vi-VN")}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <Separator className="mt-4" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* ─── All Completed ────────────────────────────────────── */}
        {completedTasks === totalTasks && totalTasks > 0 && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6 text-center">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-green-800 mb-2">
                Chúc mừng! Bạn đã hoàn thành onboarding!
              </h3>
              <p className="text-green-700">
                Cảm ơn bạn đã hoàn thành tất cả các bước tiếp nhận. Chúc bạn một
                ngày làm việc hiệu quả!
              </p>
            </CardContent>
          </Card>
        )}

        {/* ─── Contact Info ──────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Liên hệ hỗ trợ</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ:
            </p>
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>HR: hr@company.vn</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>IT: it@company.vn</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* ─── Footer ─────────────────────────────────────────────── */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-4xl mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Digital HRM. Hệ thống quản lý nhân sự.
        </div>
      </footer>
    </div>
  );
}
