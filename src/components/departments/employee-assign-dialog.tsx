"use client";

import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { DepartmentListItem } from "@/app/(protected)/departments/types";

interface Employee {
    id: string;
    name: string;
    username: string | null;
    position: string | null;
    image: string | null;
    departmentName: string | null;
    departmentId: string | null;
}

interface EmployeeAssignDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    department: DepartmentListItem | null;
    onAssigned?: () => void;
}

// Server action to get employees that can be assigned
async function getAssignableEmployees(search?: string): Promise<Employee[]> {
    const response = await fetch(
        `/api/employees/assignable${search ? `?search=${encodeURIComponent(search)}` : ""}`
    );
    if (!response.ok) throw new Error("Failed to fetch employees");
    return response.json();
}

// Server action to assign employees to department
async function assignEmployeesToDepartment(
    employeeIds: string[],
    departmentId: string
): Promise<{ success: boolean; message: string }> {
    const response = await fetch("/api/employees/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeIds, departmentId }),
    });
    return response.json();
}

export function EmployeeAssignDialog({
    open,
    onOpenChange,
    department,
    onAssigned,
}: EmployeeAssignDialogProps) {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Fetch assignable employees
    const { data: employees = [], isLoading } = useQuery<Employee[]>({
        queryKey: ["assignableEmployees", search],
        queryFn: () => getAssignableEmployees(search),
        enabled: open,
    });

    // Filter employees that are not already in this department
    const filteredEmployees = useMemo(() => {
        return employees.filter((emp) => emp.departmentId !== department?.id);
    }, [employees, department?.id]);

    // Group by current department
    const groupedEmployees = useMemo(() => {
        const grouped: Record<string, Employee[]> = {};
        const noDept: Employee[] = [];

        filteredEmployees.forEach((emp) => {
            if (!emp.departmentId) {
                noDept.push(emp);
            } else if (!grouped[emp.departmentId]) {
                grouped[emp.departmentId] = [emp];
            } else {
                grouped[emp.departmentId].push(emp);
            }
        });

        return { noDept: noDept, grouped };
    }, [filteredEmployees]);

    const handleToggleEmployee = (id: string) => {
        setSelectedIds((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleSelectAll = () => {
        if (selectedIds.size === filteredEmployees.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredEmployees.map((e) => e.id)));
        }
    };

    const assignMutation = useMutation({
        mutationFn: () => assignEmployeesToDepartment(
            Array.from(selectedIds),
            department!.id
        ),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ["departments"] });
            await queryClient.cancelQueries({ queryKey: ["departmentTree"] });
            await queryClient.cancelQueries({ queryKey: ["departmentEmployees"] });
            await queryClient.cancelQueries({ queryKey: ["assignableEmployees"] });
            onOpenChange(false);
            return {};
        },
        onSuccess: (result) => {
            if (result.success) {
                toast.success(result.message);
                onAssigned?.();
                setSelectedIds(new Set());
            } else {
                toast.error(result.message);
                queryClient.invalidateQueries({ queryKey: ["departments"] });
                queryClient.invalidateQueries({ queryKey: ["departmentTree"] });
                queryClient.invalidateQueries({ queryKey: ["departmentEmployees"] });
                queryClient.invalidateQueries({ queryKey: ["assignableEmployees"] });
            }
        },
        onError: () => {
            toast.error("Có lỗi xảy ra khi phân công");
            queryClient.invalidateQueries({ queryKey: ["departments"] });
            queryClient.invalidateQueries({ queryKey: ["departmentTree"] });
            queryClient.invalidateQueries({ queryKey: ["departmentEmployees"] });
            queryClient.invalidateQueries({ queryKey: ["assignableEmployees"] });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["departments"] });
            queryClient.invalidateQueries({ queryKey: ["departmentTree"] });
            queryClient.invalidateQueries({ queryKey: ["departmentEmployees"] });
            queryClient.invalidateQueries({ queryKey: ["assignableEmployees"] });
        }
    });

    const handleClose = (isOpen: boolean) => {
        if (!isOpen && !assignMutation.isPending) {
            setSearch("");
            setSelectedIds(new Set());
        }
        onOpenChange(isOpen);
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .slice(-1)
            .map((w) => w[0])
            .join("")
            .toUpperCase();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Phân công nhân viên</DialogTitle>
                    <DialogDescription>
                        Chọn nhân viên để phân công vào phòng ban &quot;{department?.name}&quot;
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Tìm kiếm nhân viên..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    {/* Selection summary */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="selectAll"
                                checked={selectedIds.size === filteredEmployees.length && filteredEmployees.length > 0}
                                onCheckedChange={handleSelectAll}
                            />
                            <label
                                htmlFor="selectAll"
                                className="text-sm cursor-pointer"
                            >
                                Chọn tất cả ({filteredEmployees.length})
                            </label>
                        </div>
                        <Badge variant="secondary">
                            {selectedIds.size} đã chọn
                        </Badge>
                    </div>

                    {/* Employee list */}
                    <ScrollArea className="h-[300px] pr-4">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredEmployees.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                <Users className="h-10 w-10 mb-2 opacity-50" />
                                <p className="text-sm">Không có nhân viên nào</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {/* No department group */}
                                {groupedEmployees.noDept.length > 0 && (
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-2">
                                            Chưa có phòng ban ({groupedEmployees.noDept.length})
                                        </p>
                                        <div className="space-y-1">
                                            {groupedEmployees.noDept.map((emp) => (
                                                <EmployeeCheckboxItem
                                                    key={emp.id}
                                                    employee={emp}
                                                    checked={selectedIds.has(emp.id)}
                                                    onChange={() => handleToggleEmployee(emp.id)}
                                                    getInitials={getInitials}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Grouped by department */}
                                {Object.entries(groupedEmployees.grouped).map(
                                    ([deptId, emps]) => (
                                        <div key={deptId}>
                                            <p className="text-xs font-medium text-muted-foreground mb-2">
                                                {emps[0]?.departmentName} ({emps.length})
                                            </p>
                                            <div className="space-y-1">
                                                {emps.map((emp) => (
                                                    <EmployeeCheckboxItem
                                                        key={emp.id}
                                                        employee={emp}
                                                        checked={selectedIds.has(emp.id)}
                                                        onChange={() => handleToggleEmployee(emp.id)}
                                                        getInitials={getInitials}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        )}
                    </ScrollArea>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={assignMutation.isPending}
                    >
                        Hủy
                    </Button>
                    <Button
                        onClick={() => assignMutation.mutate()}
                        disabled={selectedIds.size === 0 || assignMutation.isPending}
                    >
                        {assignMutation.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Đang xử lý...
                            </>
                        ) : (
                            <>
                                <Check className="mr-2 h-4 w-4" />
                                Phân công ({selectedIds.size})
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function EmployeeCheckboxItem({
    employee,
    checked,
    onChange,
    getInitials,
}: {
    employee: Employee;
    checked: boolean;
    onChange: () => void;
    getInitials: (name: string) => string;
}) {
    return (
        <div
            className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${
                checked
                    ? "bg-primary/10 border-primary"
                    : "hover:bg-muted"
            }`}
            onClick={onChange}
        >
            <Checkbox checked={checked} />
            <Avatar className="h-8 w-8">
                <AvatarImage src={employee.image ?? undefined} />
                <AvatarFallback className="text-xs bg-muted">
                    {getInitials(employee.name)}
                </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{employee.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {employee.username && (
                        <span className="font-mono">{employee.username}</span>
                    )}
                    {employee.position && (
                        <>
                            {employee.username && <span>•</span>}
                            <span>{employee.position}</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
