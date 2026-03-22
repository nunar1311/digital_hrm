"use client";

import {
    useState,
    useCallback,
    useMemo,
    useEffect,
    useRef,
} from "react";
import {
    useQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import {
    Search,
    Loader2,
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    UserCircle,
    ShieldCheck,
    Building2,
    CheckCircle2,
    Users,
    X,
    Check,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
    getAssignableEmployees,
    updateEmployeesDepartment,
} from "@/app/(protected)/employees/actions";

type AssignableEmployee = Awaited<
    ReturnType<typeof getAssignableEmployees>
>[number];

interface AddEmployeesToDepartmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    departmentId: string;
    departmentName: string;
    onAssigned?: () => void;
}

export function AddEmployeesToDepartmentDialog({
    open,
    onOpenChange,
    departmentId,
    departmentName,
    onAssigned,
}: AddEmployeesToDepartmentDialogProps) {
    const queryClient = useQueryClient();

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(
        new Set(),
    );
    const searchTimerRef = useRef<ReturnType<
        typeof setTimeout
    > | null>(null);

    // Debounce search 300ms
    const handleSearchChange = useCallback((value: string) => {
        setSearch(value);
        if (searchTimerRef.current) {
            clearTimeout(searchTimerRef.current);
        }
        searchTimerRef.current = setTimeout(() => {
            setDebouncedSearch(value);
        }, 300);
    }, []);

    // Cleanup timer on unmount only
    useEffect(() => {
        return () => {
            if (searchTimerRef.current) {
                clearTimeout(searchTimerRef.current);
            }
        };
    }, []);

    const { data: employees = [], isLoading } = useQuery({
        queryKey: ["assignable-employees", debouncedSearch],
        queryFn: () =>
            getAssignableEmployees(debouncedSearch || undefined),
    });

    const assignMutation = useMutation({
        mutationFn: () => {
            return updateEmployeesDepartment(
                Array.from(selectedIds),
                departmentId,
            );
        },
        onSuccess: (count) => {
            toast.success(
                `Đã gán ${count} nhân viên vào phòng ban "${departmentName}"`,
            );
            queryClient.invalidateQueries({
                queryKey: ["assignable-employees"],
            });
            onAssigned?.();
            onOpenChange(false);
        },
        onError: () => {
            toast.error("Có lỗi xảy ra khi gán nhân viên");
        },
    });

    const selectedEmployees = useMemo(
        () => employees.filter((e) => selectedIds.has(e.id)),
        [employees, selectedIds],
    );

    const toggleOne = useCallback((id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const toggleAll = useCallback(() => {
        if (selectedIds.size === employees.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(employees.map((e) => e.id)));
        }
    }, [selectedIds.size, employees]);

    const handleClose = useCallback(
        (isOpen: boolean) => {
            if (!assignMutation.isPending) {
                if (!isOpen) {
                    setSearch("");
                    setDebouncedSearch("");
                    setSelectedIds(new Set());
                }
                onOpenChange(isOpen);
            }
        },
        [assignMutation.isPending, onOpenChange],
    );

    const handleAssign = useCallback(() => {
        if (selectedIds.size === 0) return;
        assignMutation.mutate();
    }, [selectedIds, assignMutation]);

    const getGenderLabel = (gender: string | null | undefined) => {
        if (!gender) return "---";
        const map: Record<string, string> = {
            MALE: "Nam",
            FEMALE: "Nữ",
            OTHER: "Khác",
        };
        return map[gender] || gender;
    };

    const getStatusLabel = (status: string | null | undefined) => {
        if (!status) return "---";
        const map: Record<string, string> = {
            ACTIVE: "Đang làm việc",
            ON_LEAVE: "Nghỉ phép",
            RESIGNED: "Đã nghỉ việc",
            TERMINATED: "Sa thải",
            PROBATION: "Thử việc",
        };
        return map[status] || status;
    };

    const getEmploymentTypeLabel = (
        type: string | null | undefined,
    ) => {
        if (!type) return "---";
        const map: Record<string, string> = {
            FULL_TIME: "Toàn thời gian",
            PART_TIME: "Bán thời gian",
            CONTRACT: "Hợp đồng",
            INTERN: "Thực tập",
            FREELANCE: "Freelance",
        };
        return map[type] || type;
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[900px] h-[80vh] flex flex-col p-0 gap-0">
                <DialogHeader className="px-2 py-4 shrink-0 border-b">
                    <DialogTitle>
                        Gán nhân viên vào {departmentName}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-1 min-h-0 overflow-hidden">
                    {/* Left Column - Employee List */}
                    <div className="w-[380px] shrink-0 border-r flex flex-col">
                        {/* Search */}
                        <div className="px-3 py-2.5 border-b shrink-0">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(e) =>
                                        handleSearchChange(
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Tìm kiếm nhân viên..."
                                    className="pl-8 h-8 text-xs"
                                />
                            </div>
                        </div>

                        {/* Select All + Count */}
                        <div className="px-3 py-2 border-b shrink-0 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    checked={
                                        employees.length > 0 &&
                                        selectedIds.size ===
                                            employees.length
                                            ? true
                                            : selectedIds.size > 0
                                              ? "indeterminate"
                                              : false
                                    }
                                    onCheckedChange={toggleAll}
                                    aria-label="Chọn tất cả"
                                />
                                <span className="text-xs font-medium">
                                    Chọn tất cả
                                </span>
                            </div>
                            <Badge
                                variant="secondary"
                                className="text-xs font-semibold"
                            >
                                {employees.length}
                            </Badge>
                        </div>

                        {/* Employee List */}
                        <ScrollArea className="flex-1 min-h-0">
                            <div className="p-2 space-y-1">
                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center py-12 gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">
                                            Đang tải...
                                        </span>
                                    </div>
                                ) : employees.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 gap-2">
                                        <User className="h-8 w-8 text-muted-foreground/40" />
                                        <p className="text-xs text-muted-foreground">
                                            Không có nhân viên nào
                                        </p>
                                        {search && (
                                            <p className="text-xs text-muted-foreground/60">
                                                Thử từ khóa khác
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    employees.map((emp) => {
                                        const isSelected =
                                            selectedIds.has(emp.id);
                                        const displayName =
                                            emp.fullName || emp.name;

                                        return (
                                            <div
                                                key={emp.id}
                                                onClick={() =>
                                                    toggleOne(emp.id)
                                                }
                                                className={cn(
                                                    "w-full flex items-center cursor-pointer gap-2.5 px-2 py-2 rounded-md text-left transition-all",
                                                    isSelected
                                                        ? "bg-primary/10 border border-primary/30"
                                                        : "hover:bg-muted/60 border border-transparent",
                                                )}
                                            >
                                                <Checkbox
                                                    checked={
                                                        isSelected
                                                    }
                                                    onCheckedChange={() =>
                                                        toggleOne(
                                                            emp.id,
                                                        )
                                                    }
                                                    className="mt-0.5"
                                                    aria-label={`Chọn ${displayName}`}
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                />
                                                <div className="h-9 w-9 rounded-full bg-primary/10 shrink-0 items-center justify-center text-primary font-semibold text-sm flex">
                                                    {displayName
                                                        .split(" ")
                                                        .pop()?.[0] ||
                                                        "?"}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-sm font-semibold truncate">
                                                            {
                                                                displayName
                                                            }
                                                        </span>
                                                        {isSelected && (
                                                            <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                        <span className="font-medium">
                                                            {emp.employeeCode ||
                                                                "---"}
                                                        </span>
                                                        <span>·</span>
                                                        <span className="truncate">
                                                            {(emp.position as { name?: string } | null)?.name ||
                                                                "Chưa rõ"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Right Column - Employee Detail */}
                    <div className="flex-1 min-w-0 flex flex-col">
                        {selectedIds.size === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground/60">
                                <UserCircle className="h-12 w-12" />
                                <p className="text-sm font-medium">
                                    Chưa có nhân viên nào được chọn
                                </p>
                                <p className="text-xs">
                                    Chọn nhân viên từ danh sách bên
                                    trái
                                </p>
                            </div>
                        ) : selectedIds.size === 1 &&
                          selectedEmployees.length === 1 ? (
                            <EmployeeDetail
                                employee={selectedEmployees[0]}
                                departmentName={departmentName}
                                getGenderLabel={getGenderLabel}
                                getStatusLabel={getStatusLabel}
                                getEmploymentTypeLabel={
                                    getEmploymentTypeLabel
                                }
                            />
                        ) : (
                            <MultipleEmployeesList
                                selectedEmployees={selectedEmployees}
                                departmentName={departmentName}
                                onRemove={toggleOne}
                            />
                        )}
                    </div>
                </div>

                {/* Footer */}

                <DialogFooter className="flex items-center gap-2 border-t p-2">
                    <Button
                        variant="outline"
                        onClick={() => handleClose(false)}
                        disabled={assignMutation.isPending}
                    >
                        Hủy
                    </Button>
                    <Button
                        onClick={handleAssign}
                        disabled={
                            selectedIds.size === 0 ||
                            assignMutation.isPending
                        }
                    >
                        {assignMutation.isPending ? (
                            <>
                                <Loader2 className="animate-spin" />
                                Đang gán...
                            </>
                        ) : (
                            `Gán ${selectedIds.size > 0 ? selectedIds.size : ""} nhân viên`
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function EmployeeDetail({
    employee,
    departmentName,
    getGenderLabel,
    getStatusLabel,
    getEmploymentTypeLabel,
}: {
    employee: AssignableEmployee;
    departmentName: string;
    getGenderLabel: (g: string | null | undefined) => string;
    getStatusLabel: (s: string | null | undefined) => string;
    getEmploymentTypeLabel: (t: string | null | undefined) => string;
}) {
    const displayName = employee.fullName || employee.name;

    const fields: {
        label: string;
        value: string | null | undefined;
        icon: React.ElementType;
    }[] = [
        {
            label: "Mã nhân viên",
            value: employee.employeeCode,
            icon: ShieldCheck,
        },
        {
            label: "Email",
            value: employee.email,
            icon: Mail,
        },
        {
            label: "Số điện thoại",
            value: employee.phone,
            icon: Phone,
        },
        {
            label: "Ngày sinh",
            value: employee.dateOfBirth
                ? new Date(employee.dateOfBirth).toLocaleDateString(
                      "vi-VN",
                  )
                : undefined,
            icon: Calendar,
        },
        {
            label: "Giới tính",
            value: getGenderLabel(employee.gender),
            icon: User,
        },
        {
            label: "Số CCCD",
            value: employee.nationalId,
            icon: ShieldCheck,
        },
        {
            label: "Địa chỉ",
            value: employee.address,
            icon: MapPin,
        },
        {
            label: "Trạng thái",
            value: getStatusLabel(employee.employeeStatus),
            icon: CheckCircle2,
        },
        {
            label: "Loại hợp đồng",
            value: getEmploymentTypeLabel(employee.employmentType),
            icon: Building2,
        },
    ];

    return (
        <div className="flex-1 min-h-0 overflow-auto px-6 py-5">
            <div className="flex flex-col items-center gap-3 mb-5">
                <div className="h-16 w-16 rounded-full bg-primary/10 items-center justify-center text-primary font-bold text-2xl flex">
                    {displayName.split(" ").pop()?.[0] || "?"}
                </div>
                <div className="text-center">
                    <h3 className="text-base font-bold">
                        {displayName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {(employee.position as { name?: string } | null)?.name ||
                            "Chưa có chức vụ"}
                    </p>
                </div>
                <Badge variant="outline" className="text-xs">
                    <Building2 className="h-3 w-3 mr-1" />
                    {departmentName}
                </Badge>
            </div>

            <Separator className="mb-4" />

            <div className="space-y-2.5">
                {fields.map((field) => (
                    <div
                        key={field.label}
                        className="flex items-start gap-2.5"
                    >
                        <field.icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                            <span className="text-xs text-muted-foreground">
                                {field.label}
                            </span>
                            <p
                                className={cn(
                                    "text-sm font-medium",
                                    !field.value &&
                                        "text-muted-foreground/50",
                                )}
                            >
                                {field.value || "---"}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function MultipleEmployeesList({
    selectedEmployees,
    departmentName,
    onRemove,
}: {
    selectedEmployees: AssignableEmployee[];
    departmentName: string;
    onRemove: (id: string) => void;
}) {
    return (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="px-6 py-3 border-b shrink-0">
                <h4 className="text-sm font-semibold">
                    {selectedEmployees.length} nhân viên đã chọn
                </h4>
                <p className="text-xs text-muted-foreground">
                    Sẽ được gán vào{" "}
                    <strong className="text-foreground">
                        {departmentName}
                    </strong>
                </p>
            </div>
            <ScrollArea className="flex-1 min-h-0">
                <div className="p-4 space-y-2">
                    {selectedEmployees.map((emp) => {
                        const displayName = emp.fullName || emp.name;
                        return (
                            <div
                                key={emp.id}
                                className="flex items-center gap-3 p-2.5 rounded-md bg-muted/40 border"
                            >
                                <div className="h-8 w-8 rounded-full bg-primary/10 shrink-0 items-center justify-center text-primary font-semibold text-xs flex">
                                    {displayName
                                        .split(" ")
                                        .pop()?.[0] || "?"}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold truncate">
                                        {displayName}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {emp.employeeCode || "---"} ·{" "}
                                        {(emp.position as { name?: string } | null)?.name ||
                                            "Chưa rõ"}
                                    </p>
                                </div>
                                <Button
                                    size="icon-xs"
                                    variant="ghost"
                                    className="shrink-0 text-muted-foreground hover:text-destructive"
                                    onClick={() => onRemove(emp.id)}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
}
