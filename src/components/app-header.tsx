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

const routeLabels: Record<string, string> = {
    "": "Trang chủ",
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

export function AppHeader() {
    const pathname = usePathname();
    const segments = pathname.split("/").filter(Boolean);

    return (
        <header className="flex h-10 shrink-0 items-center justify-between gap-2 px-4 py-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator
                    orientation="vertical"
                    className="mr-2 h-4"
                />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/">
                                Trang chủ
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        {segments.map((segment, index) => {
                            const href =
                                "/" +
                                segments
                                    .slice(0, index + 1)
                                    .join("/");
                            const label =
                                routeLabels[segment] ||
                                decodeURIComponent(segment);
                            const isLast =
                                index === segments.length - 1;

                            return (
                                <span key={href} className="contents">
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem>
                                        {isLast ? (
                                            <BreadcrumbPage>
                                                {label}
                                            </BreadcrumbPage>
                                        ) : (
                                            <BreadcrumbLink
                                                href={href}
                                            >
                                                {label}
                                            </BreadcrumbLink>
                                        )}
                                    </BreadcrumbItem>
                                </span>
                            );
                        })}
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            <UserProfile />
        </header>
    );
}
