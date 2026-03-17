import type { Metadata } from "next";
import { getPayrollRecords, getDepartmentsForPayroll } from "./actions";
import PayrollClient from "./payroll-client";

export const metadata: Metadata = {
    title: "Bảng lương",
    description: "Quản lý và tính lương nhân viên",
};

export default async function PayrollPage() {
    const [records, departments] = await Promise.all([
        getPayrollRecords(),
        getDepartmentsForPayroll(),
    ]);

    return (
        <PayrollClient
            initialRecords={records}
            departments={departments}
        />
    );
}
