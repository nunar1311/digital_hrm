// =============================================================================
// ExportLeaveBalancesDialog — Dialog xuất số dư ngày nghỉ ra Excel
// =============================================================================

"use client";

import { useState, useCallback } from "react";
import {
    Download,
    Loader2,
    FileSpreadsheet,
    Info,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { exportLeaveBalances } from "../actions";

interface ExportLeaveBalancesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    year: number;
    leaveTypeId?: string;
    departmentId?: string;
    employeeStatus?: string;
    search?: string;
}

interface ExportField {
    key: string;
    label: string;
    group: string;
    defaultChecked: boolean;
}

const EXPORT_FIELDS: ExportField[] = [
    // Thông tin nhân viên
    {
        key: "employeeCode",
        label: "Mã nhân viên",
        group: "Thông tin nhân viên",
        defaultChecked: true,
    },
    {
        key: "fullName",
        label: "Họ và tên",
        group: "Thông tin nhân viên",
        defaultChecked: true,
    },
    {
        key: "email",
        label: "Email",
        group: "Thông tin nhân viên",
        defaultChecked: true,
    },
    {
        key: "departmentName",
        label: "Phòng ban",
        group: "Thông tin nhân viên",
        defaultChecked: true,
    },
    {
        key: "positionName",
        label: "Chức vụ",
        group: "Thông tin nhân viên",
        defaultChecked: false,
    },

    // Thông tin ngày nghỉ
    {
        key: "leaveTypeName",
        label: "Loại ngày nghỉ",
        group: "Số dư ngày nghỉ",
        defaultChecked: true,
    },
    {
        key: "totalDays",
        label: "Tổng ngày",
        group: "Số dư ngày nghỉ",
        defaultChecked: true,
    },
    {
        key: "usedDays",
        label: "Đã dùng",
        group: "Số dư ngày nghỉ",
        defaultChecked: true,
    },
    {
        key: "pendingDays",
        label: "Đang chờ",
        group: "Số dư ngày nghỉ",
        defaultChecked: true,
    },

    {
        key: "availableDays",
        label: "Còn lại",
        group: "Số dư ngày nghỉ",
        defaultChecked: true,
    },
];

