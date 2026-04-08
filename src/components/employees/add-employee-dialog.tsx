"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  createEmployee,
  updateEmployee,
  checkNationalIdExists,
  generateEmployeeCode,
  importEmployeesBatch,
  getDepartmentOptions,
  suggestRoleForPositionChange,
  updateUserRoleFromPosition,
} from "@/app/[locale]/(protected)/employees/actions";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Briefcase,
  Contact,
  Upload,
  X,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  CreditCard,
  FileSpreadsheet,
  Download,
  FileText,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { FileDropzone } from "@/components/employees/import-export/file-dropzone";
import {
  downloadEmployeeImportTemplate,
  type ParsedImportResult,
} from "@/lib/excel-utils";
import { DatePicker } from "@/components/ui/date-picker";
import { SidebarMenuButton } from "../ui/sidebar";
import { cn } from "@/lib/utils";
import { Textarea } from "../ui/textarea";
import { PositionDropdown } from "../positions/position-dropdown";
import { Badge } from "../ui/badge";
import {
  getRoleBadgeColor,
  ROLE_LABELS,
} from "@/app/[locale]/(protected)/settings/roles/constants";

// Employee form schema
function createAddEmployeeSchema(t: ReturnType<typeof useTranslations>) {
  return z.object({
    fullName: z.string().min(1, t("employeesAddValidationFullNameRequired")),
    nationalId: z
      .string()
      .min(9, t("employeesAddValidationNationalIdMin"))
      .max(12, t("employeesAddValidationNationalIdMax"))
      .regex(/^\d+$/, t("employeesAddValidationNationalIdNumeric")),
    nationalIdDate: z.date().optional(),
    nationalIdPlace: z.string().optional(),
    dateOfBirth: z.date().min(1, t("employeesAddValidationDateOfBirthRequired")),
    gender: z.string().optional(),
    nationality: z.string().optional(),
    ethnicity: z.string().optional(),
    religion: z.string().optional(),
    maritalStatus: z.string().optional(),
    departmentId: z.string().optional(),
    positionId: z.string().optional(),
    employmentType: z.string().optional(),
    hireDate: z.date().optional(),
    probationEnd: z.date().optional(),
    employeeStatus: z.string().optional(),
    phone: z
      .string()
      .regex(/^(0|\+84)\d{9,10}$/, t("employeesAddValidationPhoneInvalid"))
      .optional(),
    personalEmail: z
      .string()
      .email(t("employeesAddValidationEmailInvalid"))
      .optional(),
    address: z.string().optional(),
    educationLevel: z.string().optional(),
    university: z.string().optional(),
    major: z.string().optional(),
    bankName: z.string().optional(),
    bankAccount: z.string().optional(),
    taxCode: z.string().optional(),
  });
}

type AddEmployeeFormValues = z.infer<ReturnType<typeof createAddEmployeeSchema>>;

export interface EmployeeEditData {
  id: string;
  employeeCode?: string | null;
  fullName?: string | null;
  nationalId?: string | null;
  nationalIdDate?: Date | null;
  nationalIdPlace?: string | null;
  dateOfBirth?: Date | null;
  gender?: string | null;
  nationality?: string | null;
  ethnicity?: string | null;
  religion?: string | null;
  maritalStatus?: string | null;
  departmentId?: string | null;
  positionId?: string | null;
  employmentType?: string | null;
  hireDate?: Date | null;
  probationEnd?: Date | null;
  employeeStatus?: string | null;
  phone?: string | null;
  personalEmail?: string | null;
  address?: string | null;
  educationLevel?: string | null;
  university?: string | null;
  major?: string | null;
  bankName?: string | null;
  bankAccount?: string | null;
  taxCode?: string | null;
}

interface AddEmployeeDialogProps {
  open: boolean;
  onClose: () => void;
  employee?: EmployeeEditData;
}

// â”€â”€â”€ Section config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type SectionKey = "basic" | "work" | "contact" | "banking";

const SECTIONS: {
  key: SectionKey;
  labelKey: string;
  descriptionKey: string;
  icon: React.ElementType;
}[] = [
  {
    key: "basic",
    labelKey: "employeesAddSectionBasicLabel",
    descriptionKey: "employeesAddSectionBasicDescription",
    icon: User,
  },
  {
    key: "work",
    labelKey: "employeesAddSectionWorkLabel",
    descriptionKey: "employeesAddSectionWorkDescription",
    icon: Briefcase,
  },
  {
    key: "contact",
    labelKey: "employeesAddSectionContactLabel",
    descriptionKey: "employeesAddSectionContactDescription",
    icon: Contact,
  },
  {
    key: "banking",
    labelKey: "employeesAddSectionBankingLabel",
    descriptionKey: "employeesAddSectionBankingDescription",
    icon: CreditCard,
  },
];

// â”€â”€â”€ Import Sheet (sub-component) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface ImportEmployeeSheetProps {
  open: boolean;
  onClose: () => void;
}

