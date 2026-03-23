import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
    getPayrollRecord,
    getPayslips,
    getDepartmentsForPayroll,
} from "@/app/(protected)/payroll/actions";
import PayrollDetailClient from "./payroll-detail-client";

export const metadata: Metadata = {
    title: "Chi tiết bảng lương",
    description: "Xem chi tiết và quản lý bảng lương",
};

interface PayrollDetailPageProps {
    params: Promise<{ id: string }>;
}

export default async function PayrollDetailPage({ params }: PayrollDetailPageProps) {
    const { id } = await params;

    const [record, payslips, departments] = await Promise.all([
        getPayrollRecord(id),
        getPayslips({}),
        getDepartmentsForPayroll(),
    ]);

    if (!record) {
        notFound();
    }

    return (
        <PayrollDetailClient
            recordId={id}
            initialRecord={record}
            initialPayslips={payslips}
            departments={departments}
        />
    );
}
