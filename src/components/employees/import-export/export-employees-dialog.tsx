// =============================================================================
// ExportEmployeesDialog — Field selection dialog and Excel export for employee list
// =============================================================================

"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
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
import { exportEmployees } from "@/app/[locale]/(protected)/employees/actions";

interface ExportEmployeesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    search?: string;
    departmentId?: string;
    status?: string;
    employmentType?: string;
}

interface ExportField {
    key: string;
    labelKey: string;
    groupKey: string;
    defaultChecked: boolean;
}

type ExportDialogTranslator = ReturnType<typeof useTranslations>;

const EXPORT_FIELDS: ExportField[] = [
    {
        key: "employeeCode",
        labelKey: "employeesExportFieldEmployeeCode",
        groupKey: "employeesExportGroupBasicInfo",
        defaultChecked: true,
    },
    {
        key: "fullName",
        labelKey: "employeesExportFieldFullName",
        groupKey: "employeesExportGroupBasicInfo",
        defaultChecked: true,
    },
    {
        key: "gender",
        labelKey: "employeesExportFieldGender",
        groupKey: "employeesExportGroupBasicInfo",
        defaultChecked: true,
    },
    {
        key: "dateOfBirth",
        labelKey: "employeesExportFieldDateOfBirth",
        groupKey: "employeesExportGroupBasicInfo",
        defaultChecked: true,
    },
    {
        key: "nationalId",
        labelKey: "employeesExportFieldNationalId",
        groupKey: "employeesExportGroupBasicInfo",
        defaultChecked: false,
    },
    {
        key: "nationalIdDate",
        labelKey: "employeesExportFieldNationalIdDate",
        groupKey: "employeesExportGroupBasicInfo",
        defaultChecked: false,
    },
    {
        key: "nationalIdPlace",
        labelKey: "employeesExportFieldNationalIdPlace",
        groupKey: "employeesExportGroupBasicInfo",
        defaultChecked: false,
    },
    {
        key: "maritalStatus",
        labelKey: "employeesExportFieldMaritalStatus",
        groupKey: "employeesExportGroupBasicInfo",
        defaultChecked: false,
    },
    {
        key: "nationality",
        labelKey: "employeesExportFieldNationality",
        groupKey: "employeesExportGroupBasicInfo",
        defaultChecked: false,
    },
    {
        key: "ethnicity",
        labelKey: "employeesExportFieldEthnicity",
        groupKey: "employeesExportGroupBasicInfo",
        defaultChecked: false,
    },
    {
        key: "religion",
        labelKey: "employeesExportFieldReligion",
        groupKey: "employeesExportGroupBasicInfo",
        defaultChecked: false,
    },
    {
        key: "phone",
        labelKey: "employeesExportFieldPhone",
        groupKey: "employeesExportGroupContact",
        defaultChecked: true,
    },
    {
        key: "personalEmail",
        labelKey: "employeesExportFieldPersonalEmail",
        groupKey: "employeesExportGroupContact",
        defaultChecked: true,
    },
    {
        key: "email",
        labelKey: "employeesExportFieldCompanyEmail",
        groupKey: "employeesExportGroupContact",
        defaultChecked: false,
    },
    {
        key: "address",
        labelKey: "employeesExportFieldAddress",
        groupKey: "employeesExportGroupContact",
        defaultChecked: true,
    },
    {
        key: "departmentName",
        labelKey: "employeesExportFieldDepartment",
        groupKey: "employeesExportGroupWork",
        defaultChecked: true,
    },
    {
        key: "positionName",
        labelKey: "employeesExportFieldPosition",
        groupKey: "employeesExportGroupWork",
        defaultChecked: true,
    },
    {
        key: "employmentType",
        labelKey: "employeesExportFieldEmploymentType",
        groupKey: "employeesExportGroupWork",
        defaultChecked: true,
    },
    {
        key: "hireDate",
        labelKey: "employeesExportFieldHireDate",
        groupKey: "employeesExportGroupWork",
        defaultChecked: true,
    },
    {
        key: "employeeStatus",
        labelKey: "employeesExportFieldEmployeeStatus",
        groupKey: "employeesExportGroupWork",
        defaultChecked: true,
    },
    {
        key: "bankName",
        labelKey: "employeesExportFieldBankName",
        groupKey: "employeesExportGroupBank",
        defaultChecked: false,
    },
    {
        key: "bankAccount",
        labelKey: "employeesExportFieldBankAccount",
        groupKey: "employeesExportGroupBank",
        defaultChecked: false,
    },
    {
        key: "bankBranch",
        labelKey: "employeesExportFieldBankBranch",
        groupKey: "employeesExportGroupBank",
        defaultChecked: false,
    },
    {
        key: "socialInsuranceNo",
        labelKey: "employeesExportFieldSocialInsuranceNo",
        groupKey: "employeesExportGroupInsuranceTax",
        defaultChecked: false,
    },
    {
        key: "healthInsuranceNo",
        labelKey: "employeesExportFieldHealthInsuranceNo",
        groupKey: "employeesExportGroupInsuranceTax",
        defaultChecked: false,
    },
    {
        key: "taxCode",
        labelKey: "employeesExportFieldTaxCode",
        groupKey: "employeesExportGroupInsuranceTax",
        defaultChecked: false,
    },
    {
        key: "educationLevel",
        labelKey: "employeesExportFieldEducationLevel",
        groupKey: "employeesExportGroupEducation",
        defaultChecked: false,
    },
    {
        key: "university",
        labelKey: "employeesExportFieldUniversity",
        groupKey: "employeesExportGroupEducation",
        defaultChecked: false,
    },
    {
        key: "major",
        labelKey: "employeesExportFieldMajor",
        groupKey: "employeesExportGroupEducation",
        defaultChecked: false,
    },
];

