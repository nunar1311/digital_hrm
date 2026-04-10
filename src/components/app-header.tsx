"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import UserProfile from "./user-profile";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRightSidebar } from "@/contexts/sidebar-context";

const importantRouteLabels: Record<string, string> = {
  "org-chart": "Sơ đồ tổ chức",
  departments: "Phòng ban",
  employees: "Nhân viên",
  new: "Thêm mới",
  edit: "Chỉnh sửa",
  contracts: "Hợp đồng",
  templates: "Mẫu hợp đồng",
  leaves: "Nghỉ phép",
  calendar: "Lịch Team",
  policies: "Chính sách",
  requests: "Yêu cầu",
  attendance: "Chấm công",
  monthly: "Bảng công tháng",
  shifts: "Ca làm việc",
  overtime: "Làm thêm giờ",
  explanations: "Giải trình",
  payroll: "Tính lương",
  formulas: "Công thức",
  payslips: "Phiếu lương",
  "tax-insurance": "Thuế & BHXH",
  onboarding: "Onboarding",
  offboarding: "Offboarding",
  recruitment: "Tuyển dụng",
  training: "Đào tạo",
  performance: "Đánh giá",
  assets: "Tài sản",
  rewards: "Khen thưởng & KL",
  reports: "Báo cáo",
  ess: "Cổng nhân viên",
  profile: "Hồ sơ cá nhân",
  settings: "Cài đặt",
  roles: "Phân quyền",
  "audit-log": "Nhật ký",
};

const idSegmentPatterns = [
  /^\d+$/,
  /^c[a-z0-9]{24}$/i,
  /^[a-f0-9]{24}$/i,
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
];

const isIdSegment = (segment: string) =>
  idSegmentPatterns.some((pattern) => pattern.test(segment));

export function AppHeader() {
  const pathname = usePathname();
  const { openRightSidebar } = useRightSidebar();
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbItems = segments.reduce<{ href: string; label: string }[]>(
    (items, segment, index) => {
      if (isIdSegment(segment)) {
        return items;
      }

      const label = importantRouteLabels[segment];
      if (!label) {
        return items;
      }

      const href = "/" + segments.slice(0, index + 1).join("/");

      items.push({ href, label });
      return items;
    },
    [],
  );

  return (
    <header className="flex h-10 shrink-0 items-center justify-between gap-2 px-4 py-4">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb className="min-w-0">
          <BreadcrumbList className="min-w-0 flex-nowrap overflow-hidden whitespace-nowrap">
            <BreadcrumbItem>
              <BreadcrumbLink
                asChild
                className="block max-w-30 truncate sm:max-w-none"
              >
                <Link href="/">Trang chủ</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {breadcrumbItems.map((item, index) => {
              const isLast = index === breadcrumbItems.length - 1;

              return (
                <span
                  key={item.href}
                  className={isLast ? "contents" : "hidden sm:contents"}
                >
                  <BreadcrumbSeparator />
                  <BreadcrumbItem className="min-w-0">
                    {isLast ? (
                      <BreadcrumbPage className="block max-w-36 truncate sm:max-w-none">
                        {item.label}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink
                        href={item.href}
                        className="block max-w-36 truncate lg:max-w-none"
                      >
                        {item.label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </span>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2">
        <Button
          variant="outline"
          size="xs"
          onClick={() => openRightSidebar("ai_assistant", {})}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Ask AI</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => openRightSidebar("ai_assistant", {})}
          className="h-8 w-8 text-primary sm:hidden"
        >
          <Sparkles className="h-4 w-4" />
        </Button>
        <UserProfile />
      </div>
    </header>
  );
}
