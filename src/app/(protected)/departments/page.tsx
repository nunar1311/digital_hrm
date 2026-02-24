import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Quản lý phòng ban | Digital HRM",
};

export default function DepartmentsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">
                Quản lý phòng ban
            </h1>
            {/* TODO: Department CRUD, tree view */}
        </div>
    );
}