const DISPLAY_LABEL_KEYS: Record<string, string> = {
    employeeCode: "employeesExportHeaderEmployeeCodeShort",
    fullName: "employeesExportFieldFullName",
    name: "employeesExportHeaderName",
    gender: "employeesExportFieldGender",
    dateOfBirth: "employeesExportFieldDateOfBirth",
    nationalId: "employeesExportFieldNationalId",
    nationalIdDate: "employeesExportFieldNationalIdDate",
    nationalIdPlace: "employeesExportFieldNationalIdPlace",
    maritalStatus: "employeesExportFieldMaritalStatus",
    nationality: "employeesExportFieldNationality",
    ethnicity: "employeesExportFieldEthnicity",
    religion: "employeesExportFieldReligion",
    phone: "employeesExportHeaderPhoneShort",
    personalEmail: "employeesExportFieldPersonalEmail",
    email: "employeesExportFieldCompanyEmail",
    address: "employeesExportFieldAddress",
    departmentName: "employeesExportFieldDepartment",
    positionName: "employeesExportFieldPosition",
    employmentType: "employeesExportHeaderEmploymentTypeShort",
    hireDate: "employeesExportHeaderHireDateShort",
    employeeStatus: "employeesExportFieldEmployeeStatus",
    bankName: "employeesExportHeaderBankShort",
    bankAccount: "employeesExportHeaderBankAccountShort",
    bankBranch: "employeesExportFieldBankBranch",
    socialInsuranceNo: "employeesExportHeaderSocialInsuranceShort",
    healthInsuranceNo: "employeesExportHeaderHealthInsuranceShort",
    taxCode: "employeesExportFieldTaxCode",
    educationLevel: "employeesExportFieldEducationLevel",
    university: "employeesExportFieldUniversity",
    major: "employeesExportFieldMajor",
    createdAt: "employeesExportHeaderCreatedAt",
};

function mapEnumValue(
    field: string,
    value: unknown,
    t: ExportDialogTranslator,
): unknown {
    const map: Record<string, Record<string, string>> = {
        gender: {
            MALE: t("employeesExportGenderMale"),
            FEMALE: t("employeesExportGenderFemale"),
            OTHER: t("employeesExportGenderOther"),
        },
        employeeStatus: {
            ACTIVE: t("employeesExportStatusActive"),
            ON_LEAVE: t("employeesExportStatusOnLeave"),
            RESIGNED: t("employeesExportStatusResigned"),
            TERMINATED: t("employeesExportStatusTerminated"),
        },
        employmentType: {
            FULL_TIME: t("employeesExportEmploymentTypeFullTime"),
            PART_TIME: t("employeesExportEmploymentTypePartTime"),
            CONTRACT: t("employeesExportEmploymentTypeContract"),
            INTERN: t("employeesExportEmploymentTypeIntern"),
        },
        educationLevel: {
            HIGHSCHOOL: t("employeesExportEducationHighSchool"),
            COLLEGE: t("employeesExportEducationCollege"),
            BACHELOR: t("employeesExportEducationBachelor"),
            MASTER: t("employeesExportEducationMaster"),
            PHD: t("employeesExportEducationPhd"),
        },
        maritalStatus: {
            SINGLE: t("employeesExportMaritalSingle"),
            MARRIED: t("employeesExportMaritalMarried"),
            DIVORCED: t("employeesExportMaritalDivorced"),
        },
    };

    const mapped = map[field]?.[String(value)];
    return mapped ?? value;
}

