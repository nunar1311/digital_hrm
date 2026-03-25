"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmployeeStatusBadge } from "@/components/employees/employee-status-badge";
import {
  Building2,
  Briefcase,
  UserCheck,
  Users,
  Calendar,
  Clock,
  CreditCard,
  Landmark,
  ShieldCheck,
  History,
} from "lucide-react";
import { getWorkHistories } from "@/app/(protected)/employees/actions";

interface EmployeeData {
  id: string;
  department?: { name: string } | null;
  position?: { name: string } | null;
  manager?: {
    id: string;
    fullName?: string;
    name: string;
    employeeCode: string | null;
    image: string | null;
    position?: { name: string } | null;
  } | null;
  directReports?: {
    id: string;
    name: string;
    employeeCode: string | null;
    image: string | null;
    position?: { name: string } | null;
  }[];
  employeeStatus?: string | null;
  employmentType?: string | null;
  hireDate?: Date | string | null;
  probationEnd?: Date | string | null;
  resignDate?: Date | string | null;
  bankName?: string | null;
  bankAccount?: string | null;
  bankBranch?: string | null;
  taxCode?: string | null;
  socialInsuranceNo?: string | null;
  healthInsuranceNo?: string | null;
}

interface Props {
  employee: EmployeeData;
}

const InfoRow = ({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 py-3 border-b last:border-0 border-border/50 gap-1 sm:gap-4 group">
    <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
    </div>
    <div className="sm:col-span-2 text-sm text-foreground">
      {value || (
        <span className="text-muted-foreground italic">Chưa cập nhật</span>
      )}
    </div>
  </div>
);

export function WorkTab({ employee }: Props) {
  const { data: workHistories = [], isLoading } = useQuery({
    queryKey: ["workHistories", employee.id],
    queryFn: () => getWorkHistories(employee.id),
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Thông tin nội bộ */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin công việc nội bộ</CardTitle>
        </CardHeader>
        <CardContent>
          <InfoRow
            label="Phòng ban"
            icon={Building2}
            value={
              employee.department?.name && (
                <span className="font-medium text-primary">
                  {employee.department.name}
                </span>
              )
            }
          />
          <InfoRow
            label="Chức vụ"
            icon={Briefcase}
            value={
              employee.position?.name && (
                <span className="font-medium">{employee.position.name}</span>
              )
            }
          />
          <InfoRow
            label="Quản lý trực tiếp"
            icon={UserCheck}
            value={
              employee.manager ? (
                <Link
                  href={`/employees/${employee.manager.id}`}
                  className="flex items-center gap-2 hover:underline text-primary"
                >
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold">
                    {
                      (employee.manager.fullName || employee.manager.name)
                        .split(" ")
                        .pop()?.[0]
                    }
                  </div>
                  <span>
                    {employee.manager.fullName || employee.manager.name} -{" "}
                    {employee.manager.employeeCode}
                  </span>
                </Link>
              ) : (
                <span className="text-muted-foreground">
                  Báo cáo trực tiếp lên Ban Giám đốc
                </span>
              )
            }
          />
          <InfoRow
            label="Trạng thái"
            icon={ShieldCheck}
            value={
              <EmployeeStatusBadge status={employee.employeeStatus ?? null} />
            }
          />
          <InfoRow
            label="Loại hình"
            icon={Users}
            value={
              <Badge variant="outline">
                {employee.employmentType === "FULL_TIME"
                  ? "Chính thức"
                  : employee.employmentType === "PART_TIME"
                    ? "Bán thời gian"
                    : employee.employmentType === "INTERN"
                      ? "Thực tập sinh"
                      : "Cộng tác viên"}
              </Badge>
            }
          />
          <InfoRow
            label="Ngày gia nhập"
            icon={Calendar}
            value={
              employee.hireDate
                ? new Date(employee.hireDate).toLocaleDateString("vi-VN")
                : null
            }
          />
          <InfoRow
            label="Hết hạn thử việc"
            icon={Clock}
            value={
              employee.probationEnd
                ? new Date(employee.probationEnd).toLocaleDateString("vi-VN")
                : null
            }
          />
          {employee.resignDate && (
            <InfoRow
              label="Ngày nghỉ việc"
              icon={Calendar}
              value={
                <span className="text-destructive font-medium">
                  {new Date(employee.resignDate).toLocaleDateString("vi-VN")}
                </span>
              }
            />
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        {/* Ngân hàng */}
        <Card>
          <CardHeader>
            <CardTitle>Tài khoản Ngân hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow
              label="Tên Ngân hàng"
              icon={Landmark}
              value={employee.bankName}
            />
            <InfoRow
              label="Số tài khoản"
              icon={CreditCard}
              value={
                employee.bankAccount && (
                  <span className="font-mono">{employee.bankAccount}</span>
                )
              }
            />
            <InfoRow
              label="Chi nhánh"
              icon={Building2}
              value={employee.bankBranch}
            />
          </CardContent>
        </Card>

        {/* Thuế & Bảo hiểm */}
        <Card>
          <CardHeader>
            <CardTitle>Thuế & Bảo hiểm xã hội</CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow
              label="Mã số thuế"
              icon={CreditCard}
              value={
                employee.taxCode && (
                  <span className="font-mono">{employee.taxCode}</span>
                )
              }
            />
            <InfoRow
              label="Số sổ BHXH"
              icon={ShieldCheck}
              value={
                employee.socialInsuranceNo && (
                  <span className="font-mono">
                    {employee.socialInsuranceNo}
                  </span>
                )
              }
            />
            <InfoRow
              label="Số thẻ BHYT"
              icon={ShieldCheck}
              value={
                employee.healthInsuranceNo && (
                  <span className="font-mono">
                    {employee.healthInsuranceNo}
                  </span>
                )
              }
            />
          </CardContent>
        </Card>
      </div>

      {/* Kinh nghiệm làm việc */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>
            Kinh nghiệm làm việc trước đây
            {workHistories.length > 0 && (
              <Badge variant="secondary" className="text-xs ml-1">
                {workHistories.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-20 rounded-xl bg-muted/50 animate-pulse"
                />
              ))}
            </div>
          ) : workHistories.length > 0 ? (
            <div className="relative border-l-2 border-border/50 ml-4 space-y-6 py-2">
              {workHistories.map((wh) => (
                <div key={wh.id} className="relative pl-6 group">
                  <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-primary ring-4 ring-background transition-transform group-hover:scale-125" />
                  <div className="p-3 rounded-xl border bg-card hover:shadow-md transition-all duration-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1">
                      <h3 className="text-sm font-semibold">{wh.position}</h3>
                      <time className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded-md">
                        {new Date(wh.startDate).toLocaleDateString("vi-VN", {
                          month: "2-digit",
                          year: "numeric",
                        })}{" "}
                        -{" "}
                        {wh.endDate
                          ? new Date(wh.endDate).toLocaleDateString("vi-VN", {
                              month: "2-digit",
                              year: "numeric",
                            })
                          : "Hiện tại"}
                      </time>
                    </div>
                    <div className="text-sm font-medium text-primary/80 mb-1">
                      {wh.company}
                    </div>
                    {wh.description && (
                      <p className="text-xs text-muted-foreground">
                        {wh.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">
                Chưa có thông tin kinh nghiệm làm việc trước đây.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Direct Reports */}
      {employee.directReports && employee.directReports.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Nhân viên cấp dưới
              <Badge variant="secondary" className="text-xs ml-1">
                {employee.directReports.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {employee.directReports.map((report) => (
                <Link
                  key={report.id}
                  href={`/employees/${report.id}`}
                  className="group flex flex-col items-center gap-2 p-3 rounded-xl border hover:shadow-md hover:border-primary/30 transition-all duration-200"
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary group-hover:bg-primary/20 transition-colors">
                    {report.name.split(" ").pop()?.[0]}
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-medium text-foreground truncate max-w-[100px]">
                      {report.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {report.employeeCode}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
