import type { Metadata } from "next";
import { getDepartments, getDepartmentStats } from "./actions";
import { DepartmentsClient } from "./departments-client";

export const metadata: Metadata = {
    title: "Quản lý phòng ban | Digital HRM",
};

export default async function DepartmentsPage() {
    return <DepartmentsClient />;
}
