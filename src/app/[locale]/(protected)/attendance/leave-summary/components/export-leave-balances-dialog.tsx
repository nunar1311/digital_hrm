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
import { useTranslations } from "next-intl";
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
    labelKey: string;
    groupKey: string;
    defaultChecked: boolean;
}

const EXPORT_FIELDS: ExportField[] = [
    {
        key: "employeeCode",
        labelKey: "attendanceLeaveExportFieldEmployeeCode",
        groupKey: "attendanceLeaveExportGroupEmployeeInfo",
        defaultChecked: true,
    },
    {
        key: "fullName",
        labelKey: "attendanceLeaveExportFieldFullName",
        groupKey: "attendanceLeaveExportGroupEmployeeInfo",
        defaultChecked: true,
    },
    {
        key: "email",
        labelKey: "attendanceLeaveExportFieldEmail",
        groupKey: "attendanceLeaveExportGroupEmployeeInfo",
        defaultChecked: true,
    },
    {
        key: "departmentName",
        labelKey: "attendanceLeaveExportFieldDepartmentName",
        groupKey: "attendanceLeaveExportGroupEmployeeInfo",
        defaultChecked: true,
    },
    {
        key: "positionName",
        labelKey: "attendanceLeaveExportFieldPositionName",
        groupKey: "attendanceLeaveExportGroupEmployeeInfo",
        defaultChecked: false,
    },

    {
        key: "leaveTypeName",
        labelKey: "attendanceLeaveExportFieldLeaveTypeName",
        groupKey: "attendanceLeaveExportGroupLeaveBalance",
        defaultChecked: true,
    },
    {
        key: "totalDays",
        labelKey: "attendanceLeaveExportFieldTotalDays",
        groupKey: "attendanceLeaveExportGroupLeaveBalance",
        defaultChecked: true,
    },
    {
        key: "usedDays",
        labelKey: "attendanceLeaveExportFieldUsedDays",
        groupKey: "attendanceLeaveExportGroupLeaveBalance",
        defaultChecked: true,
    },
    {
        key: "pendingDays",
        labelKey: "attendanceLeaveExportFieldPendingDays",
        groupKey: "attendanceLeaveExportGroupLeaveBalance",
        defaultChecked: true,
    },

    {
        key: "availableDays",
        labelKey: "attendanceLeaveExportFieldAvailableDays",
        groupKey: "attendanceLeaveExportGroupLeaveBalance",
        defaultChecked: true,
    },
];

async function exportToExcel(
    balances: Record<string, unknown>[],
    selectedFields: string[],
    year: number,
    displayLabels: Record<string, string>,
    sheetName: string,
    fileNamePrefix: string,
) {
    const XLSX = await import("xlsx");

    const localizedData = balances.map((balance: Record<string, unknown>) => {
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

    const worksheet = XLSX.utils.json_to_sheet(localizedData);

    // Auto column widths
    const colWidths: { wch: number }[] = [];
    const headers = Object.keys(localizedData[0] || {});
    for (const header of headers) {
        const maxLen = Math.max(
            header.length,
            ...localizedData.map((r) => String(r[header] ?? "").length),
        );
        colWidths.push({ wch: Math.min(maxLen + 2, 40) });
    }
    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${sheetName} ${year}`);

    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(
        now.getMonth() + 1,
    ).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    XLSX.writeFile(workbook, `${fileNamePrefix}-${year}-${dateStr}.xlsx`);
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
    const t = useTranslations("ProtectedPages");
    const [isExporting, setIsExporting] = useState(false);
    const [selectedFields, setSelectedFields] = useState<string[]>(
        EXPORT_FIELDS.filter((f) => f.defaultChecked).map((f) => f.key),
    );

    const groupedFields = useCallback(() => {
        const groups: Record<string, ExportField[]> = {};
        for (const field of EXPORT_FIELDS) {
            if (!groups[field.groupKey]) groups[field.groupKey] = [];
            groups[field.groupKey].push(field);
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
                (f) => f.groupKey === group,
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
                (f) => f.groupKey === group,
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
                (f) => f.groupKey === group,
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
            toast.error(t("attendanceLeaveExportSelectAtLeastOneField"));
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
                toast.warning(t("attendanceLeaveExportNoDataMatchingFilters"));
                return;
            }

            const exportDisplayLabels: Record<string, string> = {
                employeeCode: t("attendanceLeaveExportHeaderEmployeeCode"),
                fullName: t("attendanceLeaveExportHeaderFullName"),
                email: t("attendanceLeaveExportHeaderEmail"),
                departmentName: t("attendanceLeaveExportHeaderDepartmentName"),
                positionName: t("attendanceLeaveExportHeaderPositionName"),
                leaveTypeName: t("attendanceLeaveExportHeaderLeaveTypeName"),
                totalDays: t("attendanceLeaveExportHeaderTotalDays"),
                usedDays: t("attendanceLeaveExportHeaderUsedDays"),
                pendingDays: t("attendanceLeaveExportHeaderPendingDays"),
                availableDays: t("attendanceLeaveExportHeaderAvailableDays"),
            };

            await exportToExcel(
                balances as unknown as Record<string, unknown>[],
                selectedFields,
                year,
                exportDisplayLabels,
                t("attendanceLeaveExportSheetName"),
                t("attendanceLeaveExportFileNamePrefix"),
            );
            toast.success(
                t("attendanceLeaveExportSuccess", { count: balances.length }),
            );
            onOpenChange(false);
        } catch (err) {
            console.error("Export error:", err);
            toast.error(t("attendanceLeaveExportError"));
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
                        {t("attendanceLeaveExportDialogTitle")}
                    </DialogTitle>
                    <DialogDescription>
                        {t("attendanceLeaveExportDialogDescription", { year })}
                    </DialogDescription>
                </DialogHeader>

                {/* Info */}
                <div className="flex items-center gap-2 px-1 py-2 rounded-md bg-muted/50 text-sm">
                    <Info className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">
                        {t("attendanceLeaveExportInfo")}
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
                                            {t(group)}
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
                                                    {t(field.labelKey)}
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
                        {t("attendanceLeaveExportSelectedCount", {
                            selected: selectedFields.length,
                            total: EXPORT_FIELDS.length,
                        })}
                    </span>
                    {selectedFields.length === 0 && (
                        <span className="text-xs text-destructive">
                            {t("attendanceLeaveExportNeedOneField")}
                        </span>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isExporting}
                    >
                        {t("attendanceLeaveExportCancel")}
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
                                {t("attendanceLeaveExportExporting")}
                            </>
                        ) : (
                            <>
                                <Download className="h-4 w-4 mr-2" />
                                {t("attendanceLeaveExportExportExcel")}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
