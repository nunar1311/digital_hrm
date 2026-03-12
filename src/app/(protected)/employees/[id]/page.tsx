import { notFound } from "next/navigation";
import Image from "next/image";
import { Mail, Phone, Building2, Briefcase } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { EmployeeStatusBadge } from "@/components/employees/employee-status-badge";
import { mockEmployees } from "@/mock/employees";

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

export async function generateMetadata({ params }: EmployeeProfilePageProps) {
    const resolvedParams = await params;
    const employee = mockEmployees.find((e) => e.id === resolvedParams.id);
    if (!employee) return { title: "Không tìm thấy - Digital HRM" };
    return { title: `${employee.fullName} - Hồ sơ nhân viên | Digital HRM` };
}

export default async function EmployeeProfilePage({ params }: EmployeeProfilePageProps) {
    const resolvedParams = await params;
    const employee = mockEmployees.find((e) => e.id === resolvedParams.id);

    if (!employee) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Hồ sơ nhân viên</h1>
                    <p className="text-muted-foreground">
                        Chi tiết thông tin 360° của nhân viên {employee.fullName}.
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
                        <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full border-4 border-background bg-primary/10 flex flex-shrink-0 items-center justify-center text-primary font-bold text-3xl sm:text-4xl shadow-sm">
                            {employee.avatar ? (
                                <Image src={employee.avatar} alt={employee.fullName} width={128} height={128} className="rounded-full object-cover" />
                            ) : (
                                employee.fullName.split(' ').pop()?.[0]
                            )}
                        </div>

                        <div className="flex-1 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
                                        {employee.fullName}
                                        <EmployeeStatusBadge status={employee.status} />
                                    </h2>
                                    <p className="text-muted-foreground font-medium text-lg mt-1">
                                        {employee.position?.name || 'Chưa cập nhật chức vụ'}
                                    </p>
                                </div>
                                <Badge variant="secondary" className="px-3 py-1 w-fit text-sm">
                                    {employee.employeeCode}
                                </Badge>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Building2 className="h-4 w-4" />
                                    <span className="font-medium text-foreground">{employee.department?.name || 'Chưa cập nhật'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Briefcase className="h-4 w-4" />
                                    <span>Loại HĐ: <span className="font-medium text-foreground">{employee.employmentType === 'FULL_TIME' ? 'Chính thức' : employee.employmentType === 'INTERN' ? 'Thực tập sinh' : 'Thử việc'}</span></span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Mail className="h-4 w-4" />
                                    <a href={`mailto:${employee.personalEmail}`} className="hover:underline">{employee.personalEmail || 'N/A'}</a>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Phone className="h-4 w-4" />
                                    <a href={`tel:${employee.phone}`} className="hover:underline">{employee.phone || 'N/A'}</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-muted/50 rounded-lg hidden-scrollbar flex-nowrap">
                    <TabsTrigger value="general" className="rounded-md px-4 py-2">Thông tin chung</TabsTrigger>
                    <TabsTrigger value="work" className="rounded-md px-4 py-2">Công việc</TabsTrigger>
                    <TabsTrigger value="contracts" className="rounded-md px-4 py-2">Hợp đồng</TabsTrigger>
                    <TabsTrigger value="timeline" className="rounded-md px-4 py-2">Lịch sử</TabsTrigger>
                    <TabsTrigger value="leaves" className="rounded-md px-4 py-2" disabled>Nghỉ phép</TabsTrigger>
                    <TabsTrigger value="attendance" className="rounded-md px-4 py-2" disabled>Chấm công</TabsTrigger>
                    <TabsTrigger value="payroll" className="rounded-md px-4 py-2" disabled>Lương</TabsTrigger>
                    <TabsTrigger value="assets" className="rounded-md px-4 py-2" disabled>Tài sản</TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    <TabsContent value="general" className="m-0 focus-visible:outline-none">
                        <GeneralTab employee={employee} />
                    </TabsContent>
                    <TabsContent value="work" className="m-0 focus-visible:outline-none">
                        <WorkTab employee={employee} />
                    </TabsContent>
                    <TabsContent value="contracts" className="m-0 focus-visible:outline-none">
                        <ContractsTab employeeId={employee.id} />
                    </TabsContent>
                    <TabsContent value="timeline" className="m-0 focus-visible:outline-none">
                        <TimelineTab employeeId={employee.id} />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
