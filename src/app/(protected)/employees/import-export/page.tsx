// =============================================================================
// Import/Export Excel Page — /employees/import-export
// =============================================================================

"use client";

import { useState, useCallback } from "react";
import {
    FileUp,
    FileDown,
    Users,
    FileSpreadsheet,
    Info,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileDropzone } from "@/components/employees/import-export/file-dropzone";
import { ImportPreviewTable } from "@/components/employees/import-export/import-preview-table";
import { ValidationErrorPanel } from "@/components/employees/import-export/validation-error-panel";
import { ExportButton } from "@/components/employees/import-export/export-button";
import {
    validateImportedRows,
    type ParsedImportResult,
    type ValidationResult,
} from "@/lib/excel-utils";

const mockEmployees = [
    {
        id: "1",
        name: "Nguyễn Văn A",
        email: "nguyenvana@example.com",
        phone: "0909090909",
    },
];

export default function ImportExportPage() {
    const [parsedData, setParsedData] =
        useState<ParsedImportResult | null>(null);
    const [validation, setValidation] =
        useState<ValidationResult | null>(null);

    const handleFileParsed = useCallback(
        (result: ParsedImportResult) => {
            setParsedData(result);
            const validationResult = validateImportedRows(
                result.rows,
            );
            setValidation(validationResult);
        },
        [],
    );

    const handleClear = useCallback(() => {
        setParsedData(null);
        setValidation(null);
    }, []);

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">
                    Nhập / Xuất Dữ liệu Nhân viên
                </h1>
                <p className="text-muted-foreground mt-1">
                    Nhập dữ liệu nhân viên từ file Excel hoặc xuất
                    danh sách hiện tại ra file
                </p>
            </div>

            {/* Main Content — Two sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ── Import Section ── */}
                <div className="flex flex-col gap-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <div className="rounded-lg bg-blue-100 dark:bg-blue-950 p-2">
                                    <FileUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">
                                        Nhập dữ liệu
                                    </CardTitle>
                                    <CardDescription>
                                        Tải lên file Excel để nhập
                                        nhân viên mới
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <FileDropzone
                                onFileParsed={handleFileParsed}
                                onClear={handleClear}
                            />

                            {/* Format hint */}
                            <div className="mt-4 flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2.5">
                                <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                <div className="text-xs text-muted-foreground space-y-1">
                                    <p>
                                        <strong>Yêu cầu:</strong> File
                                        phải chứa cột{" "}
                                        <code className="bg-background px-1 rounded">
                                            Mã nhân viên
                                        </code>{" "}
                                        và{" "}
                                        <code className="bg-background px-1 rounded">
                                            Họ và tên
                                        </code>
                                    </p>
                                    <p>
                                        Các cột khác: Ngày sinh, Giới
                                        tính, SĐT, Email, Phòng ban,
                                        Chức vụ, Ngày vào làm, Trạng
                                        thái
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ── Export Section ── */}
                <div className="flex flex-col gap-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <div className="rounded-lg bg-green-100 dark:bg-green-950 p-2">
                                    <FileDown className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">
                                        Xuất dữ liệu
                                    </CardTitle>
                                    <CardDescription>
                                        Tải xuống danh sách nhân viên
                                        dạng Excel
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Summary stats */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-lg border bg-background p-4 flex items-center gap-3">
                                    <div className="rounded-full bg-primary/10 p-2">
                                        <Users className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">
                                            {mockEmployees.length}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Tổng nhân viên
                                        </p>
                                    </div>
                                </div>
                                <div className="rounded-lg border bg-background p-4 flex items-center gap-3">
                                    <div className="rounded-full bg-green-100 dark:bg-green-950 p-2">
                                        <FileSpreadsheet className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">
                                            16
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Cột xuất ra
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Columns included */}
                            <div>
                                <p className="text-sm font-medium mb-2">
                                    Các cột sẽ xuất:
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {[
                                        "Mã NV",
                                        "Họ tên",
                                        "Ngày sinh",
                                        "Giới tính",
                                        "SĐT",
                                        "Email",
                                        "Địa chỉ",
                                        "Phòng ban",
                                        "Chức vụ",
                                        "Loại hình",
                                        "Ngày vào",
                                        "Trạng thái",
                                        "Ngân hàng",
                                        "Số TK",
                                        "Trình độ",
                                        "Trường",
                                    ].map((col) => (
                                        <Badge
                                            key={col}
                                            variant="secondary"
                                            className="text-xs"
                                        >
                                            {col}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            <Separator />

                            {/* <ExportButton employees={mockEmployees} /> */}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* ── Import Preview (below, full width) ── */}
            {parsedData && validation && (
                <div className="space-y-4">
                    <Separator />
                    <ValidationErrorPanel
                        errors={validation.errors}
                    />
                    <ImportPreviewTable
                        headers={parsedData.headers}
                        rows={parsedData.rows}
                        validation={validation}
                    />
                </div>
            )}
        </div>
    );
}