function formatDateForExcel(date: Date | string | null): string {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

async function exportToExcel(
    employees: Record<string, unknown>[],
    selectedFields: string[],
    t: ExportDialogTranslator,
) {
    const XLSX = await import("xlsx");

    const displayLabels = Object.fromEntries(
        Object.entries(DISPLAY_LABEL_KEYS).map(([field, key]) => [field, t(key)]),
    );

    const localizedData = employees.map((emp) => {
        const row: Record<string, unknown> = {};
        for (const field of selectedFields) {
            let value = emp[field];

            if (
                field === "dateOfBirth" ||
                field === "nationalIdDate" ||
                field === "hireDate" ||
                field === "createdAt"
            ) {
                value = formatDateForExcel(value as Date | string | null);
            } else if (value !== null && value !== undefined) {
                value = mapEnumValue(field, value, t);
            } else {
                value = "";
            }

            row[displayLabels[field] || field] = value;
        }
        return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(localizedData);

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
    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        t("employeesExportSheetName"),
    );

    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(
        now.getMonth() + 1,
    ).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    XLSX.writeFile(workbook, `${t("employeesExportFilenamePrefix")}-${dateStr}.xlsx`);
}

export function ExportEmployeesDialog({
    open,
    onOpenChange,
    search,
    departmentId,
    status,
    employmentType,
}: ExportEmployeesDialogProps) {
    const [isExporting, setIsExporting] = useState(false);
    const [selectedFields, setSelectedFields] = useState<string[]>(
        EXPORT_FIELDS.filter((f) => f.defaultChecked).map(
            (f) => f.key,
        ),
    );
    const t = useTranslations("ProtectedPages");
    const tCommon = useTranslations("Common");

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
        (groupKey: string, checked: boolean) => {
            const groupKeys = EXPORT_FIELDS.filter(
                (f) => f.groupKey === groupKey,
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
        (groupKey: string) => {
            const groupKeys = EXPORT_FIELDS.filter(
                (f) => f.groupKey === groupKey,
            ).map((f) => f.key);
            return groupKeys.every((k) => selectedFields.includes(k));
        },
        [selectedFields],
    );

    const isGroupSomeChecked = useCallback(
        (groupKey: string) => {
            const groupKeys = EXPORT_FIELDS.filter(
                (f) => f.groupKey === groupKey,
            ).map((f) => f.key);
            const checkedCount = groupKeys.filter((k) =>
                selectedFields.includes(k),
            ).length;
            return (
                checkedCount > 0 && checkedCount < groupKeys.length
            );
        },
        [selectedFields],
    );

    const handleExport = async () => {
        if (selectedFields.length === 0) {
            toast.error(t("employeesExportMinFieldRequired"));
            return;
        }

        setIsExporting(true);
        try {
            const employees = await exportEmployees({
                search,
                departmentId,
                status,
                employmentType,
            });

            if (!employees || employees.length === 0) {
                toast.warning(t("employeesExportNoFilteredData"));
                return;
            }

            await exportToExcel(employees, selectedFields, t);
            toast.success(
                t("employeesExportSuccess", { count: employees.length }),
            );
            onOpenChange(false);
        } catch (err) {
            console.error("Export error:", err);
            toast.error(t("employeesExportError"));
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-primary" />
                        {t("employeesExportDialogTitle")}
                    </DialogTitle>
                    <DialogDescription>
                        {t("employeesExportDialogDescription")}
                    </DialogDescription>
                </DialogHeader>

                {/* Preview count */}
                <div className="flex items-center gap-2 px-1 py-2 rounded-md bg-muted/50 text-sm">
                    <Info className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">
                        {t("employeesExportDialogHint")}
                    </span>
                </div>

                {/* Field selection */}
                <ScrollArea className="flex-1 min-h-0 ">
                    <div className="space-y-4">
                        {Object.entries(groupedFields()).map(
                            ([group, fields]) => (
                                <div key={group}>
                                    {/* Group header */}
                                    <div className="flex items-center gap-2 mb-2">
                                        <Checkbox
                                            id={`group-${group}`}
                                            checked={isGroupAllChecked(
                                                group,
                                            )}
                                            ref={
                                                isGroupSomeChecked(
                                                    group,
                                                )
                                                    ? undefined
                                                    : undefined
                                            }
                                            onCheckedChange={(
                                                checked,
                                            ) =>
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
                        {t("employeesExportSelectedCount", {
                            selected: selectedFields.length,
                            total: EXPORT_FIELDS.length,
                        })}
                    </span>
                    {selectedFields.length === 0 && (
                        <span className="text-xs text-destructive">
                            {t("employeesExportMinFieldWarning")}
                        </span>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isExporting}
                    >
                        {tCommon("cancel")}
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
                                {t("employeesExportLoading")}
                            </>
                        ) : (
                            <>
                                <Download className="h-4 w-4 mr-2" />
                                {t("employeesExportExcel")}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

