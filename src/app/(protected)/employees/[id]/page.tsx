import { notFound } from "next/navigation";
import Image from "next/image";
import {
  Mail,
  Phone,
  Building2,
  Briefcase,
  Calendar,
  Clock,
  Printer,
  Pencil,
  ChevronLeft,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { EmployeeStatusBadge } from "@/components/employees/employee-status-badge";
import { getEmployeeById } from "../actions";
import Link from "next/link";

// Profile Tabs
import { GeneralTab } from "@/components/employees/profile-tabs/general-tab";
import { WorkTab } from "@/components/employees/profile-tabs/work-tab";
import { ContractsTab } from "@/components/employees/profile-tabs/contracts-tab";
import { TimelineTab } from "@/components/employees/profile-tabs/timeline-tab";
import { RewardsTab } from "@/components/employees/profile-tabs/rewards-tab";
import { FamilyTab } from "@/components/employees/profile-tabs/family-tab";

interface EmployeeProfilePageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: EmployeeProfilePageProps) {
  const resolvedParams = await params;
  const employee = await getEmployeeById(resolvedParams.id);
  if (!employee) return { title: "Không tìm thấy - Digital HRM" };
  return {
    title: `${employee.fullName || employee.name} - Hồ sơ nhân viên | Digital HRM`,
  };
}

function formatSeniority(hireDate: Date | null): string {
  if (!hireDate) return "---";
  const now = new Date();
  const hire = new Date(hireDate);
  const diffMs = now.getTime() - hire.getTime();
  const years = Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000));
  const months = Math.floor(
    (diffMs % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000),
  );
  if (years > 0) return `${years} năm ${months} tháng`;
  return `${months} tháng`;
}

export default async function EmployeeProfilePage({
  params,
}: EmployeeProfilePageProps) {
  const resolvedParams = await params;
  const employee = await getEmployeeById(resolvedParams.id);

  if (!employee) {
    notFound();
  }

  const displayName = employee.fullName || employee.name;
  const displayPosition =
    (employee.position as { name?: string } | null)?.name ||
    "Chưa cập nhật chức vụ";
  const displayDepartment = employee.department?.name || "Chưa cập nhật";

  return (
    <div>
      {/* Breadcrumb + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 h-10 border-b">
        <div className="flex items-center gap-3">
          <Link href="/employees">
            <Button variant="ghost" size="icon-xs" tooltip={"Quay lại"}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>

          <h1 className="font-bold">Hồ sơ nhân viên</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="xs">
            <Printer className="h-3.5 w-3.5" />
            In hồ sơ
          </Button>
          <Link href={`/employees/${resolvedParams.id}/edit`}>
            <Button size="xs">
              <Pencil className="h-3.5 w-3.5" />
              Chỉnh sửa
            </Button>
          </Link>
        </div>
      </div>

      <div className="overflow-auto h-[calc(100vh-6rem)] p-4">
        {/* Hero Card with gradient */}
        <Card className="overflow-hidden border-0 shadow- py-0 ">
          <div className="relative">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-linear-to-r from-primary/10 via-primary/5 to-transparent" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-linear-to-bl from-primary/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/4" />

            <CardContent className="relative p-4">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                {/* Avatar */}
                <div className="relative group">
                  <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl border-4 border-background bg-gradient-to-br from-primary/20 to-primary/5 flex shrink-0 items-center justify-center text-primary font-bold text-3xl sm:text-4xl shadow-lg ring-2 ring-primary/10">
                    {employee.avatar ? (
                      <Image
                        src={employee.avatar}
                        alt={displayName}
                        width={128}
                        height={128}
                        className="rounded-2xl object-cover"
                      />
                    ) : (
                      <span className="select-none">
                        {displayName.split(" ").pop()?.[0]}
                      </span>
                    )}
                  </div>
                  {/* Online indicator */}
                  {employee.employeeStatus === "ACTIVE" && (
                    <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-3 border-background ring-2 ring-emerald-200" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-2xl font-bold tracking-tight">
                          {displayName}
                        </h2>
                        <EmployeeStatusBadge status={employee.employeeStatus} />
                        <Badge className=" font-mono">
                          {employee.employeeCode || "---"}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground font-medium">
                        {displayPosition}
                      </p>
                    </div>
                  </div>

                  <Separator className="opacity-50" />

                  {/* Quick info grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2.5 text-muted-foreground">
                      <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                          Phòng ban
                        </div>
                        <div className="font-medium text-foreground">
                          {displayDepartment}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 text-muted-foreground">
                      <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center">
                        <Briefcase className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                          Loại HĐ
                        </div>
                        <div className="font-medium text-foreground">
                          {employee.employmentType === "FULL_TIME"
                            ? "Chính thức"
                            : employee.employmentType === "INTERN"
                              ? "Thực tập sinh"
                              : employee.employmentType === "PART_TIME"
                                ? "Bán thời gian"
                                : employee.employmentType || "Chưa rõ"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 text-muted-foreground">
                      <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                          Email
                        </div>
                        <a
                          href={`mailto:${employee.personalEmail || employee.email}`}
                          className="font-medium text-foreground hover:text-primary transition-colors text-xs"
                        >
                          {employee.personalEmail || employee.email}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 text-muted-foreground">
                      <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center">
                        <Phone className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                          Điện thoại
                        </div>
                        <a
                          href={`tel:${employee.phone}`}
                          className="font-medium text-foreground hover:text-primary transition-colors"
                        >
                          {employee.phone || "---"}
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Quick stats */}
                  <div className="flex flex-wrap gap-3 pt-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      <Calendar className="h-3 w-3" />
                      Thâm niên: {formatSeniority(employee.hireDate)}
                    </div>
                    {employee.hireDate && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                        <Clock className="h-3 w-3" />
                        Ngày vào:{" "}
                        {new Date(employee.hireDate).toLocaleDateString(
                          "vi-VN",
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>
        {/* Tabs */}
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="h-auto flex-wrap gap-1 bg-muted/50 p-1">
            <TabsTrigger value="general" className="text-xs sm:text-sm">
              Thông tin chung
            </TabsTrigger>
            <TabsTrigger value="work" className="text-xs sm:text-sm">
              Công việc
            </TabsTrigger>
            <TabsTrigger value="contracts" className="text-xs sm:text-sm">
              Hợp đồng
            </TabsTrigger>
            <TabsTrigger value="rewards" className="text-xs sm:text-sm">
              Khen thưởng / Kỷ luật
            </TabsTrigger>
            <TabsTrigger value="family" className="text-xs sm:text-sm">
              Gia cảnh
            </TabsTrigger>
            <TabsTrigger value="timeline" className="text-xs sm:text-sm">
              Lịch sử
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <GeneralTab employee={employee} />
          </TabsContent>

          <TabsContent value="work">
            <WorkTab employee={employee} />
          </TabsContent>

          <TabsContent value="contracts">
            <ContractsTab employeeId={resolvedParams.id} />
          </TabsContent>

          <TabsContent value="rewards">
            <RewardsTab employeeId={resolvedParams.id} />
          </TabsContent>

          <TabsContent value="family">
            <FamilyTab employeeId={resolvedParams.id} />
          </TabsContent>

          <TabsContent value="timeline">
            <TimelineTab employeeId={resolvedParams.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
