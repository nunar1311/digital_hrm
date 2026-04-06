"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Building2,
    UserCircle,
    FolderTree,
    Users,
    Pencil,
    Trash2,
    MoreVertical,
    Search,
    ArrowLeft,
    ExternalLink,
    Users2,
    Briefcase,
    LayoutGrid,
} from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DepartmentStats } from "./department-stats";
import { EmployeeListItem } from "./employee-list-item";
import type { DepartmentNode } from "@/types/org-chart";

interface DepartmentDetailPageProps {
    department: DepartmentNode | null;
    allDepartments: DepartmentNode[];
}

export function DepartmentDetailPage({
    department,
    allDepartments,
}: DepartmentDetailPageProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");

    const filteredEmployees = useMemo(() => {
        if (!department?.employees || !employeeSearchQuery.trim()) {
            return department?.employees || [];
        }
        const query = employeeSearchQuery.toLowerCase();
        return department.employees.filter(
            (emp) =>
                emp.name.toLowerCase().includes(query) ||
                emp.employeeCode?.toLowerCase().includes(query) ||
                emp.position?.toLowerCase().includes(query),
        );
    }, [department?.employees, employeeSearchQuery]);

    const managerInitials = useMemo(
        () =>
            department?.manager?.name
                ?.split(" ")
                .slice(-2)
                .map((w) => w[0])
                .join("")
                .toUpperCase() ?? "?",
        [department?.manager?.name],
    );

    if (!department) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                <Building2 className="h-16 w-16 mb-4 opacity-30" />
                <p className="text-lg font-semibold">Không tìm thấy phòng ban</p>
                <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => router.push("/org-chart")}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Quay lại sơ đồ tổ chức
                </Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 px-4 max-w-5xl">
            {/* Header */}
            <div className="flex items-start justify-between mb-6 gap-4">
                <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-primary/10 p-3 mt-1">
                        <Building2 className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Badge
                                variant={
                                    department.status === "ACTIVE"
                                        ? "default"
                                        : "secondary"
                                }
                                className="text-xs"
                            >
                                {department.status === "ACTIVE"
                                    ? "Đang hoạt động"
                                    : "Ngừng hoạt động"}
                            </Badge>
                            {department.parentId && (
                                <span className="text-xs text-muted-foreground">
                                    Thuộc:{" "}
                                    {allDepartments.find(
                                        (d) => d.id === department.parentId,
                                    )?.name ?? "—"}
                                </span>
                            )}
                        </div>
                        <h1 className="text-2xl font-bold">{department.name}</h1>
                        <p className="text-sm text-muted-foreground font-mono">
                            {department.code}
                        </p>
                        {department.description && (
                            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                                {department.description}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={() =>
                                    router.push(`/org-chart?edit=${department.id}`)
                                }
                            >
                                <Pencil className="mr-2 h-4 w-4" />
                                Chỉnh sửa phòng ban
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() =>
                                    window.open(
                                        `/org-chart?highlight=${department.id}`,
                                        "_blank",
                                    )
                                }
                            >
                                <LayoutGrid className="mr-2 h-4 w-4" />
                                Xem trên sơ đồ
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => setShowDeleteDialog(true)}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Xóa phòng ban
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push("/org-chart")}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Quay lại
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <StatBox
                    icon={Users}
                    label="Nhân viên"
                    value={department.employeeCount}
                    color="text-blue-600"
                    bgColor="bg-blue-50 dark:bg-blue-950"
                />
                <StatBox
                    icon={UserCircle}
                    label="Vị trí"
                    value={department.positionCount}
                    color="text-purple-600"
                    bgColor="bg-purple-50 dark:bg-purple-950"
                />
                <StatBox
                    icon={FolderTree}
                    label="Phòng ban con"
                    value={department.children.length}
                    color="text-emerald-600"
                    bgColor="bg-emerald-50 dark:bg-emerald-950"
                />
                <StatBox
                    icon={Briefcase}
                    label="Trạng thái"
                    value={department.status === "ACTIVE" ? "Hoạt động" : "Ngừng"}
                    color="text-amber-600"
                    bgColor="bg-amber-50 dark:bg-amber-950"
                    isText
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Manager + Info */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Manager */}
                    <div className="rounded-xl border bg-card p-5">
                        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                            <UserCircle className="h-4 w-4 text-primary" />
                            Trưởng phòng
                        </h3>
                        {department.manager ? (
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                                <Avatar className="h-12 w-12 border-2 border-primary/20">
                                    <AvatarImage
                                        src={department.manager.image ?? undefined}
                                    />
                                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                                        {managerInitials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                    <p className="font-medium">
                                        {department.manager.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {department.manager.position ?? "—"}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 shrink-0"
                                    onClick={() =>
                                        router.push(
                                            `/employees/${department.manager?.id}`,
                                        )
                                    }
                                >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground italic p-3 rounded-lg bg-muted/50 border text-center">
                                Chưa phân công quản lý
                            </p>
                        )}
                    </div>

                    {/* Sub-departments */}
                    {department.children.length > 0 && (
                        <div className="rounded-xl border bg-card p-5">
                            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                <FolderTree className="h-4 w-4 text-primary" />
                                Phòng ban trực thuộc (
                                {department.children.length})
                            </h3>
                            <div className="space-y-2">
                                {department.children.map((child) => (
                                    <button
                                        key={child.id}
                                        className="w-full flex items-center gap-2 p-3 rounded-lg bg-muted/50 border text-sm text-left hover:bg-muted transition-colors group"
                                        onClick={() =>
                                            router.push(`/org-chart/${child.id}`)
                                        }
                                    >
                                        <span
                                            className={`h-2 w-2 rounded-full shrink-0 ${child.status === "ACTIVE" ? "bg-emerald-500" : "bg-gray-400"}`}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium truncate">
                                                {child.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground font-mono">
                                                {child.code}
                                            </p>
                                        </div>
                                        <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Employees */}
                <div className="lg:col-span-2">
                    <div className="rounded-xl border bg-card p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                                <Users2 className="h-4 w-4 text-primary" />
                                Nhân viên (
                                {department.employees?.length ?? 0})
                            </h3>
                            <div className="relative w-64">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    placeholder="Tìm nhân viên..."
                                    value={employeeSearchQuery}
                                    onChange={(e) =>
                                        setEmployeeSearchQuery(e.target.value)
                                    }
                                    className="pl-8 h-8 text-sm"
                                />
                            </div>
                        </div>

                        {filteredEmployees.length > 0 ? (
                            <div className="space-y-2">
                                {filteredEmployees.map((emp) => (
                                    <EmployeeListItem
                                        key={emp.id}
                                        employee={emp}
                                        showActions
                                        onViewProfile={(id) =>
                                            router.push(`/employees/${id}`)
                                        }
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <Users2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">
                                    {employeeSearchQuery
                                        ? "Không tìm thấy nhân viên"
                                        : "Chưa có nhân viên trong phòng ban này"}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Dialog */}
            <AlertDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xóa phòng ban</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa phòng ban &quot;
                            {department.name}&quot;? Thao tác này không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                setShowDeleteDialog(false);
                                router.push("/org-chart");
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Xác nhận xóa
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

interface StatBoxProps {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string | number;
    color: string;
    bgColor: string;
    isText?: boolean;
}

function StatBox({
    icon: Icon,
    label,
    value,
    color,
    bgColor,
    isText,
}: StatBoxProps) {
    return (
        <div className="flex items-center gap-3 p-3 rounded-xl border bg-card">
            <div className={`p-2 rounded-lg ${bgColor}`}>
                <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <div>
                {isText ? (
                    <p className="text-sm font-medium">{value}</p>
                ) : (
                    <p className="text-lg font-bold">
                        {typeof value === "number"
                            ? value.toLocaleString("vi-VN")
                            : value}
                    </p>
                )}
                <p className="text-xs text-muted-foreground">{label}</p>
            </div>
        </div>
    );
}