async function exportToExcel(
    balances: Record<string, unknown>[],
    selectedFields: string[],
    year: number,
) {
    const XLSX = await import("xlsx");

    const displayLabels: Record<string, string> = {
        employeeCode: "Mã NV",
        fullName: "Họ và tên",
        email: "Email",
        departmentName: "Phòng ban",
        positionName: "Chức vụ",
        leaveTypeName: "Loại ngày nghỉ",
        totalDays: "Tổng ngày",
        usedDays: "Đã dùng",
        pendingDays: "Đang chờ",
        availableDays: "Còn lại",
    };

    const vietnameseData = balances.map((balance: Record<string, unknown>) => {
        const row: Record<string, unknown> = {};

        for (const field of selectedFields) {
            let value: unknown;

            if (field === "fullName") {
                const user = balance.user as Record<string, unknown> | undefined;
                value = user?.fullName || user?.name || "";
            } else if (field === "employeeCode") {
                const user = balance.user as Record<string, unknown> | undefined;
                value = user?.employeeCode || "";
            } else if (field === "email") {
                const user = balance.user as Record<string, unknown> | undefined;
                value = user?.email || "";
            } else if (field === "departmentName") {
                const user = balance.user as Record<string, unknown> | undefined;
                const dept = user?.department as Record<string, unknown> | undefined;
                value = dept?.name || "";
            } else if (field === "positionName") {
                const user = balance.user as Record<string, unknown> | undefined;
                const pos = user?.position as Record<string, unknown> | undefined;
                value = pos?.name || "";
            } else if (field === "leaveTypeName") {
                const lt = balance.leaveType as Record<string, unknown> | undefined;
                value = lt?.name || "";
            } else if (field === "availableDays") {
                const total = (balance.totalDays as number) || 0;
                const used = (balance.usedDays as number) || 0;
                const pending = (balance.pendingDays as number) || 0;
                value = total - used - pending;
            } else {
                value = balance[field];
            }

            if (value === null || value === undefined) {
                value = "";
            }

            row[displayLabels[field] || field] = value;
        }

        return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(vietnameseData);

    // Auto column widths
    const colWidths: { wch: number }[] = [];
    const headers = Object.keys(vietnameseData[0] || {});
    for (const header of headers) {
        const maxLen = Math.max(
            header.length,
            ...vietnameseData.map((r) => String(r[header] ?? "").length),
        );
        colWidths.push({ wch: Math.min(maxLen + 2, 40) });
    }
    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        `Số dư ngày nghỉ ${year}`,
    );

    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(
        now.getMonth() + 1,
    ).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    XLSX.writeFile(workbook, `so-du-ngay-nghi-${year}-${dateStr}.xlsx`);
}

export function ExportLeaveBalancesDialog({
    open,
    onOpenChange,
    year,
    leaveTypeId,
    departmentId,
    employeeStatus,
    search,
}: ExportLeaveBalancesDialogProps) {
    const [isExporting, setIsExporting] = useState(false);
    const [selectedFields, setSelectedFields] = useState<string[]>(
        EXPORT_FIELDS.filter((f) => f.defaultChecked).map((f) => f.key),
    );

    const groupedFields = useCallback(() => {
        const groups: Record<string, ExportField[]> = {};
        for (const field of EXPORT_FIELDS) {
            if (!groups[field.group]) groups[field.group] = [];
            groups[field.group].push(field);
        }
        return groups;
    }, []);

    const handleToggleField = useCallback((key: string) => {
        setSelectedFields((prev) =>
            prev.includes(key)
                ? prev.filter((f) => f !== key)
                : [...prev, key],
        );
    }, []);

    const handleToggleGroup = useCallback(
        (group: string, checked: boolean) => {
            const groupKeys = EXPORT_FIELDS.filter(
                (f) => f.group === group,
            ).map((f) => f.key);
            setSelectedFields((prev) => {
                if (checked) {
                    return [...new Set([...prev, ...groupKeys])];
                }
                return prev.filter((f) => !groupKeys.includes(f));
            });
        },
        [],
    );

    const isGroupAllChecked = useCallback(
        (group: string) => {
            const groupKeys = EXPORT_FIELDS.filter(
                (f) => f.group === group,
            ).map((f) => f.key);
            return groupKeys.every((k) => selectedFields.includes(k));
        },
        [selectedFields],
    );

    // Track partial selection state for checkbox indeterminate display
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const isGroupSomeChecked = useCallback(
        (group: string) => {
            const groupKeys = EXPORT_FIELDS.filter(
                (f) => f.group === group,
            ).map((f) => f.key);
            const checkedCount = groupKeys.filter((k) =>
                selectedFields.includes(k),
            ).length;
            return checkedCount > 0 && checkedCount < groupKeys.length;
        },
        [selectedFields],
    );

    const handleExport = async () => {
        if (selectedFields.length === 0) {
            toast.error("Vui lòng chọn ít nhất một trường để xuất");
            return;
        }

        setIsExporting(true);
        try {
            const balances = await exportLeaveBalances({
                year,
                leaveTypeId: leaveTypeId === "all" ? undefined : leaveTypeId,
                departmentId: departmentId === "all" ? undefined : departmentId,
                employeeStatus: employeeStatus === "all" ? undefined : employeeStatus,
                search: search || undefined,
            });

            if (!balances || balances.length === 0) {
                toast.warning(
                    "Không có số dư ngày nghỉ nào phù hợp với điều kiện lọc",
                );
                return;
            }

            await exportToExcel(balances as unknown as Record<string, unknown>[], selectedFields, year);
            toast.success(
                `Đã xuất thành công ${balances.length} bản ghi ra file Excel`,
            );
            onOpenChange(false);
        } catch (err) {
            console.error("Export error:", err);
            toast.error("Lỗi khi xuất file. Vui lòng thử lại.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg h-[70vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-primary" />
                        Xuất số dư ngày nghỉ
                    </DialogTitle>
                    <DialogDescription>
                        Chọn các trường cần xuất và tải về file Excel cho năm{" "}
                        <strong>{year}</strong>.
                    </DialogDescription>
                </DialogHeader>

                {/* Info */}
                <div className="flex items-center gap-2 px-1 py-2 rounded-md bg-muted/50 text-sm">
                    <Info className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">
                        File sẽ chứa toàn bộ số dư ngày nghỉ phù hợp với
                        điều kiện lọc hiện tại.
                    </span>
                </div>

                {/* Field selection */}
                <ScrollArea className="flex-1 min-h-0">
                    <div className="space-y-4">
                        {Object.entries(groupedFields()).map(
                            ([group, fields]) => (
                                <div key={group}>
                                    {/* Group header */}
                                    <div className="flex items-center gap-2 mb-2">
                                        <Checkbox
                                            id={`group-${group}`}
                                            checked={isGroupAllChecked(group)}
                                            onCheckedChange={(checked) =>
                                                handleToggleGroup(
                                                    group,
                                                    !!checked,
                                                )
                                            }
                                            className="data-[state=indeterminate]:bg-primary data-[state=indeterminate]:border-primary"
                                        />
                                        <Label
                                            htmlFor={`group-${group}`}
                                            className="text-sm font-semibold cursor-pointer select-none"
                                        >
                                            {group}
                                        </Label>
                                    </div>

                                    {/* Group fields */}
                                    <div className="grid grid-cols-2 gap-1.5 ml-6">
                                        {fields.map((field) => (
                                            <div
                                                key={field.key}
                                                className="flex items-center gap-2"
                                            >
                                                <Checkbox
                                                    id={`field-${field.key}`}
                                                    checked={selectedFields.includes(
                                                        field.key,
                                                    )}
                                                    onCheckedChange={() =>
                                                        handleToggleField(
                                                            field.key,
                                                        )
                                                    }
                                                />
                                                <Label
                                                    htmlFor={`field-${field.key}`}
                                                    className="text-sm cursor-pointer select-none text-muted-foreground"
                                                >
                                                    {field.label}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ),
                        )}
                    </div>
                </ScrollArea>

                {/* Selected count */}
                <div className="flex items-center justify-between px-1 py-2 border-t">
                    <span className="text-xs text-muted-foreground">
                        Đã chọn{" "}
                        <strong className="text-foreground">
                            {selectedFields.length}
                        </strong>{" "}
                        / {EXPORT_FIELDS.length} trường
                    </span>
                    {selectedFields.length === 0 && (
                        <span className="text-xs text-destructive">
                            Cần chọn ít nhất 1 trường
                        </span>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isExporting}
                    >
                        Hủy
                    </Button>
                    <Button
                        onClick={handleExport}
                        disabled={
                            isExporting || selectedFields.length === 0
                        }
                    >
                        {isExporting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Đang xuất...
                            </>
                        ) : (
                            <>
                                <Download className="h-4 w-4 mr-2" />
                                Xuất Excel
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