function ImportEmployeeSheet({ open, onClose }: ImportEmployeeSheetProps) {
  const t = useTranslations("ProtectedPages");
  const queryClient = useQueryClient();
  const [importResult, setImportResult] = useState<ParsedImportResult | null>(
    null,
  );
  const [importPreview, setImportPreview] = useState<
    Record<string, unknown>[] | null
  >(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  const importMutation = useMutation({
    mutationFn: async (rows: Record<string, unknown>[]) => {
      return importEmployeesBatch(rows);
    },
    onSuccess: (result) => {
      if (result.failed === 0) {
        toast.success(
          t("employeesAddImportSuccess", {
            count: result.success,
          }),
        );
      } else {
        toast.warning(
          t("employeesAddImportPartial", {
            success: result.success,
            failed: result.failed,
          }),
        );
      }
      if (result.errors.length > 0) {
        setImportErrors(result.errors.slice(0, 5));
      }
      if (result.success > 0) {
        queryClient.invalidateQueries({
          queryKey: ["employees"],
        });
        handleClose();
      }
      setIsImporting(false);
    },
    onError: (err) => {
      const error = err as Error;
      toast.error(error.message || t("employeesAddImportError"));
      setIsImporting(false);
    },
  });

  const handleFileParsed = useCallback((result: ParsedImportResult) => {
    setImportResult(result);
    setImportPreview(result.rows.slice(0, 5));
    setImportErrors([]);
  }, []);

  const handleClear = useCallback(() => {
    setImportResult(null);
    setImportPreview(null);
    setImportErrors([]);
  }, []);

  const handleConfirm = useCallback(() => {
    if (!importResult) return;
    setIsImporting(true);
    importMutation.mutate(importResult.rows);
  }, [importResult, importMutation]);

  const handleClose = useCallback(() => {
    handleClear();
    onClose();
  }, [handleClear, onClose]);

  const handleDownloadTemplate = useCallback(async () => {
    setIsDownloading(true);
    try {
      await downloadEmployeeImportTemplate();
      toast.success(t("employeesAddTemplateDownloadSuccess"));
    } catch {
      toast.error(t("employeesAddTemplateDownloadError"));
    } finally {
      setIsDownloading(false);
    }
  }, [t]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            {t("employeesAddImportSheetTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("employeesAddImportSheetDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Action bar */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              disabled={isDownloading || isImporting}
              className="gap-1.5"
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {t("employeesAddTemplateDownload")}
            </Button>
          </div>

          {/* Guide accordion */}
          <div className="border rounded-lg overflow-hidden">
            <button
              onClick={() => setGuideOpen(!guideOpen)}
              className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors"
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4 text-primary" />
                {t("employeesAddImportGuideTitle")}
              </span>
              {guideOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            {guideOpen && (
              <div className="px-4 pb-4 border-t">
                <div className="pt-3 space-y-4">
                  {/* Required columns */}
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
                      <span className="text-destructive">*</span> {t("employeesAddImportRequiredColumns")}
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      <span className="text-xs">
                        <strong>{t("employeesExportFieldEmployeeCode")}</strong> — {t("employeesAddImportEmployeeCodeHint")}
                      </span>
                      <span className="text-xs">
                        <strong>{t("employeesExportFieldFullName")}</strong> — {t("employeesAddImportFullNameHint")}
                      </span>
                    </div>
                  </div>

                  {/* Optional columns */}
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-2">
                      {t("employeesAddImportOptionalColumns")}
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        {t("employeesExportFieldDateOfBirth")}{" "}
                        <span className="text-[10px] text-muted-foreground/70">(dd/MM/yyyy)</span>
                      </span>
                      <span>
                        {t("employeesExportFieldGender")}{" "}
                        <span className="text-[10px] text-muted-foreground/70">
                          ({t("employeesExportGenderMale")}/{t("employeesExportGenderFemale")}/{t("employeesExportGenderOther")})
                        </span>
                      </span>
                      <span>{t("employeesExportFieldPhone")}</span>
                      <span>{t("employeesExportFieldPersonalEmail")}</span>
                      <span>{t("employeesExportFieldAddress")}</span>
                      <span>{t("employeesExportFieldDepartment")}</span>
                      <span>{t("employeesExportFieldPosition")}</span>
                      <span>
                        {t("employeesExportFieldEmploymentType")}{" "}
                        <span className="text-[10px] text-muted-foreground/70">
                          ({t("employeesExportEmploymentTypeFullTime")}/{t("employeesExportEmploymentTypePartTime")}/{t("employeesExportEmploymentTypeContract")}/{t("employeesExportEmploymentTypeIntern")})
                        </span>
                      </span>
                      <span>
                        {t("employeesExportFieldHireDate")}{" "}
                        <span className="text-[10px] text-muted-foreground/70">(dd/MM/yyyy)</span>
                      </span>
                      <span>
                        {t("employeesExportFieldEmployeeStatus")}{" "}
                        <span className="text-[10px] text-muted-foreground/70">
                          ({t("employeesStatusActive")}/{t("employeesStatusOnLeave")}/{t("employeesStatusResigned")})
                        </span>
                      </span>
                      <span>{t("employeesExportFieldBankName")}</span>
                      <span>{t("employeesExportFieldBankAccount")}</span>
                      <span>
                        {t("employeesExportFieldEducationLevel")}{" "}
                        <span className="text-[10px] text-muted-foreground/70">
                          ({t("employeesExportEducationHighSchool")}/{t("employeesExportEducationCollege")}/{t("employeesExportEducationBachelor")}/{t("employeesExportEducationMaster")})
                        </span>
                      </span>
                      <span>{t("employeesExportFieldUniversity")}</span>
                    </div>
                  </div>

                  {/* Tips */}
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-md p-3">
                    <p className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-1.5">
                      {t("employeesAddImportTipsTitle")}
                    </p>
                    <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-0.5 list-disc list-inside">
                      <li>{t("employeesAddImportTipExactColumns")}</li>
                      <li>{t("employeesAddImportTipKeepHeader")}</li>
                      <li>{t("employeesAddImportTipDateFormat")}</li>
                      <li>{t("employeesAddImportTipPhoneFormat")}</li>
                      <li>{t("employeesAddImportTipUseTemplate")}</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {!importResult && (
            <FileDropzone
              onFileParsed={handleFileParsed}
              onClear={handleClear}
            />
          )}

          {importResult && (
            <div className="space-y-4">
              {/* Success header */}
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                <span className="text-sm text-green-800 dark:text-green-300">
                  {t("employeesAddImportReadRecords", {
                    count: importResult.rows.length,
                  })}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto h-6 w-6"
                  onClick={handleClear}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              {/* Preview table */}
              {importPreview && importPreview.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <p className="text-xs text-muted-foreground px-3 py-2 bg-muted/30 border-b">
                    {t("employeesAddImportPreviewFirstFive")}
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/30">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                            STT
                          </th>
                          <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                            {t("employeesExportFieldFullName")}
                          </th>
                          <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                            {t("employeesExportFieldNationalId")}
                          </th>
                          <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                            {t("employeesExportFieldDateOfBirth")}
                          </th>
                          <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                            {t("employeesExportFieldGender")}
                          </th>
                          <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                            {t("employeesExportHeaderPhoneShort")}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {importPreview.map((row, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2 text-muted-foreground">
                              {idx + 1}
                            </td>
                            <td className="px-3 py-2 font-medium">
                              {String(row[t("employeesExportFieldFullName")] || row["fullName"] || "")}
                            </td>
                            <td className="px-3 py-2">
                              {String(row["CCCD"] || "")}
                            </td>
                            <td className="px-3 py-2">
                              {String(row[t("employeesExportFieldDateOfBirth")] || row["dateOfBirth"] || "")}
                            </td>
                            <td className="px-3 py-2">
                              {String(row[t("employeesExportFieldGender")] || row["gender"] || "")}
                            </td>
                            <td className="px-3 py-2">
                              {String(row[t("employeesExportFieldPhone")] || row["phone"] || "")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Error list */}
              {importErrors.length > 0 && (
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800 dark:text-red-300">
                    <p className="font-medium mb-1">{t("employeesAddImportSkippedRows")}</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      {importErrors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Format note */}
              <div className="p-3 bg-muted/30 rounded-lg border">
                <p className="text-xs font-medium mb-2">
                  {t("employeesAddImportRequiredColumnsNote")}
                </p>
                <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                  <span>
                    <strong>{t("employeesExportFieldFullName")}</strong> ({t("employeesAddRequired")})
                  </span>
                  <span>
                    <strong>{t("employeesExportFieldNationalId")}</strong> ({t("employeesAddRequired")})
                  </span>
                  <span>{t("employeesExportFieldDateOfBirth")}</span>
                  <span>{t("employeesExportFieldGender")} ({t("employeesExportGenderMale")}/{t("employeesExportGenderFemale")}/{t("employeesExportGenderOther")})</span>
                  <span>{t("employeesExportFieldPhone")}</span>
                  <span>{t("employeesExportFieldPersonalEmail")}</span>
                  <span>{t("employeesExportFieldDepartment")}</span>
                  <span>{t("employeesExportFieldPosition")}</span>
                  <span>{t("employeesExportFieldHireDate")} (dd/MM/yyyy)</span>
                  <span>{t("employeesExportFieldEducationLevel")} ({t("employeesExportEducationHighSchool")}/{t("employeesExportEducationCollege")}/{t("employeesExportEducationBachelor")}...)</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={handleClear}
                  disabled={isImporting}
                >
                  {t("employeesAddChooseOtherFile")}
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={isImporting || importResult.rows.length === 0}
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("employeesAddImporting")}
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="h-4 w-4" />
                      {t("employeesAddImportEmployeesCount", {
                        count: importResult.rows.length,
                      })}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Main Component

export function AddEmployeeDialog({
  open,
  onClose,
  employee,
}: AddEmployeeDialogProps) {
  const t = useTranslations("ProtectedPages");
  const isEditMode = !!employee;
  const queryClient = useQueryClient();

  // Active section
  const [activeSection, setActiveSection] = useState<SectionKey>("basic");

  // Import sheet
  const [importOpen, setImportOpen] = useState(false);

  // Role suggestion state
  const [roleSuggestion, setRoleSuggestion] = useState<{
    roleKey: string | null;
    roleName: string | null;
    positionName: string | null;
    currentRoleKey: string | null;
    shouldSuggest: boolean;
  } | null>(null);
  const [showRoleSuggestion, setShowRoleSuggestion] = useState(false);

  // Fetch departments for select
  const { data: departments = [] } = useQuery({
    queryKey: ["departmentOptions"],
    queryFn: getDepartmentOptions,
    enabled: open,
  });

  // Auto-generate employee code on open
  const [employeeCode, setEmployeeCode] = useState<string>("");

  useEffect(() => {
    if (open && !isEditMode) {
      generateEmployeeCode().then(setEmployeeCode);
    } else if (open && isEditMode && employee?.employeeCode) {
      setEmployeeCode(employee.employeeCode);
    }
  }, [open, isEditMode, employee?.employeeCode]);

  // Form
  const form = useForm<AddEmployeeFormValues>({
    resolver: zodResolver(createAddEmployeeSchema(t)),
    defaultValues: {
      fullName: "",
      nationalId: "",
      nationalIdDate: new Date(),
      nationalIdPlace: "",
      dateOfBirth: new Date(),
      gender: undefined,
      nationality: t("employeesAddDefaultNationality"),
      ethnicity: t("employeesAddDefaultEthnicity"),
      religion: "",
      maritalStatus: undefined,
      departmentId: undefined,
      positionId: "",
      employmentType: "FULL_TIME",
      hireDate: new Date(),
      probationEnd: new Date(),
      employeeStatus: "ACTIVE",
      phone: "",
      personalEmail: "",
      address: "",
      educationLevel: undefined,
      university: "",
      major: "",
      bankName: "",
      bankAccount: "",
      taxCode: "",
    },
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (isEditMode && employee) {
        form.reset({
          fullName: employee.fullName || "",
          nationalId: employee.nationalId || "",
          nationalIdDate: employee.nationalIdDate
            ? new Date(employee.nationalIdDate)
            : new Date(),
          nationalIdPlace: employee.nationalIdPlace || "",
          dateOfBirth: employee.dateOfBirth
            ? new Date(employee.dateOfBirth)
            : new Date(),
          gender: employee.gender || undefined,
          nationality: employee.nationality || t("employeesAddDefaultNationality"),
          ethnicity: employee.ethnicity || t("employeesAddDefaultEthnicity"),
          religion: employee.religion || "",
          maritalStatus: employee.maritalStatus || undefined,
          departmentId: employee.departmentId || undefined,
          positionId: employee.positionId || "",
          employmentType: employee.employmentType || "FULL_TIME",
          hireDate: employee.hireDate
            ? new Date(employee.hireDate)
            : new Date(),
          probationEnd: employee.probationEnd
            ? new Date(employee.probationEnd)
            : new Date(),
          employeeStatus: employee.employeeStatus || "ACTIVE",
          phone: employee.phone || "",
          personalEmail: employee.personalEmail || "",
          address: employee.address || "",
          educationLevel: employee.educationLevel || undefined,
          university: employee.university || "",
          major: employee.major || "",
          bankName: employee.bankName || "",
          bankAccount: employee.bankAccount || "",
          taxCode: employee.taxCode || "",
        });
      } else {
        form.reset({
          fullName: "",
          nationalId: "",
          nationalIdDate: new Date(),
          nationalIdPlace: "",
          dateOfBirth: new Date(),
          gender: undefined,
          nationality: t("employeesAddDefaultNationality"),
          ethnicity: t("employeesAddDefaultEthnicity"),
          religion: "",
          maritalStatus: undefined,
          departmentId: undefined,
          positionId: "",
          employmentType: "FULL_TIME",
          hireDate: new Date(),
          probationEnd: new Date(),
          employeeStatus: "ACTIVE",
          phone: "",
          personalEmail: "",
          address: "",
          educationLevel: undefined,
          university: "",
          major: "",
          bankName: "",
          bankAccount: "",
          taxCode: "",
        });
        generateEmployeeCode().then(setEmployeeCode);
      }
      // Reset role suggestion when dialog opens
      setRoleSuggestion(null);
      setShowRoleSuggestion(false);
    }
  }, [open, form, isEditMode, employee, t]);

  // â”€â”€ Watch positionId for changes and fetch role suggestion â”€â”€
  useEffect(() => {
    if (!isEditMode || !employee?.id) {
      setRoleSuggestion(null);
      setShowRoleSuggestion(false);
      return;
    }

    const positionId = form.getValues("positionId");
    if (!positionId) {
      setRoleSuggestion(null);
      setShowRoleSuggestion(false);
      return;
    }

    if (positionId === employee.positionId) {
      setRoleSuggestion(null);
      setShowRoleSuggestion(false);
      return;
    }

    const fetchSuggestion = async () => {
      try {
        const result = await suggestRoleForPositionChange(
          employee.id,
          positionId,
        );
        if (result.shouldSuggest) {
          setRoleSuggestion(result);
          setShowRoleSuggestion(true);
        } else {
          setRoleSuggestion(null);
          setShowRoleSuggestion(false);
        }
      } catch {
        setRoleSuggestion(null);
        setShowRoleSuggestion(false);
      }
    };

    const timer = setTimeout(fetchSuggestion, 400);
    return () => clearTimeout(timer);
  }, [form, isEditMode, employee?.id, employee?.positionId]);

  // â”€â”€ Debounced CCCD existence check â”€â”€
  const cccdDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [cccdStatus, setCccdStatus] = useState<
    "idle" | "checking" | "exists" | "available"
  >("idle");
  const [cccdExistsName, setCccdExistsName] = useState<string>("");

  const nationalId = form.watch("nationalId");

  useEffect(() => {
    const currentNationalId = form.getValues("nationalId");
    if (!currentNationalId || currentNationalId.length < 9) {
      setCccdStatus("idle");
      setCccdExistsName("");
      return;
    }
    setCccdStatus("checking");

    if (cccdDebounceTimer.current) clearTimeout(cccdDebounceTimer.current);
    cccdDebounceTimer.current = setTimeout(async () => {
      try {
        // Skip duplicate check if editing and CCCD hasn't changed
        if (isEditMode && currentNationalId === employee?.nationalId) {
          setCccdStatus("available");
          setCccdExistsName("");
          return;
        }
        const result = await checkNationalIdExists(currentNationalId);
        if (result.exists) {
          setCccdStatus("exists");
          setCccdExistsName(result.employeeName || "");
        } else {
          setCccdStatus("available");
          setCccdExistsName("");
        }
      } catch {
        setCccdStatus("idle");
      }
    }, 600);
  }, [nationalId, form, isEditMode, employee?.nationalId]);

  // Clear CCCD status when dialog closes
  useEffect(() => {
    if (!open) {
      setCccdStatus("idle");
      setCccdExistsName("");
    }
  }, [open]);

  // â”€â”€ Create employee mutation â”€â”€
  const createMutation = useMutation({
    mutationFn: async (data: AddEmployeeFormValues) => {
      if (cccdStatus === "exists") {
        throw new Error(
          t("employeesAddNationalIdDuplicate", { nationalId: data.nationalId }),
        );
      }

      const email =
        data.personalEmail ||
        `${data.fullName.toLowerCase().replace(/\s+/g, ".")}.${employeeCode.toLowerCase()}@placeholder.local`;

      return createEmployee({
        name: data.fullName,
        email,
        employeeCode,
        fullName: data.fullName,
        nationalId: data.nationalId,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        nationalIdDate: data.nationalIdDate
          ? new Date(data.nationalIdDate)
          : undefined,
        nationalIdPlace: data.nationalIdPlace,
        gender: data.gender,
        nationality: data.nationality,
        ethnicity: data.ethnicity,
        religion: data.religion,
        maritalStatus: data.maritalStatus,
        departmentId: data.departmentId,
        positionId: data.positionId,
        employmentType: data.employmentType,
        hireDate: data.hireDate ? new Date(data.hireDate) : undefined,
        probationEnd: data.probationEnd
          ? new Date(data.probationEnd)
          : undefined,
        employeeStatus: data.employeeStatus,
        phone: data.phone,
        personalEmail: data.personalEmail,
        address: data.address,
        educationLevel: data.educationLevel,
        university: data.university,
        major: data.major,
        bankName: data.bankName,
        bankAccount: data.bankAccount,
        taxCode: data.taxCode,
      });
    },
    onSuccess: () => {
      toast.success(t("employeesAddCreateSuccess"));
      queryClient.invalidateQueries({
        queryKey: ["employees"],
      });
      handleClose();
    },
    onError: (err) => {
      const error = err as Error;
      toast.error(error.message || t("employeesAddCommonError"));
    },
  });

  // â”€â”€ Update employee mutation â”€â”€
  const updateMutation = useMutation({
    mutationFn: async (data: AddEmployeeFormValues) => {
      if (!employee) throw new Error(t("employeesAddNotFoundError"));
      if (cccdStatus === "exists" && data.nationalId !== employee.nationalId) {
        throw new Error(
          t("employeesAddNationalIdDuplicate", { nationalId: data.nationalId }),
        );
      }

      const result = await updateEmployee(employee.id, {
        name: data.fullName,
        fullName: data.fullName,
        nationalId: data.nationalId,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        nationalIdDate: data.nationalIdDate
          ? new Date(data.nationalIdDate)
          : undefined,
        nationalIdPlace: data.nationalIdPlace,
        gender: data.gender,
        nationality: data.nationality,
        ethnicity: data.ethnicity,
        religion: data.religion,
        maritalStatus: data.maritalStatus,
        departmentId: data.departmentId,
        positionId: data.positionId,
        employmentType: data.employmentType,
        hireDate: data.hireDate ? new Date(data.hireDate) : undefined,
        probationEnd: data.probationEnd
          ? new Date(data.probationEnd)
          : undefined,
        employeeStatus: data.employeeStatus,
        phone: data.phone,
        personalEmail: data.personalEmail,
        address: data.address,
        educationLevel: data.educationLevel,
        university: data.university,
        major: data.major,
        bankName: data.bankName,
        bankAccount: data.bankAccount,
        taxCode: data.taxCode,
      });

      // Cáº­p nháº­t role tá»± Ä‘á»™ng náº¿u position thay Ä‘á»•i vÃ  cÃ³ role mapping
      if (showRoleSuggestion && roleSuggestion?.roleKey && data.positionId) {
        await updateUserRoleFromPosition(employee.id, data.positionId);
      }

      return result;
    },
    onSuccess: () => {
      toast.success(t("employeesAddUpdateSuccess"));
      queryClient.invalidateQueries({
        queryKey: ["employees"],
      });
      handleClose();
    },
    onError: (err) => {
      const error = err as Error;
      toast.error(error.message || t("employeesAddCommonError"));
    },
  });

  const handleClose = useCallback(() => {
    form.reset();
    onClose();
  }, [onClose, form]);

  const onSubmit = form.handleSubmit((data) => {
    if (isEditMode) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  });

  // Navigate to next section with validation
  const handleNextSection = async () => {
    const order: SectionKey[] = ["basic", "work", "contact", "banking"];
    const idx = order.indexOf(activeSection);
    if (idx < order.length - 1) {
      // Validate required fields of current section
      const fieldsToValidate = getSectionRequiredFields(activeSection);
      const isValid = await form.trigger(fieldsToValidate);
      if (isValid) {
        setActiveSection(order[idx + 1]);
      }
    }
  };

  // Navigate to previous section
  const handlePrevSection = () => {
    const order: SectionKey[] = ["basic", "work", "contact", "banking"];
    const idx = order.indexOf(activeSection);
    if (idx > 0) {
      setActiveSection(order[idx - 1]);
    }
  };

  const isPending = isEditMode
    ? updateMutation.isPending
    : createMutation.isPending;
  const isLastSection = activeSection === "banking";
  const isFirstSection = activeSection === "basic";

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(o) => !o && !isPending && handleClose()}
      >
        <DialogContent className="sm:max-w-3xl h-[75vh] max-h-[75vh] flex flex-col p-0 gap-0">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl">
                  {isEditMode
                    ? t("employeesAddDialogTitleEdit")
                    : t("employeesAddDialogTitleCreate")}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  {isEditMode
                    ? t("employeesAddDialogDescriptionEdit")
                    : t("employeesAddDialogDescriptionCreate")}
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Body: sidebar + content */}
          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* Sidebar navigation */}
            <div className="w-52 shrink-0 border-r bg-muted/20 overflow-y-auto">
              <div className="p-3 space-y-1">
                {SECTIONS.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.key;
                  return (
                    <SidebarMenuButton
                      key={section.key}
                      isActive={isActive}
                      disabled
                      className="disabled:opacity-100"
                      onClick={() => setActiveSection(section.key)}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          isActive ? "text-primary" : "text-muted-foreground"
                        }`}
                      />
                      <span className="truncate">{t(section.labelKey)}</span>
                    </SidebarMenuButton>
                  );
                })}
              </div>

              {/* Import button at bottom (hidden in edit mode) */}
              {!isEditMode && (
                <div className="p-3 border-t mt-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 text-sm"
                    onClick={() => {
                      setImportOpen(true);
                      handleClose();
                    }}
                  >
                    <Upload className="h-4 w-4" />
                    {t("employeesAddImportFromExcel")}
                  </Button>
                </div>
              )}
            </div>

            {/* Content area */}
            <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
              <Form {...form}>
                <form
                  onSubmit={onSubmit}
                  className="flex flex-col flex-1 min-h-0"
                >
                  {/* Scrollable content */}
                  <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4">
                    {/* â”€â”€ Section 1: ThÃ´ng tin cÆ¡ báº£n â”€â”€ */}
                    {activeSection === "basic" && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col items-start">
                            <h3 className="text-base font-semibold">
                              {t("employeesAddSectionBasicTitle")}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {t("employeesAddSectionBasicDescription")}
                            </p>
                          </div>

                          {/* Employee code badge */}
                          <div className="flex items-center gap-2 bg-muted/60 px-3 py-1.5 rounded-lg border shrink-0">
                            <span className="text-xs text-muted-foreground">
                              {t("employeesAddEmployeeCodeLabel")}
                            </span>
                            <span className="font-mono font-semibold text-sm text-foreground">
                              {employeeCode || "---"}
                            </span>
                          </div>
                        </div>
                        {cccdStatus === "exists" && cccdExistsName && (
                          <p className="text-xs text-destructive">
                            {t("employeesAddCccdExists")} {" "}
                            <span className="font-medium">
                              {cccdExistsName}
                            </span>
                          </p>
                        )}
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="fullName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    {t("employeesAddFieldFullName")}{" "}
                                    <span className="text-destructive">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder={t("employeesAddPlaceholderFullName")}
                                      {...field}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="dateOfBirth"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    {t("employeesAddFieldDateOfBirth")}{" "}
                                    <span className="text-destructive">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <DatePicker
                                      date={field.value}
                                      setDate={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="nationalId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    CCCD{" "}
                                    <span className="text-destructive">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Input
                                        maxLength={12}
                                        minLength={9}
                                        placeholder={t("employeesAddPlaceholderNationalId")}
                                        {...field}
                                        className={
                                          cccdStatus === "exists"
                                            ? "pr-10 border-destructive! focus-visible:ring-destructive/30"
                                            : cccdStatus === "available"
                                              ? "pr-10 border-green-500! focus-visible:ring-green-500/30"
                                              : cccdStatus === "checking"
                                                ? "pr-10"
                                                : "pr-10"
                                        }
                                      />
                                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        {cccdStatus === "checking" && (
                                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                        )}
                                        {cccdStatus === "exists" && (
                                          <AlertCircle className="h-4 w-4 text-destructive" />
                                        )}
                                        {cccdStatus === "available" && (
                                          <CheckCircle className="h-4 w-4 text-green-500" />
                                        )}
                                      </div>
                                    </div>
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="gender"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("employeesAddFieldGender")}</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="w-full">
                                        <SelectValue
                                          placeholder={t("employeesAddPlaceholderSelectGender")}
                                        />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="MALE">
                                        {t("employeesExportGenderMale")}
                                      </SelectItem>
                                      <SelectItem value="FEMALE">
                                        {t("employeesExportGenderFemale")}
                                      </SelectItem>
                                      <SelectItem value="OTHER">
                                        {t("employeesExportGenderOther")}
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="nationalIdDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("employeesExportFieldNationalIdDate")}</FormLabel>
                                  <FormControl>
                                    <DatePicker
                                      date={field.value}
                                      setDate={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="nationalIdPlace"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("employeesExportFieldNationalIdPlace")}</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder={t("employeesAddPlaceholderNationalIdPlace")}
                                      {...field}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="nationality"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("employeesExportFieldNationality")}</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder={t("employeesAddPlaceholderNationality")}
                                      {...field}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="ethnicity"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("employeesExportFieldEthnicity")}</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder={t("employeesAddPlaceholderEthnicity")}
                                      {...field}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="maritalStatus"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("employeesExportFieldMaritalStatus")}</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder={t("employeesAddPlaceholderSelect")} />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="SINGLE">
                                        {t("employeesExportMaritalSingle")}
                                      </SelectItem>
                                      <SelectItem value="MARRIED">
                                        {t("employeesExportMaritalMarried")}
                                      </SelectItem>
                                      <SelectItem value="DIVORCED">
                                        {t("employeesExportMaritalDivorced")}
                                      </SelectItem>
                                      <SelectItem value="WIDOWED">
                                        {t("employeesAddMaritalWidowed")}
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="religion"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("employeesExportFieldReligion")}</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder={t("employeesAddPlaceholderReligion")}
                                      {...field}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* â”€â”€ Section 2: CÃ´ng viá»‡c â”€â”€ */}
                    {activeSection === "work" && (
                      <div className="space-y-4">
                        <div className="flex flex-col items-start">
                          <h3 className="text-base font-semibold">
                            {t("employeesAddSectionWorkTitle")}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {t("employeesAddSectionWorkDescription")}
                          </p>
                        </div>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="departmentId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("employeesExportFieldDepartment")}</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="w-full">
                                        <SelectValue
                                          placeholder={t("employeesAddPlaceholderSelectDepartment")}
                                        />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {departments.map((dept) => (
                                        <SelectItem
                                          key={dept.id}
                                          value={dept.id}
                                        >
                                          {dept.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="positionId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("employeesExportFieldPosition")}</FormLabel>
                                  <FormControl>
                                    <PositionDropdown
                                      value={field.value}
                                      onValueChange={field.onChange}
                                      placeholder={t("employeesAddPlaceholderSelectPosition")}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Role suggestion alert */}
                          {showRoleSuggestion && roleSuggestion && (
                            <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
                              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                  {t("employeesAddRoleSuggestionTitle")}
                                </p>
                                <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                                  {t("employeesAddRoleSuggestionDescriptionStart")} {" "}
                                  <strong>{roleSuggestion.positionName}</strong>{" "}
                                  {t("employeesAddRoleSuggestionDescriptionMiddle")} {" "}
                                  <Badge
                                    variant="outline"
                                    className={
                                      getRoleBadgeColor(
                                        roleSuggestion.roleKey!,
                                      ) + " mx-1 text-xs"
                                    }
                                  >
                                    {roleSuggestion.roleName}
                                  </Badge>
                                  , {t("employeesAddRoleSuggestionDescriptionCurrentRole")} {" "}
                                  <Badge
                                    variant="outline"
                                    className={
                                      getRoleBadgeColor(
                                        roleSuggestion.currentRoleKey!,
                                      ) + " mx-1 text-xs"
                                    }
                                  >
                                    {ROLE_LABELS[
                                      roleSuggestion.currentRoleKey!
                                    ] || roleSuggestion.currentRoleKey}
                                  </Badge>
                                  {t("employeesAddRoleSuggestionDescriptionEnd")}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs gap-1 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40"
                                    onClick={() => setShowRoleSuggestion(false)}
                                  >
                                    {t("employeesAddSkip")}
                                  </Button>
                                  <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                                    <Sparkles className="h-3 w-3" />
                                    <span>
                                      {t("employeesAddRoleWillUpdateOnSave")}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="employmentType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("employeesExportFieldEmploymentType")}</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="w-full">
                                        <SelectValue
                                          placeholder={t("employeesAddPlaceholderSelectEmploymentType")}
                                        />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="FULL_TIME">
                                        {t("employeesExportEmploymentTypeFullTime")}
                                      </SelectItem>
                                      <SelectItem value="PART_TIME">
                                        {t("employeesExportEmploymentTypePartTime")}
                                      </SelectItem>
                                      <SelectItem value="CONTRACT">
                                        {t("employeesExportEmploymentTypeContract")}
                                      </SelectItem>
                                      <SelectItem value="INTERN">
                                        {t("employeesExportEmploymentTypeIntern")}
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="employeeStatus"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("employeesExportFieldEmployeeStatus")}</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="w-full">
                                        <SelectValue
                                          placeholder={t("employeesAddPlaceholderSelectStatus")}
                                        />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="ACTIVE">
                                        {t("employeesStatusActive")}
                                      </SelectItem>
                                      <SelectItem value="ON_LEAVE">
                                        {t("employeesStatusOnLeave")}
                                      </SelectItem>
                                      <SelectItem value="RESIGNED">
                                        {t("employeesStatusResigned")}
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="hireDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("hireDate")}</FormLabel>
                                  <FormControl>
                                    <DatePicker
                                      date={field.value}
                                      setDate={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="probationEnd"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("employeesAddFieldProbationEnd")}</FormLabel>
                                  <FormControl>
                                    <DatePicker
                                      date={field.value}
                                      setDate={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* â”€â”€ Section 3: LiÃªn há»‡ & Há»c váº¥n â”€â”€ */}
                    {activeSection === "contact" && (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-base font-semibold">
                            {t("employeesAddSectionContactTitle")}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {t("employeesAddSectionContactDescription")}
                          </p>
                        </div>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="phone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    {t("employeesExportFieldPhone")}
                                    <span className="text-destructive">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder={t("employeesAddPlaceholderPhone")}
                                      {...field}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="personalEmail"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    {t("employeesExportFieldPersonalEmail")}
                                    <span className="text-destructive">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type="email"
                                      placeholder={t("employeesAddPlaceholderEmail")}
                                      {...field}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("employeesExportFieldAddress")}</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder={t("employeesAddPlaceholderAddress")}
                                    {...field}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="university"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("employeesExportFieldUniversity")}</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder={t("employeesAddPlaceholderUniversity")}
                                    {...field}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="educationLevel"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("employeesExportFieldEducationLevel")}</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder={t("employeesAddPlaceholderSelect")} />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="HIGHSCHOOL">
                                        {t("employeesExportEducationHighSchool")}
                                      </SelectItem>
                                      <SelectItem value="COLLEGE">
                                        {t("employeesExportEducationCollege")}
                                      </SelectItem>
                                      <SelectItem value="BACHELOR">
                                        {t("employeesExportEducationBachelor")}
                                      </SelectItem>
                                      <SelectItem value="MASTER">
                                        {t("employeesExportEducationMaster")}
                                      </SelectItem>
                                      <SelectItem value="PHD">
                                        {t("employeesExportEducationPhd")}
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="major"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("employeesExportFieldMajor")}</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder={t("employeesAddPlaceholderMajor")}
                                      {...field}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* â”€â”€ Section 4: TÃ i khoáº£n ngÃ¢n hÃ ng â”€â”€ */}
                    {activeSection === "banking" && (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-base font-semibold">
                            {t("employeesAddSectionBankingTitle")}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {t("employeesAddSectionBankingDescription")}
                          </p>
                        </div>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="bankName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("employeesExportFieldBankName")}</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder={t("employeesAddPlaceholderBankName")}
                                      {...field}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="bankAccount"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("employeesExportFieldBankAccount")}</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder={t("employeesAddPlaceholderBankAccount")}
                                      {...field}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="taxCode"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("employeesExportFieldTaxCode")}</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder={t("employeesAddPlaceholderTaxCode")}
                                      {...field}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Scrollable inner div ends; footer nav below stays inside <form> */}
                  </div>

                  {/* Footer navigation â€” always visible at bottom */}
                  <div className="flex items-center justify-between pt-3 pb-2 px-6 shrink-0 border-t bg-background">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handlePrevSection}
                      disabled={isFirstSection || isPending}
                      className={cn(isFirstSection && "invisible")}
                    >
                      <ArrowLeft className="h-4 w-4" />
                      {t("employeesImportPreviewPrevious")}
                    </Button>

                    {/* Section dots */}
                    <div className="flex items-center gap-1.5">
                      {SECTIONS.map((s) => (
                        <button
                          key={s.key}
                          onClick={() => setActiveSection(s.key)}
                          className={`h-2 rounded-full transition-all ${
                            activeSection === s.key
                              ? "w-5 bg-primary"
                              : "w-2 bg-muted-foreground/30"
                          }`}
                          title={t(s.labelKey)}
                        />
                      ))}
                    </div>

                    {isLastSection ? (
                      <Button type="submit" size="sm" disabled={isPending}>
                        {isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {t("employeesAddSaving")}
                          </>
                        ) : isEditMode ? (
                          t("employeesAddSaveChanges")
                        ) : (
                          t("employeesAddCreateEmployee")
                        )}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleNextSection}
                        disabled={isPending}
                        className="gap-1"
                      >
                        {t("employeesImportPreviewNext")}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import sheet */}
      <ImportEmployeeSheet
        open={importOpen}
        onClose={() => setImportOpen(false)}
      />
    </>
  );
}

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function getSectionRequiredFields(
  section: SectionKey,
): (keyof AddEmployeeFormValues)[] {
  switch (section) {
    case "basic":
      return ["fullName", "nationalId", "dateOfBirth"];
    default:
      return [];
  }
}

