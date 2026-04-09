"use client";

import Link from "next/link";
import {
  CalendarDays,
  CalendarCheck,
  ChevronRight,
  ArrowRight,
  Clock,
  FileText,
  Wallet,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { ESSDashboardData } from "./types";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface ESSClientProps {
  initialData: ESSDashboardData;
}

const quickActions = [
  {
    title: "Đăng ký nghỉ phép",
    description: "Gửi yêu cầu nghỉ phép",
    href: "/ess/leave",
    icon: CalendarDays,
    color: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20",
  },
  {
    title: "Xem bảng công",
    description: "Kiểm tra công tháng",
    href: "/ess/attendance",
    icon: CalendarCheck,
    color: "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20",
  },
  {
    title: "Tạo yêu cầu HC",
    description: "Xác nhận lương, giấy tờ",
    href: "/ess/requests",
    icon: FileText,
    color: "bg-teal-500/10 text-teal-600 hover:bg-teal-500/20",
  },
  {
    title: "Phiếu lương",
    description: "Xem phiếu lương tháng",
    href: "/ess/payroll",
    icon: Wallet,
    color: "bg-green-500/10 text-green-600 hover:bg-green-500/20",
  },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Chào buổi sáng";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

export function ESSClient({ initialData }: ESSClientProps) {
  const userName =
    initialData.profile.fullName || initialData.profile.name || "Nhân viên";
  const greeting = getGreeting();

  return (
    <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
      <div className="flex-1 overflow-auto p-2 sm:p-3 space-y-4 sm:space-y-6">
        {/* Welcome Header */}
        <div className="relative overflow-hidden">
          <div className="relative">
            <div className="flex flex-col gap-4 sm:gap-6">
              {/* Top row: greeting + date */}
              <div className="flex items-start sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg sm:text-xl md:text-2xl font-bold leading-tight">
                    {greeting}, <span className="text-primary">{userName}</span>
                  </h1>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-1 text-xs sm:text-sm text-muted-foreground">
                    <Badge className="text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1">
                      {initialData.profile.username}
                    </Badge>
                    <span className="text-muted-foreground/50 ">•</span>
                    <span className="truncate">
                      {initialData.profile.department?.name || ""}
                    </span>
                    <span className="text-muted-foreground/50 ">•</span>
                    <span className="truncate">
                      {initialData.profile.position?.name || ""}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right hidden sm:block">
                    <div className="text-sm sm:text-lg font-semibold leading-tight">
                      {format(new Date(), "EEEE, dd MMMM yyyy", { locale: vi })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <Card className="bg-linear-to-b from-primary/5 to-primary/10 border-primary/10 p-3">
          <CardHeader className="px-2 sm:px-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <span className="hidden xs:inline">Thao tác nhanh</span>
                <span className="xs:hidden">Thao tác</span>
              </CardTitle>
              <Link href="/ess/my-requests">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1 text-primary h-7 sm:h-8 px-2"
                >
                  <span className="hidden sm:inline">Xem tất cả đơn</span>
                  <span className="sm:hidden">Tất cả</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-2 sm:px-3">
            <div className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.href} href={action.href}>
                    <div className="flex items-center gap-2 sm:gap-4 p-2.5 sm:p-4 rounded-lg bg-muted-foreground/10  border border-border hover:border-primary/20 hover:shadow-sm transition-all duration-200 group cursor-pointer active:scale-[0.98]">
                      <div
                        className={cn(
                          "p-1.5 sm:p-2.5 rounded-lg shrink-0",
                          action.color,
                        )}
                      >
                        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs sm:text-sm group-hover:text-primary transition-colors leading-tight">
                          {action.title}
                        </div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground truncate hidden sm:block">
                          {action.description}
                        </div>
                      </div>
                      <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Two Column Layout */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          {/* Leave Balance */}
          <Card className="p-2">
            <CardHeader className="flex items-center justify-between px-2 sm:px-4">
              <div className="space-y-1 min-w-0">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <span className="truncate">Số dư ngày nghỉ phép</span>
                </CardTitle>
                <CardDescription className="text-xs hidden sm:block">
                  Năm {new Date().getFullYear()} •{" "}
                  {initialData.leaveBalances.length} loại nghỉ phép
                </CardDescription>
              </div>
              <Link href="/ess/leave" className="shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1 h-7 sm:h-8"
                >
                  Xem tất cả
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="px-2 sm:px-4">
              {initialData.leaveBalances.length === 0 ? (
                <div className="text-sm text-muted-foreground py-6 sm:py-8 text-center">
                  <CalendarDays className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-muted-foreground/50" />
                  Chưa có số dư nghỉ phép
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {initialData.leaveBalances.slice(0, 4).map((balance) => {
                    const remaining = Math.max(
                      0,
                      balance.totalDays -
                        balance.usedDays -
                        balance.pendingDays,
                    );
                    const usagePercent =
                      balance.totalDays > 0
                        ? ((balance.usedDays + balance.pendingDays) /
                            balance.totalDays) *
                          100
                        : 0;
                    return (
                      <div
                        key={balance.id}
                        className="space-y-1.5 sm:space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
                          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                            <span className="font-medium truncate">
                              {balance.leaveType.name}
                            </span>
                            {balance.leaveType.isPaidLeave && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] sm:text-xs bg-emerald-100 text-emerald-700 shrink-0 px-1 py-0"
                              >
                                Có lương
                              </Badge>
                            )}
                          </div>
                          <span className="text-muted-foreground shrink-0 text-xs sm:text-sm">
                            {remaining} / {balance.totalDays}
                          </span>
                        </div>
                        <Progress
                          value={100 - usagePercent}
                          className="h-1.5 sm:h-2"
                        />
                        <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground">
                          <span>Đã dùng: {balance.usedDays}</span>
                          {balance.pendingDays > 0 && (
                            <span className="text-orange-600 font-medium">
                              Chờ: {balance.pendingDays}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right Column */}
          <div className="space-y-4 sm:space-y-6">
            {/* Upcoming Holidays */}
            <Card className="p-2">
              <CardHeader className="px-2 sm:px-4">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  Nghỉ lễ sắp tới
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 sm:px-4">
                {initialData.upcomingHolidays.length === 0 ? (
                  <div className="text-xs sm:text-sm text-muted-foreground py-3 sm:py-4 text-center">
                    Không có ngày nghỉ lễ trong 30 ngày tới
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {initialData.upcomingHolidays.slice(0, 3).map((holiday) => (
                      <div
                        key={holiday.id}
                        className="flex items-center gap-2 sm:gap-4 p-2.5 sm:p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="p-1.5 sm:p-2.5 rounded-lg bg-red-100 text-red-600 shrink-0">
                          <CalendarDays className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs sm:text-sm leading-tight truncate">
                            {holiday.name}
                          </p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">
                            {new Date(holiday.date).toLocaleDateString(
                              "vi-VN",
                              {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                              },
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Announcements */}
            <Card className="p-2">
              <CardHeader className="px-2 sm:px-4">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  Thông báo mới
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 sm:px-4">
                {initialData.announcements.length === 0 ? (
                  <div className="text-xs sm:text-sm text-muted-foreground py-3 sm:py-4 text-center">
                    Không có thông báo mới
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {initialData.announcements.slice(0, 3).map((ann) => (
                      <div
                        key={ann.id}
                        className="p-2 sm:p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-xs sm:text-sm leading-tight truncate">
                              {ann.title}
                            </p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 line-clamp-2">
                              {ann.content}
                            </p>
                          </div>
                          {ann.type === "WARNING" && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] sm:text-xs bg-amber-100 text-amber-800 shrink-0 px-1 py-0"
                            >
                              Quan trọng
                            </Badge>
                          )}
                          {ann.type === "INFO" && (
                            <Badge
                              variant="outline"
                              className="text-[10px] sm:text-xs shrink-0 px-1 py-0"
                            >
                              Thông báo
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-2">
                          {new Date(ann.date).toLocaleDateString("vi-VN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
