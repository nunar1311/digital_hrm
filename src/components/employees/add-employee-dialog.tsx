"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
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
    checkNationalIdExists,
    generateEmployeeCode,
    importEmployeesBatch,
    getDepartmentOptions,
} from "@/app/(protected)/employees/actions";
import { toast } from "sonner";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
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
} from "lucide-react";
import { FileDropzone } from "@/components/employees/import-export/file-dropzone";
import {
    parseExcelFile,
    downloadEmployeeImportTemplate,
    type ParsedImportResult,
} from "@/lib/excel-utils";
import { DatePicker } from "@/components/ui/date-picker";
import { SidebarMenuButton } from "../ui/sidebar";
import { cn } from "@/lib/utils";
import { Textarea } from "../ui/textarea";
import { PositionDropdown } from "../positions/position-dropdown";

// ─── Zod Schema ─────────────────────────────────────────────────────────────

const addEmployeeSchema = z.object({
    fullName: z.string().min(1, "Vui lòng nhập họ và tên"),
    nationalId: z
        .string()
        .min(9, "CCCD phải có ít nhất 9 số")
        .max(12, "CCCD tối đa 12 số")
        .regex(/^\d+$/, "CCCD phải là số"),
    nationalIdDate: z.date().optional(),
    nationalIdPlace: z.string().optional(),
    dateOfBirth: z.date().min(1, "Vui lòng chọn ngày sinh"),
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
        .regex(
            /^(0|\+84)\d{9,10}$/,
            "SĐT không hợp lệ (0/84 + 9-10 số)",
        )
        .optional(),
    personalEmail: z.string().email("Email không hợp lệ").optional(),
    address: z.string().optional(),
    educationLevel: z.string().optional(),
    university: z.string().optional(),
    major: z.string().optional(),
    bankName: z.string().optional(),
    bankAccount: z.string().optional(),
    taxCode: z.string().optional(),
});

type AddEmployeeFormValues = z.infer<typeof addEmployeeSchema>;

interface AddEmployeeDialogProps {
    open: boolean;
    onClose: () => void;
}

// ─── Section config ──────────────────────────────────────────────────────────

type SectionKey = "basic" | "work" | "contact" | "banking";

const SECTIONS: {
    key: SectionKey;
    label: string;
    description: string;
    icon: React.ElementType;
}[] = [
    {
        key: "basic",
        label: "Thông tin cơ bản",
        description: "Họ tên, CCCD, ngày sinh...",
        icon: User,
    },
    {
        key: "work",
        label: "Công việc",
        description: "Phòng ban, chức vụ, hợp đồng...",
        icon: Briefcase,
    },
    {
        key: "contact",
        label: "Liên hệ & Học vấn",
        description: "Điện thoại, email, trình độ...",
        icon: Contact,
    },
    {
        key: "banking",
        label: "Tài khoản ngân hàng",
        description: "Ngân hàng, số TK, mã số thuế",
        icon: CreditCard,
    },
];

// ─── Import Sheet (sub-component) ────────────────────────────────────────────

interface ImportEmployeeSheetProps {
    open: boolean;
    onClose: () => void;
}

