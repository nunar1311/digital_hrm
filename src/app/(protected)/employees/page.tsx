import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Danh sách nhân viên | Digital HRM",
};

export default function EmployeesPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">
                Danh sách nhân viên
            </h1>
            {/* TODO: Employee data table with search, filter, pagination */}
        </div>
    );
}
