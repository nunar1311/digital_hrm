// =============================================================================
// ExportButton — Triggers Excel download of employee data
// =============================================================================

"use client";

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { exportEmployeesToExcel } from '@/lib/excel-utils';
import type { Employee } from '@/types';

interface ExportButtonProps {
    employees: Employee[];
    filename?: string;
}

export function ExportButton({ employees, filename = 'danh-sach-nhan-vien' }: ExportButtonProps) {
    const [isExporting, setIsExporting] = useState(false);
    const t = useTranslations('ProtectedPages');

    const handleExport = async () => {
        if (employees.length === 0) {
            toast.warning(t('employeesExportNoData'));
            return;
        }

        setIsExporting(true);

        try {
            // Small delay for UX feedback
            await new Promise((resolve) => setTimeout(resolve, 300));
            await exportEmployeesToExcel(employees, filename);
            toast.success(t('employeesExportSuccess', { count: employees.length }));
        } catch {
            toast.error(t('employeesExportError'));
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Button
            onClick={handleExport}
            disabled={isExporting || employees.length === 0}
            className="gap-2"
            id="export-excel-button"
        >
            {isExporting ? (
                <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                    {t('employeesExportLoading')}
                </>
            ) : (
                <>
                    <Download className="h-4 w-4" />
                    {t('employeesExportExcel')}
                </>
            )}
        </Button>
    );
}
