// =============================================================================
// ImportPreviewTable — Shows parsed Excel data with validation highlighting
// =============================================================================

"use client";

import { useState, useMemo } from 'react';
import { CheckCircle2, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { ValidationResult } from '@/lib/excel-utils';

interface ImportPreviewTableProps {
    headers: string[];
    rows: Record<string, unknown>[];
    validation: ValidationResult;
}

const ROWS_PER_PAGE = 10;

export function ImportPreviewTable({ headers, rows, validation }: ImportPreviewTableProps) {
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(rows.length / ROWS_PER_PAGE);
    const paginatedRows = useMemo(() => {
        const start = (currentPage - 1) * ROWS_PER_PAGE;
        return rows.slice(start, start + ROWS_PER_PAGE);
    }, [rows, currentPage]);

    // Build a set of invalid row indices (0-based in original rows array)
    const invalidRowIndices = useMemo(() => {
        const indices = new Set<number>();
        validation.errors.forEach((err) => {
            // err.row is Excel row (2-based), convert to 0-based array index
            indices.add(err.row - 2);
        });
        return indices;
    }, [validation.errors]);

    // Map from row index → list of error fields
    const errorFieldsByRow = useMemo(() => {
        const map = new Map<number, string[]>();
        validation.errors.forEach((err) => {
            const idx = err.row - 2;
            if (!map.has(idx)) map.set(idx, []);
            map.get(idx)!.push(err.field);
        });
        return map;
    }, [validation.errors]);

    const handleSimulateImport = () => {
        if (validation.validRows.length === 0) {
            toast.error('Không có bản ghi hợp lệ để nhập');
            return;
        }
        toast.success(
            `Đã nhập ${validation.validRows.length} bản ghi thành công! (Demo — không lưu vào hệ thống)`,
        );
    };

    // Limit display columns to 8 to avoid horizontal overflow
    const displayHeaders = headers.slice(0, 8);
    const hasMoreCols = headers.length > 8;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <CardTitle className="text-lg">Xem trước dữ liệu</CardTitle>
                        <CardDescription className="mt-1">
                            {rows.length} bản ghi · {displayHeaders.length} cột
                            {hasMoreCols && ` (hiển thị ${displayHeaders.length}/${headers.length})`}
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Badge variant="default" className="gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                {validation.validRows.length} hợp lệ
                            </Badge>
                            {validation.errors.length > 0 && (
                                <Badge variant="destructive" className="gap-1">
                                    <XCircle className="h-3 w-3" />
                                    {validation.invalidRows.length} lỗi
                                </Badge>
                            )}
                        </div>
                        <Button
                            onClick={handleSimulateImport}
                            disabled={validation.validRows.length === 0}
                            size="sm"
                        >
                            Nhập dữ liệu
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                <div className="rounded-md border overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12 text-center">#</TableHead>
                                <TableHead className="w-16 text-center">Trạng thái</TableHead>
                                {displayHeaders.map((header) => (
                                    <TableHead key={header} className="whitespace-nowrap">
                                        {header}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedRows.map((row, pageIdx) => {
                                const globalIdx = (currentPage - 1) * ROWS_PER_PAGE + pageIdx;
                                const isInvalid = invalidRowIndices.has(globalIdx);
                                const errorFields = errorFieldsByRow.get(globalIdx) || [];

                                return (
                                    <TableRow
                                        key={globalIdx}
                                        className={cn(
                                            isInvalid && 'bg-destructive/5 hover:bg-destructive/10',
                                        )}
                                    >
                                        <TableCell className="text-center text-xs text-muted-foreground font-mono">
                                            {globalIdx + 2}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {isInvalid ? (
                                                <XCircle className="h-4 w-4 text-destructive mx-auto" />
                                            ) : (
                                                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mx-auto" />
                                            )}
                                        </TableCell>
                                        {displayHeaders.map((header) => {
                                            const isErrorField = errorFields.includes(header);
                                            const value = row[header];
                                            return (
                                                <TableCell
                                                    key={header}
                                                    className={cn(
                                                        'whitespace-nowrap max-w-[200px] truncate',
                                                        isErrorField && 'text-destructive font-medium ring-1 ring-destructive/30 rounded',
                                                    )}
                                                >
                                                    {value != null ? String(value) : (
                                                        <span className="text-muted-foreground italic text-xs">—</span>
                                                    )}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                );
                            })}

                            {paginatedRows.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={displayHeaders.length + 2} className="text-center py-8">
                                        <p className="text-muted-foreground">Không có dữ liệu</p>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-muted-foreground">
                            Trang {currentPage} / {totalPages}
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Trước
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                            >
                                Sau
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
