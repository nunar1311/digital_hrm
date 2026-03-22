import { notFound } from "next/navigation";
import Image from "next/image";
import { Mail, Phone, Building2, Briefcase } from "lucide-react";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { EmployeeStatusBadge } from "@/components/employees/employee-status-badge";
import { getEmployeeById } from "../actions";

// Profile Tabs
import { GeneralTab } from "@/components/employees/profile-tabs/general-tab";
import { WorkTab } from "@/components/employees/profile-tabs/work-tab";
import { ContractsTab } from "@/components/employees/profile-tabs/contracts-tab";
import { TimelineTab } from "@/components/employees/profile-tabs/timeline-tab";

interface EmployeeProfilePageProps {
    params: Promise<{
        id: string;
    }>;
}

export async function generateMetadata({
    params,
}: EmployeeProfilePageProps) {
    const resolvedParams = await params;
    const employee = await getEmployeeById(resolvedParams.id);
    if (!employee) return { title: "Không tìm thấy - Digital HRM" };
    return {
        title: `${employee.fullName || employee.name} - Hồ sơ nhân viên | Digital HRM`,
    };
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
        (employee.position as { name?: string } | null)?.name || "Chưa cập nhật chức vụ";
    const displayDepartment =
        employee.department?.name || "Chưa cập nhật";

    return (
        <div className="space-y-6 p-4 md:p-6 h-[calc(100vh-100px)] overflow-auto no-scrollbar">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Hồ sơ nhân viên
                    </h1>
                    <p className="text-muted-foreground">
                        Chi tiết thông tin 360° của nhân viên{" "}
                        {displayName}.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline">In hồ sơ</Button>
                    <Button>Chỉnh sửa</Button>
                </div>
            </div>

            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                        <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full border-4 border-background bg-primary/10 flex shrink-0 items-center justify-center text-primary font-bold text-3xl sm:text-4xl shadow-sm">
                            {employee.avatar ? (
                                <Image
                                    src={employee.avatar}
                                    alt={displayName}
                                    width={128}
                                    height={128}
                                    className="rounded-full object-cover"
                                />
                            ) : (
                                displayName.split(" ").pop()?.[0]
                            )}
                        </div>

                        <div className="flex-1 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
                                        {displayName}
                                        <EmployeeStatusBadge
                                            status={
                                                employee.employeeStatus
                                            }
                                        />
                                    </h2>
                                    <p className="text-muted-foreground font-medium text-lg mt-1">
                                        {displayPosition}
                                    </p>
                                </div>
                                <Badge
                                    variant="secondary"
                                    className="px-3 py-1 w-fit text-sm"
                                >
                                    {employee.employeeCode || "---"}
                                </Badge>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Building2 className="h-4 w-4" />
                                    <span className="font-medium text-foreground">
                                        {displayDepartment}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Briefcase className="h-4 w-4" />
                                    <span>
                                        Loại HĐ:{" "}
                                        <span className="font-medium text-foreground">
                                            {employee.employmentType ===
                                            "FULL_TIME"
                                                ? "Chính thức"
                                                : employee.employmentType ===
                                                    "INTERN"
                                                  ? "Thực tập sinh"
                                                  : employee.employmentType ||
                                                    "Chưa rõ"}
                                        </span>
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Mail className="h-4 w-4" />
                                    <a
                                        href={`mailto:${employee.personalEmail || employee.email}`}
                                        className="hover:underline"
                                    >
                                        {employee.personalEmail ||
                                            employee.email}
                                    </a>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Phone className="h-4 w-4" />
                                    <a
                                        href={`tel:${employee.phone}`}
                                        className="hover:underline"
                                    >
                                        {employee.phone || "---"}
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="general" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="general">
                        Thông tin chung
                    </TabsTrigger>
                    <TabsTrigger value="work">Công việc</TabsTrigger>
                    <TabsTrigger value="contracts">
                        Hợp đồng
                    </TabsTrigger>
                    <TabsTrigger value="timeline">
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

                <TabsContent value="timeline">
                    <TimelineTab employeeId={resolvedParams.id} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
