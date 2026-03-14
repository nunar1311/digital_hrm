"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    Building2,
    Users,
    Briefcase,
    Calendar,
    Mail,
    Phone,
    MapPin,
    UserPlus,
} from "lucide-react";
import type { DepartmentListItem } from "@/app/(protected)/departments/types";
import { getDepartmentById, getDepartmentEmployees } from "@/app/(protected)/departments/actions";
import { STATUS_LABELS } from "@/components/org-chart/org-chart-constants";
import { useTimezone } from "@/hooks/use-timezone";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { EmployeeAssignDialog } from "./employee-assign-dialog";

interface DepartmentDetailSheetProps {
    departmentId: string | null;
    open: boolean;
    onClose: () => void;
}

export function DepartmentDetailSheet({
    departmentId,
    open,
    onClose,
}: DepartmentDetailSheetProps) {
    const queryClient = useQueryClient();
    const { timezone, formatDate, formatDateTime } = useTimezone();
    const [activeTab, setActiveTab] = useState("overview");
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);

    const { data: department, isLoading: isLoadingDept } = useQuery({
        queryKey: ["department", departmentId],
        queryFn: () => getDepartmentById(departmentId!),
        enabled: !!departmentId && open,
    });

    const { data: employeesData, isLoading: isLoadingEmployees } = useQuery({
        queryKey: ["department", departmentId, "employees"],
        queryFn: () => getDepartmentEmployees(departmentId!, { pageSize: 50 }),
        enabled: !!departmentId && open && activeTab === "employees",
    });

    useEffect(() => {
        if (!open) {
            setActiveTab("overview");
        }
    }, [open]);

    const handleAssigned = () => {
        queryClient.invalidateQueries({ queryKey: ["department", departmentId] });
        queryClient.invalidateQueries({ queryKey: ["department", departmentId, "employees"] });
        queryClient.invalidateQueries({ queryKey: ["departmentStats"] });
    };

    return (
        <>
            <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
                <SheetContent className="sm:max-w-[540px]">
                    <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                            {department?.logo && (
                                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-sm font-medium">
                                    {department.logo}
                                </div>
                            )}
                            {department?.name || "Chi tiết phòng ban"}
                        </SheetTitle>
                        <SheetDescription>
                            {department?.code && `Mã: ${department.code}`}
                        </SheetDescription>
                    </SheetHeader>

                    {isLoadingDept ? (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : department ? (
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                                <TabsTrigger value="employees">
                                    Nhân viên ({department.employeeCount})
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="overview" className="mt-4">
                                <ScrollArea className="h-[calc(100vh-200px)]">
                                    <div className="space-y-4">
                                        {/* Status */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">
                                                Trạng thái
                                            </span>
                                            <Badge
                                                variant={
                                                    department.status === "ACTIVE"
                                                        ? "default"
                                                        : "secondary"
                                                }
                                            >
                                                {STATUS_LABELS[department.status] ||
                                                    department.status}
                                            </Badge>
                                        </div>

                                        <Separator />

                                        {/* Manager */}
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-medium flex items-center gap-2">
                                                <Briefcase className="h-4 w-4" />
                                                Trưởng phòng
                                            </h4>
                                            {department.manager ? (
                                                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                                    <Avatar>
                                                        <AvatarImage src={department.manager.image || undefined} />
                                                        <AvatarFallback>
                                                            {department.manager.name.charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">
                                                            {department.manager.name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {department.manager.position || "Chưa có chức vụ"}
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">
                                                    Chưa phân công
                                                </p>
                                            )}
                                        </div>

                                        <Separator />

                                        {/* Parent */}
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-medium flex items-center gap-2">
                                                <Building2 className="h-4 w-4" />
                                                Phòng ban cấp trên
                                            </h4>
                                            <p className="text-sm">
                                                {department.parentName || "Không có (phòng ban gốc)"}
                                            </p>
                                        </div>

                                        <Separator />

                                        {/* Stats */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-3 rounded-lg bg-muted/50">
                                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                                    <Users className="h-4 w-4" />
                                                    <span className="text-xs">Nhân viên</span>
                                                </div>
                                                <p className="text-2xl font-bold">
                                                    {department.employeeCount}
                                                </p>
                                            </div>
                                            <div className="p-3 rounded-lg bg-muted/50">
                                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                                    <Briefcase className="h-4 w-4" />
                                                    <span className="text-xs">Vị trí</span>
                                                </div>
                                                <p className="text-2xl font-bold">
                                                    {department.positionCount}
                                                </p>
                                            </div>
                                        </div>

                                        <Separator />

                                        {/* Description */}
                                        {department.description && (
                                            <div className="space-y-2">
                                                <h4 className="text-sm font-medium">Mô tả</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    {department.description}
                                                </p>
                                            </div>
                                        )}

                                        <Separator />

                                        {/* Timestamps */}
                                        <div className="space-y-2 text-sm">
                                            <p className="text-muted-foreground">
                                                <Calendar className="h-4 w-4 inline mr-2" />
                                                Ngày tạo: {formatDate(new Date())}
                                            </p>
                                        </div>
                                    </div>
                                </ScrollArea>
                            </TabsContent>

                            <TabsContent value="employees" className="mt-4">
                                <div className="mb-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                        onClick={() => setAssignDialogOpen(true)}
                                    >
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Phân công nhân viên
                                    </Button>
                                </div>
                                <ScrollArea className="h-[calc(100vh-280px)]">
                                    {isLoadingEmployees ? (
                                        <div className="flex items-center justify-center h-20">
                                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : employeesData?.employees.length ? (
                                        <div className="space-y-2">
                                            {employeesData.employees.map((employee) => (
                                                <div
                                                    key={employee.id}
                                                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                                                >
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarImage src={employee.image || undefined} />
                                                        <AvatarFallback>
                                                            {employee.name.charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium truncate">
                                                            {employee.name}
                                                        </p>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            <span>{employee.employeeCode}</span>
                                                            {employee.position && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span>{employee.position}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-center text-muted-foreground py-8">
                                            Chưa có nhân viên trong phòng ban này
                                        </p>
                                    )}
                                </ScrollArea>
                            </TabsContent>
                        </Tabs>
                    ) : (
                        <div className="flex items-center justify-center h-40">
                            <p className="text-muted-foreground">Không tìm thấy phòng ban</p>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            {/* Employee Assign Dialog */}
            <EmployeeAssignDialog
                open={assignDialogOpen}
                onOpenChange={setAssignDialogOpen}
                department={department || null}
                onAssigned={handleAssigned}
            />
        </>
    );
}