function ImportEmployeeSheet({
    open,
    onClose,
}: ImportEmployeeSheetProps) {
    const queryClient = useQueryClient();
    const [importResult, setImportResult] =
        useState<ParsedImportResult | null>(null);
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
                    `Đã nhập thành công ${result.success} nhân viên`,
                );
            } else {
                toast.warning(
                    `Nhập được ${result.success}, thất bại ${result.failed}`,
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
            toast.error(error.message || "Có lỗi xảy ra khi nhập");
            setIsImporting(false);
        },
    });

    const handleFileParsed = useCallback(
        (result: ParsedImportResult) => {
            setImportResult(result);
            setImportPreview(result.rows.slice(0, 5));
            setImportErrors([]);
        },
        [],
    );

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
            toast.success("Đã tải file mẫu thành công");
        } catch {
            toast.error("Không thể tải file mẫu");
        } finally {
            setIsDownloading(false);
        }
    }, []);

    return (
        <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5 text-primary" />
                        Nhập nhân viên từ file Excel
                    </DialogTitle>
                    <DialogDescription>
                        Tải lên file Excel (.xlsx, .xls) chứa danh
                        sách nhân viên
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
                            Tải file mẫu
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
                                Hướng dẫn nhập dữ liệu
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
                                            <span className="text-destructive">
                                                *
                                            </span>{" "}
                                            Cột bắt buộc:
                                        </p>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                            <span className="text-xs">
                                                <strong>
                                                    Mã nhân viên
                                                </strong>{" "}
                                                — duy nhất, không
                                                trùng
                                            </span>
                                            <span className="text-xs">
                                                <strong>
                                                    Họ và tên
                                                </strong>{" "}
                                                — bắt buộc
                                            </span>
                                        </div>
                                    </div>

                                    {/* Optional columns */}
                                    <div>
                                        <p className="text-xs font-semibold text-foreground mb-2">
                                            Cột tùy chọn:
                                        </p>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                            <span>
                                                Ngày sinh{" "}
                                                <span className="text-[10px] text-muted-foreground/70">
                                                    (dd/MM/yyyy)
                                                </span>
                                            </span>
                                            <span>
                                                Giới tính{" "}
                                                <span className="text-[10px] text-muted-foreground/70">
                                                    (Nam/Nữ/Khác)
                                                </span>
                                            </span>
                                            <span>Số điện thoại</span>
                                            <span>Email</span>
                                            <span>Địa chỉ</span>
                                            <span>Phòng ban</span>
                                            <span>Chức vụ</span>
                                            <span>
                                                Loại hình{" "}
                                                <span className="text-[10px] text-muted-foreground/70">
                                                    (Toàn thời
                                                    gian/Bán thời
                                                    gian/Hợp đồng/Thực
                                                    tập)
                                                </span>
                                            </span>
                                            <span>
                                                Ngày vào làm{" "}
                                                <span className="text-[10px] text-muted-foreground/70">
                                                    (dd/MM/yyyy)
                                                </span>
                                            </span>
                                            <span>
                                                Trạng thái{" "}
                                                <span className="text-[10px] text-muted-foreground/70">
                                                    (Đang làm/Nghỉ
                                                    phép/Đã nghỉ)
                                                </span>
                                            </span>
                                            <span>Ngân hàng</span>
                                            <span>Số tài khoản</span>
                                            <span>
                                                Trình độ{" "}
                                                <span className="text-[10px] text-muted-foreground/70">
                                                    (THPT/Cao đẳng/Đại
                                                    học/Thạc sĩ)
                                                </span>
                                            </span>
                                            <span>Trường</span>
                                        </div>
                                    </div>

                                    {/* Tips */}
                                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-md p-3">
                                        <p className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-1.5">
                                            Lưu ý khi nhập:
                                        </p>
                                        <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-0.5 list-disc list-inside">
                                            <li>
                                                Tên cột phải{" "}
                                                <strong>
                                                    chính xác
                                                </strong>{" "}
                                                như mẫu (có dấu, viết
                                                hoa đúng)
                                            </li>
                                            <li>
                                                Không chỉnh sửa dòng
                                                tiêu đề (dòng 1)
                                            </li>
                                            <li>
                                                Ngày sinh / Ngày vào
                                                làm: định dạng{" "}
                                                <strong>
                                                    dd/MM/yyyy
                                                </strong>
                                            </li>
                                            <li>
                                                Số điện thoại: bắt đầu
                                                bằng{" "}
                                                <strong>0</strong>,
                                                10–11 số
                                            </li>
                                            <li>
                                                Nên dùng file mẫu để
                                                đảm bảo đúng định dạng
                                            </li>
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
                                    Đọc được{" "}
                                    <strong>
                                        {importResult.rows.length}
                                    </strong>{" "}
                                    bản ghi từ file
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
                            {importPreview &&
                                importPreview.length > 0 && (
                                    <div className="border rounded-lg overflow-hidden">
                                        <p className="text-xs text-muted-foreground px-3 py-2 bg-muted/30 border-b">
                                            Xem trước 5 bản ghi đầu
                                            tiên:
                                        </p>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs">
                                                <thead className="bg-muted/30">
                                                    <tr>
                                                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                                                            STT
                                                        </th>
                                                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                                                            Họ và tên
                                                        </th>
                                                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                                                            CCCD
                                                        </th>
                                                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                                                            Ngày sinh
                                                        </th>
                                                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                                                            Giới tính
                                                        </th>
                                                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                                                            SĐT
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {importPreview.map(
                                                        (
                                                            row,
                                                            idx,
                                                        ) => (
                                                            <tr
                                                                key={
                                                                    idx
                                                                }
                                                            >
                                                                <td className="px-3 py-2 text-muted-foreground">
                                                                    {idx +
                                                                        1}
                                                                </td>
                                                                <td className="px-3 py-2 font-medium">
                                                                    {String(
                                                                        row[
                                                                            "Họ và tên"
                                                                        ] ||
                                                                            "",
                                                                    )}
                                                                </td>
                                                                <td className="px-3 py-2">
                                                                    {String(
                                                                        row[
                                                                            "CCCD"
                                                                        ] ||
                                                                            "",
                                                                    )}
                                                                </td>
                                                                <td className="px-3 py-2">
                                                                    {String(
                                                                        row[
                                                                            "Ngày sinh"
                                                                        ] ||
                                                                            "",
                                                                    )}
                                                                </td>
                                                                <td className="px-3 py-2">
                                                                    {String(
                                                                        row[
                                                                            "Giới tính"
                                                                        ] ||
                                                                            "",
                                                                    )}
                                                                </td>
                                                                <td className="px-3 py-2">
                                                                    {String(
                                                                        row[
                                                                            "Số điện thoại"
                                                                        ] ||
                                                                            "",
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ),
                                                    )}
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
                                        <p className="font-medium mb-1">
                                            Một số dòng bị bỏ qua:
                                        </p>
                                        <ul className="list-disc list-inside space-y-0.5">
                                            {importErrors.map(
                                                (err, i) => (
                                                    <li key={i}>
                                                        {err}
                                                    </li>
                                                ),
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {/* Format note */}
                            <div className="p-3 bg-muted/30 rounded-lg border">
                                <p className="text-xs font-medium mb-2">
                                    Cột bắt buộc trong file Excel:
                                </p>
                                <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                                    <span>
                                        <strong>Họ và tên</strong>{" "}
                                        (bắt buộc)
                                    </span>
                                    <span>
                                        <strong>CCCD</strong> (bắt
                                        buộc)
                                    </span>
                                    <span>Ngày sinh</span>
                                    <span>
                                        Giới tính (Nam/Nữ/Khác)
                                    </span>
                                    <span>Số điện thoại</span>
                                    <span>Email</span>
                                    <span>Phòng ban</span>
                                    <span>Chức vụ</span>
                                    <span>
                                        Ngày vào làm (dd/MM/yyyy)
                                    </span>
                                    <span>
                                        Trình độ (THPT/Cao đẳng/Đại
                                        học...)
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={handleClear}
                                    disabled={isImporting}
                                >
                                    Chọn file khác
                                </Button>
                                <Button
                                    onClick={handleConfirm}
                                    disabled={
                                        isImporting ||
                                        importResult.rows.length === 0
                                    }
                                >
                                    {isImporting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Đang nhập...
                                        </>
                                    ) : (
                                        <>
                                            <FileSpreadsheet className="h-4 w-4" />
                                            Nhập{" "}
                                            {importResult.rows.length}{" "}
                                            nhân viên
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

// ─── Main Component ──────────────────────────────────────────────────────────

export function AddEmployeeDialog({
    open,
    onClose,
}: AddEmployeeDialogProps) {
    const queryClient = useQueryClient();

    // ── Active section ──
    const [activeSection, setActiveSection] =
        useState<SectionKey>("basic");

    // ── Import sheet ──
    const [importOpen, setImportOpen] = useState(false);

    // ── Fetch departments for select ──
    const { data: departments = [] } = useQuery({
        queryKey: ["departmentOptions"],
        queryFn: getDepartmentOptions,
        enabled: open,
    });

    // ── Auto-generate employee code on open ──
    const [employeeCode, setEmployeeCode] = useState<string>("");

    useEffect(() => {
        if (open) {
            generateEmployeeCode().then(setEmployeeCode);
        }
    }, [open]);

    // ── Form ──
    const form = useForm<AddEmployeeFormValues>({
        resolver: zodResolver(addEmployeeSchema),
        defaultValues: {
            fullName: "",
            nationalId: "",
            nationalIdDate: new Date(),
            nationalIdPlace: "",
            dateOfBirth: new Date(),
            gender: undefined,
            nationality: "Việt Nam",
            ethnicity: "Kinh",
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
            form.reset({
                fullName: "",
                nationalId: "",
                nationalIdDate: new Date(),
                nationalIdPlace: "",
                dateOfBirth: new Date(),
                gender: undefined,
                nationality: "Việt Nam",
                ethnicity: "Kinh",
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
    }, [open, form]);

    // ── Debounced CCCD existence check ──
    const cccdDebounceTimer = useRef<ReturnType<
        typeof setTimeout
    > | null>(null);
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

        if (cccdDebounceTimer.current)
            clearTimeout(cccdDebounceTimer.current);
        cccdDebounceTimer.current = setTimeout(async () => {
            try {
                const result =
                    await checkNationalIdExists(currentNationalId);
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
    }, [nationalId, form]);

    // Clear CCCD status when dialog closes
    useEffect(() => {
        if (!open) {
            setCccdStatus("idle");
            setCccdExistsName("");
        }
    }, [open]);

    // ── Create employee mutation ──
    const createMutation = useMutation({
        mutationFn: async (data: AddEmployeeFormValues) => {
            if (cccdStatus === "exists") {
                throw new Error(
                    `CCCD ${data.nationalId} đã được đăng ký cho nhân viên khác. Vui lòng kiểm tra lại.`,
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
                dateOfBirth: data.dateOfBirth
                    ? new Date(data.dateOfBirth)
                    : undefined,
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
                hireDate: data.hireDate
                    ? new Date(data.hireDate)
                    : undefined,
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
            toast.success("Tạo nhân viên thành công");
            queryClient.invalidateQueries({
                queryKey: ["employees"],
            });
            handleClose();
        },
        onError: (err) => {
            const error = err as Error;
            toast.error(error.message || "Có lỗi xảy ra");
        },
    });

    const handleClose = useCallback(() => {
        form.reset();
        onClose();
    }, [onClose, form]);

    const onSubmit = form.handleSubmit((data) => {
        createMutation.mutate(data);
    });

    // Navigate to next section with validation
    const handleNextSection = async () => {
        const order: SectionKey[] = [
            "basic",
            "work",
            "contact",
            "banking",
        ];
        const idx = order.indexOf(activeSection);
        if (idx < order.length - 1) {
            // Validate required fields of current section
            const fieldsToValidate =
                getSectionRequiredFields(activeSection);
            const isValid = await form.trigger(fieldsToValidate);
            if (isValid) {
                setActiveSection(order[idx + 1]);
            }
        }
    };

    // Navigate to previous section
    const handlePrevSection = () => {
        const order: SectionKey[] = [
            "basic",
            "work",
            "contact",
            "banking",
        ];
        const idx = order.indexOf(activeSection);
        if (idx > 0) {
            setActiveSection(order[idx - 1]);
        }
    };

    const isPending = createMutation.isPending;
    const isLastSection = activeSection === "banking";
    const isFirstSection = activeSection === "basic";

    return (
        <>
            <Dialog
                open={open}
                onOpenChange={(o) =>
                    !o && !isPending && handleClose()
                }
            >
                <DialogContent className="sm:max-w-3xl h-[75vh] max-h-[75vh] flex flex-col p-0 gap-0">
                    {/* Header */}
                    <div className="px-6 pt-6 pb-4 border-b shrink-0">
                        <div className="flex items-center justify-between">
                            <div>
                                <DialogTitle className="text-xl">
                                    Thêm nhân viên mới
                                </DialogTitle>
                                <DialogDescription className="mt-1">
                                    Nhập thông tin nhân viên hoặc
                                    import từ file Excel
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
                                    const isActive =
                                        activeSection === section.key;
                                    return (
                                        <SidebarMenuButton
                                            key={section.key}
                                            isActive={isActive}
                                            disabled
                                            className="disabled:opacity-100"
                                            onClick={() =>
                                                setActiveSection(
                                                    section.key,
                                                )
                                            }
                                        >
                                            <Icon
                                                className={`h-4 w-4 shrink-0 ${
                                                    isActive
                                                        ? "text-primary"
                                                        : "text-muted-foreground"
                                                }`}
                                            />
                                            <span className="truncate">
                                                {section.label}
                                            </span>
                                        </SidebarMenuButton>
                                    );
                                })}
                            </div>

                            {/* Import button at bottom */}
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
                                    Nhập từ file Excel
                                </Button>
                            </div>
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
                                        {/* ── Section 1: Thông tin cơ bản ── */}
                                        {activeSection ===
                                            "basic" && (
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex flex-col items-start">
                                                        <h3 className="text-base font-semibold">
                                                            Thông tin
                                                            cơ bản
                                                        </h3>
                                                        <p className="text-sm text-muted-foreground">
                                                            Thông tin
                                                            cá nhân
                                                            bắt buộc
                                                            của nhân
                                                            viên
                                                        </p>
                                                    </div>

                                                    {/* Employee code badge */}
                                                    <div className="flex items-center gap-2 bg-muted/60 px-3 py-1.5 rounded-lg border shrink-0">
                                                        <span className="text-xs text-muted-foreground">
                                                            Mã NV:
                                                        </span>
                                                        <span className="font-mono font-semibold text-sm text-foreground">
                                                            {employeeCode ||
                                                                "---"}
                                                        </span>
                                                    </div>
                                                </div>
                                                {cccdStatus ===
                                                    "exists" &&
                                                    cccdExistsName && (
                                                        <p className="text-xs text-destructive">
                                                            CCCD đã
                                                            tồn tại:{" "}
                                                            <span className="font-medium">
                                                                {
                                                                    cccdExistsName
                                                                }
                                                            </span>
                                                        </p>
                                                    )}
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <FormField
                                                            control={
                                                                form.control
                                                            }
                                                            name="fullName"
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <FormItem>
                                                                    <FormLabel>
                                                                        Họ
                                                                        và
                                                                        tên{" "}
                                                                        <span className="text-destructive">
                                                                            *
                                                                        </span>
                                                                    </FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            placeholder="Nhập họ và tên"
                                                                            {...field}
                                                                        />
                                                                    </FormControl>
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={
                                                                form.control
                                                            }
                                                            name="dateOfBirth"
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <FormItem>
                                                                    <FormLabel>
                                                                        Ngày
                                                                        sinh{" "}
                                                                        <span className="text-destructive">
                                                                            *
                                                                        </span>
                                                                    </FormLabel>
                                                                    <FormControl>
                                                                        <DatePicker
                                                                            date={
                                                                                field.value
                                                                            }
                                                                            setDate={
                                                                                field.onChange
                                                                            }
                                                                        />
                                                                    </FormControl>
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <FormField
                                                            control={
                                                                form.control
                                                            }
                                                            name="nationalId"
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <FormItem>
                                                                    <FormLabel>
                                                                        CCCD{" "}
                                                                        <span className="text-destructive">
                                                                            *
                                                                        </span>
                                                                    </FormLabel>
                                                                    <FormControl>
                                                                        <div className="relative">
                                                                            <Input
                                                                                maxLength={
                                                                                    12
                                                                                }
                                                                                minLength={
                                                                                    9
                                                                                }
                                                                                placeholder="Nhập số CCCD"
                                                                                {...field}
                                                                                className={
                                                                                    cccdStatus ===
                                                                                    "exists"
                                                                                        ? "pr-10 border-destructive focus-visible:ring-destructive"
                                                                                        : cccdStatus ===
                                                                                            "available"
                                                                                          ? "pr-10 border-green-500 focus-visible:ring-green-500/50"
                                                                                          : cccdStatus ===
                                                                                              "checking"
                                                                                            ? "pr-10"
                                                                                            : "pr-10"
                                                                                }
                                                                            />
                                                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                                                {cccdStatus ===
                                                                                    "checking" && (
                                                                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                                                )}
                                                                                {cccdStatus ===
                                                                                    "exists" && (
                                                                                    <AlertCircle className="h-4 w-4 text-destructive" />
                                                                                )}
                                                                                {cccdStatus ===
                                                                                    "available" && (
                                                                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </FormControl>
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={
                                                                form.control
                                                            }
                                                            name="gender"
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <FormItem>
                                                                    <FormLabel>
                                                                        Giới
                                                                        tính
                                                                    </FormLabel>
                                                                    <Select
                                                                        onValueChange={
                                                                            field.onChange
                                                                        }
                                                                        value={
                                                                            field.value
                                                                        }
                                                                    >
                                                                        <FormControl>
                                                                            <SelectTrigger className="w-full">
                                                                                <SelectValue placeholder="Chọn giới tính" />
                                                                            </SelectTrigger>
                                                                        </FormControl>
                                                                        <SelectContent>
                                                                            <SelectItem value="MALE">
                                                                                Nam
                                                                            </SelectItem>
                                                                            <SelectItem value="FEMALE">
                                                                                Nữ
                                                                            </SelectItem>
                                                                            <SelectItem value="OTHER">
                                                                                Khác
                                                                            </SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <FormField
                                                            control={
                                                                form.control
                                                            }
                                                            name="nationalIdDate"
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <FormItem>
                                                                    <FormLabel>
                                                                        Ngày
                                                                        cấp
                                                                        CCCD
                                                                    </FormLabel>
                                                                    <FormControl>
                                                                        <DatePicker
                                                                            date={
                                                                                field.value
                                                                            }
                                                                            setDate={
                                                                                field.onChange
                                                                            }
                                                                        />
                                                                    </FormControl>
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={
                                                                form.control
                                                            }
                                                            name="nationalIdPlace"
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <FormItem>
                                                                    <FormLabel>
                                                                        Nơi
                                                                        cấp
                                                                        CCCD
                                                                    </FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            placeholder="Nhập nơi cấp CCCD"
                                                                            {...field}
                                                                        />
                                                                    </FormControl>
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <FormField
                                                            control={
                                                                form.control
                                                            }
                                                            name="nationality"
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <FormItem>
                                                                    <FormLabel>
                                                                        Quốc
                                                                        tịch
                                                                    </FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            placeholder="Nhập quốc tịch"
                                                                            {...field}
                                                                        />
                                                                    </FormControl>
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={
                                                                form.control
                                                            }
                                                            name="ethnicity"
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <FormItem>
                                                                    <FormLabel>
                                                                        Dân
                                                                        tộc
                                                                    </FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            placeholder="Nhập dân tộc"
                                                                            {...field}
                                                                        />
                                                                    </FormControl>
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <FormField
                                                            control={
                                                                form.control
                                                            }
                                                            name="maritalStatus"
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <FormItem>
                                                                    <FormLabel>
                                                                        Tình
                                                                        trạng
                                                                        hôn
                                                                        nhân
                                                                    </FormLabel>
                                                                    <Select
                                                                        onValueChange={
                                                                            field.onChange
                                                                        }
                                                                        value={
                                                                            field.value
                                                                        }
                                                                    >
                                                                        <FormControl>
                                                                            <SelectTrigger className="w-full">
                                                                                <SelectValue placeholder="Chọn" />
                                                                            </SelectTrigger>
                                                                        </FormControl>
                                                                        <SelectContent>
                                                                            <SelectItem value="SINGLE">
                                                                                Độc
                                                                                thân
                                                                            </SelectItem>
                                                                            <SelectItem value="MARRIED">
                                                                                Đã
                                                                                kết
                                                                                hôn
                                                                            </SelectItem>
                                                                            <SelectItem value="DIVORCED">
                                                                                Ly
                                                                                hôn
                                                                            </SelectItem>
                                                                            <SelectItem value="WIDOWED">
                                                                                Góa
                                                                            </SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </FormItem>
                                                            )}
                                                        />

                                                        <FormField
                                                            control={
                                                                form.control
                                                            }
                                                            name="religion"
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <FormItem>
                                                                    <FormLabel>
                                                                        Tôn
                                                                        giáo
                                                                    </FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            placeholder="Nhập tôn giáo"
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

                                        {/* ── Section 2: Công việc ── */}
                                        {activeSection === "work" && (
                                            <div className="space-y-4">
                                                <div className="flex flex-col items-start">
                                                    <h3 className="text-base font-semibold">
                                                        Thông tin công
                                                        việc
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        Phòng ban,
                                                        chức vụ và
                                                        trạng thái
                                                        nhân viên
                                                    </p>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <FormField
                                                            control={
                                                                form.control
                                                            }
                                                            name="departmentId"
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <FormItem>
                                                                    <FormLabel>
                                                                        Phòng
                                                                        ban
                                                                    </FormLabel>
                                                                    <Select
                                                                        onValueChange={
                                                                            field.onChange
                                                                        }
                                                                        value={
                                                                            field.value
                                                                        }
                                                                    >
                                                                        <FormControl>
                                                                            <SelectTrigger className="w-full">
                                                                                <SelectValue placeholder="Chọn phòng ban" />
                                                                            </SelectTrigger>
                                                                        </FormControl>
                                                                        <SelectContent>
                                                                            {departments.map(
                                                                                (
                                                                                    dept,
                                                                                ) => (
                                                                                    <SelectItem
                                                                                        key={
                                                                                            dept.id
                                                                                        }
                                                                                        value={
                                                                                            dept.id
                                                                                        }
                                                                                    >
                                                                                        {
                                                                                            dept.name
                                                                                        }
                                                                                    </SelectItem>
                                                                                ),
                                                                            )}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={
                                                                form.control
                                                            }
                                                            name="positionId"
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <FormItem>
                                                                    <FormLabel>
                                                                        Chức
                                                                        vụ
                                                                    </FormLabel>
                                                                    <FormControl>
                                                                        <PositionDropdown
                                                                            value={
                                                                                field.value
                                                                            }
                                                                            onValueChange={
                                                                                field.onChange
                                                                            }
                                                                            placeholder="Chọn chức vụ"
                                                                            className="w-full"
                                                                        />
                                                                    </FormControl>
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <FormField
                                                            control={
                                                                form.control
                                                            }
                                                            name="employmentType"
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <FormItem>
                                                                    <FormLabel>
                                                                        Loại
                                                                        hình
                                                                    </FormLabel>
                                                                    <Select
                                                                        onValueChange={
                                                                            field.onChange
                                                                        }
                                                                        value={
                                                                            field.value
                                                                        }
                                                                    >
                                                                        <FormControl>
                                                                            <SelectTrigger className="w-full">
                                                                                <SelectValue placeholder="Chọn loại hình" />
                                                                            </SelectTrigger>
                                                                        </FormControl>
                                                                        <SelectContent>
                                                                            <SelectItem value="FULL_TIME">
                                                                                Toàn
                                                                                thời
                                                                                gian
                                                                            </SelectItem>
                                                                            <SelectItem value="PART_TIME">
                                                                                Bán
                                                                                thời
                                                                                gian
                                                                            </SelectItem>
                                                                            <SelectItem value="CONTRACT">
                                                                                Hợp
                                                                                đồng
                                                                            </SelectItem>
                                                                            <SelectItem value="INTERN">
                                                                                Thực
                                                                                tập
                                                                            </SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={
                                                                form.control
                                                            }
                                                            name="employeeStatus"
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <FormItem>
                                                                    <FormLabel>
                                                                        Trạng
                                                                        thái
                                                                    </FormLabel>
                                                                    <Select
                                                                        onValueChange={
                                                                            field.onChange
                                                                        }
                                                                        value={
                                                                            field.value
                                                                        }
                                                                    >
                                                                        <FormControl>
                                                                            <SelectTrigger className="w-full">
                                                                                <SelectValue placeholder="Chọn trạng thái" />
                                                                            </SelectTrigger>
                                                                        </FormControl>
                                                                        <SelectContent>
                                                                            <SelectItem value="ACTIVE">
                                                                                Đang
                                                                                làm
                                                                                việc
                                                                            </SelectItem>
                                                                            <SelectItem value="ON_LEAVE">
                                                                                Nghỉ
                                                                                phép
                                                                            </SelectItem>
                                                                            <SelectItem value="RESIGNED">
                                                                                Đã
                                                                                nghỉ
                                                                                việc
                                                                            </SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <FormField
                                                            control={
                                                                form.control
                                                            }
                                                            name="hireDate"
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <FormItem>
                                                                    <FormLabel>
                                                                        Ngày
                                                                        vào
                                                                        làm
                                                                    </FormLabel>
                                                                    <FormControl>
                                                                        <DatePicker
                                                                            date={
                                                                                field.value
                                                                            }
                                                                            setDate={
                                                                                field.onChange
                                                                            }
                                                                        />
                                                                    </FormControl>
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={
                                                                form.control
                                                            }
                                                            name="probationEnd"
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <FormItem>
                                                                    <FormLabel>
                                                                        Ngày
                                                                        hết
                                                                        thử
                                                                        việc
                                                                    </FormLabel>
                                                                    <FormControl>
                                                                        <DatePicker
                                                                            date={
                                                                                field.value
                                                                            }
                                                                            setDate={
                                                                                field.onChange
                                                                            }
                                                                        />
                                                                    </FormControl>
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* ── Section 3: Liên hệ & Học vấn ── */}
                                        {activeSection ===
                                            "contact" && (
                                            <div className="space-y-4">
                                                <div>
                                                    <h3 className="text-base font-semibold">
                                                        Liên hệ & Học
                                                        vấn
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        Thông tin liên
                                                        lạc và trình
                                                        độ học vấn
                                                    </p>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <FormField
                                                            control={
                                                                form.control
                                                            }
                                                            name="phone"
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <FormItem>
                                                                    <FormLabel>
                                                                        Số
                                                                        điện
                                                                        thoại
                                                                        <span className="text-destructive">
                                                                            *
                                                                        </span>
                                                                    </FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            placeholder="Nhập số điện thoại"
                                                                            {...field}
                                                                        />
                                                                    </FormControl>
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={
                                                                form.control
                                                            }
                                                            name="personalEmail"
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <FormItem>
                                                                    <FormLabel>
                                                                        Email
                                                                        cá
                                                                        nhân
                                                                        <span className="text-destructive">
                                                                            *
                                                                        </span>
                                                                    </FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            type="email"
                                                                            placeholder="Nhập email"
                                                                            {...field}
                                                                        />
                                                                    </FormControl>
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>

                                                    <FormField
                                                        control={
                                                            form.control
                                                        }
                                                        name="address"
                                                        render={({
                                                            field,
                                                        }) => (
                                                            <FormItem>
                                                                <FormLabel>
                                                                    Địa
                                                                    chỉ
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Textarea
                                                                        placeholder="Nhập địa chỉ"
                                                                        {...field}
                                                                    />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={
                                                            form.control
                                                        }
                                                        name="university"
                                                        render={({
                                                            field,
                                                        }) => (
                                                            <FormItem>
                                                                <FormLabel>
                                                                    Trường
                                                                    học
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder="Nhập trường học"
                                                                        {...field}
                                                                    />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <FormField
                                                            control={
                                                                form.control
                                                            }
                                                            name="educationLevel"
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <FormItem>
                                                                    <FormLabel>
                                                                        Trình
                                                                        độ
                                                                    </FormLabel>
                                                                    <Select
                                                                        onValueChange={
                                                                            field.onChange
                                                                        }
                                                                        value={
                                                                            field.value
                                                                        }
                                                                    >
                                                                        <FormControl>
                                                                            <SelectTrigger className="w-full">
                                                                                <SelectValue placeholder="Chọn" />
                                                                            </SelectTrigger>
                                                                        </FormControl>
                                                                        <SelectContent>
                                                                            <SelectItem value="HIGHSCHOOL">
                                                                                THPT
                                                                            </SelectItem>
                                                                            <SelectItem value="COLLEGE">
                                                                                Cao
                                                                                đẳng
                                                                            </SelectItem>
                                                                            <SelectItem value="BACHELOR">
                                                                                Đại
                                                                                học
                                                                            </SelectItem>
                                                                            <SelectItem value="MASTER">
                                                                                Thạc
                                                                                sĩ
                                                                            </SelectItem>
                                                                            <SelectItem value="PHD">
                                                                                Tiến
                                                                                sĩ
                                                                            </SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </FormItem>
                                                            )}
                                                        />

                                                        <FormField
                                                            control={
                                                                form.control
                                                            }
                                                            name="major"
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <FormItem>
                                                                    <FormLabel>
                                                                        Chuyên
                                                                        ngành
                                                                    </FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            placeholder="Nhập chuyên ngành"
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

                                        {/* ── Section 4: Tài khoản ngân hàng ── */}
                                        {activeSection ===
                                            "banking" && (
                                            <div>
                                                <div>
                                                    <h3 className="text-base font-semibold">
                                                        Tài khoản ngân
                                                        hàng
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        Thông tin tài
                                                        khoản để nhận
                                                        lương và mã số
                                                        thuế
                                                    </p>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <FormField
                                                            control={
                                                                form.control
                                                            }
                                                            name="bankName"
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <FormItem>
                                                                    <FormLabel>
                                                                        Ngân
                                                                        hàng
                                                                    </FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            placeholder="Vietcombank"
                                                                            {...field}
                                                                        />
                                                                    </FormControl>
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={
                                                                form.control
                                                            }
                                                            name="bankAccount"
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <FormItem>
                                                                    <FormLabel>
                                                                        Số
                                                                        tài
                                                                        khoản
                                                                    </FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            placeholder="1234567890"
                                                                            {...field}
                                                                        />
                                                                    </FormControl>
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <FormField
                                                            control={
                                                                form.control
                                                            }
                                                            name="taxCode"
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <FormItem>
                                                                    <FormLabel>
                                                                        Mã
                                                                        số
                                                                        thuế
                                                                    </FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            placeholder="1234567890"
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

                                    {/* Footer navigation — always visible at bottom */}
                                    <div className="flex items-center justify-between pt-3 pb-2 px-6 shrink-0 border-t bg-background">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={
                                                handlePrevSection
                                            }
                                            disabled={
                                                isFirstSection ||
                                                isPending
                                            }
                                            className={cn(
                                                isFirstSection &&
                                                    "invisible",
                                            )}
                                        >
                                            <ArrowLeft className="h-4 w-4" />
                                            Trước
                                        </Button>

                                        {/* Section dots */}
                                        <div className="flex items-center gap-1.5">
                                            {SECTIONS.map((s) => (
                                                <button
                                                    key={s.key}
                                                    onClick={() =>
                                                        setActiveSection(
                                                            s.key,
                                                        )
                                                    }
                                                    className={`h-2 rounded-full transition-all ${
                                                        activeSection ===
                                                        s.key
                                                            ? "w-5 bg-primary"
                                                            : "w-2 bg-muted-foreground/30"
                                                    }`}
                                                    title={s.label}
                                                />
                                            ))}
                                        </div>

                                        {isLastSection ? (
                                            <Button
                                                type="submit"
                                                size="sm"
                                                disabled={isPending}
                                            >
                                                {isPending ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        Đang lưu...
                                                    </>
                                                ) : (
                                                    "Tạo nhân viên"
                                                )}
                                            </Button>
                                        ) : (
                                            <Button
                                                type="button"
                                                size="sm"
                                                onClick={
                                                    handleNextSection
                                                }
                                                disabled={isPending}
                                                className="gap-1"
                                            >
                                                Tiếp theo
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
