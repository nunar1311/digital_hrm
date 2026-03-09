// =============================================================================
// FileDropzone — Drag-and-drop Excel upload component
// =============================================================================

"use client";

import { useState, useRef, useCallback } from 'react';
import { Upload, FileSpreadsheet, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { parseExcelFile, type ParsedImportResult } from '@/lib/excel-utils';
import { cn } from '@/lib/utils';

interface FileDropzoneProps {
    onFileParsed: (result: ParsedImportResult) => void;
    onClear: () => void;
    isLoading?: boolean;
}

const ACCEPTED_TYPES = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv', // .csv
];

const ACCEPTED_EXTENSIONS = ['.xlsx', '.xls', '.csv'];

function isValidFile(file: File): boolean {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    return ACCEPTED_TYPES.includes(file.type) || ACCEPTED_EXTENSIONS.includes(ext);
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileDropzone({ onFileParsed, onClear, isLoading }: FileDropzoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isParsing, setIsParsing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const processFile = useCallback(async (file: File) => {
        if (!isValidFile(file)) {
            toast.error('Định dạng file không đúng. Vui lòng sử dụng file .xlsx, .xls hoặc .csv');
            return;
        }

        setSelectedFile(file);
        setIsParsing(true);

        try {
            const result = await parseExcelFile(file);
            toast.success(`Đã đọc ${result.rows.length} bản ghi từ file`);
            onFileParsed(result);
        } catch (err) {
            const error = err as Error;
            if (error.message === 'EMPTY_FILE') {
                toast.warning('File không chứa dữ liệu');
            } else if (error.message === 'PARSE_ERROR') {
                toast.error('Lỗi khi đọc file. Vui lòng kiểm tra định dạng file.');
            } else {
                toast.error('Không thể đọc file. Vui lòng kiểm tra lại.');
            }
            setSelectedFile(null);
        } finally {
            setIsParsing(false);
        }
    }, [onFileParsed]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
    }, [processFile]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
        // Reset input so same file can be re-selected
        if (inputRef.current) inputRef.current.value = '';
    }, [processFile]);

    const handleClear = useCallback(() => {
        setSelectedFile(null);
        onClear();
    }, [onClear]);

    return (
        <Card
            className={cn(
                'border-2 border-dashed transition-all duration-200 cursor-pointer',
                isDragging
                    ? 'border-primary bg-primary/5 scale-[1.01]'
                    : selectedFile
                        ? 'border-green-500/50 bg-green-50 dark:bg-green-950/20'
                        : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50',
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !selectedFile && inputRef.current?.click()}
        >
            <CardContent className="flex flex-col items-center justify-center py-10 gap-4">
                <input
                    ref={inputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleInputChange}
                    className="hidden"
                    aria-label="Chọn file Excel để nhập"
                    id="excel-file-input"
                />

                {isParsing || isLoading ? (
                    <>
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
                        <p className="text-sm text-muted-foreground">Đang xử lý file...</p>
                    </>
                ) : selectedFile ? (
                    <>
                        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-background border">
                            <FileSpreadsheet className="h-8 w-8 text-green-600 dark:text-green-400 shrink-0" />
                            <div className="min-w-0">
                                <p className="font-medium text-sm truncate">{selectedFile.name}</p>
                                <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="shrink-0 h-8 w-8"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleClear();
                                }}
                                aria-label="Xóa file đã chọn"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">Nhấn vào nút × để chọn file khác</p>
                    </>
                ) : (
                    <>
                        <div className={cn(
                            'rounded-full p-4 transition-colors',
                            isDragging
                                ? 'bg-primary/10 text-primary'
                                : 'bg-muted text-muted-foreground',
                        )}>
                            <Upload className="h-8 w-8" />
                        </div>
                        <div className="text-center">
                            <p className="font-medium">
                                Kéo thả file vào đây hoặc{' '}
                                <span className="text-primary underline underline-offset-4">chọn file</span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Hỗ trợ: .xlsx, .xls, .csv
                            </p>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
