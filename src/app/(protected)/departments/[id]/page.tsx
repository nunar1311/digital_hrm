import { notFound } from "next/navigation";
import { getDepartmentById } from "@/app/(protected)/departments/actions";
import { DepartmentEmployeesClient } from "./department-employees-client";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Nhân viên phòng ban",
};

interface DepartmentEmployeesPageProps {
    params: Promise<{ id: string }>;
}

export default async function DepartmentEmployeesPage({
    params,
}: DepartmentEmployeesPageProps) {
    const { id } = await params;

    if (!id) {
        notFound();
    }

    const department = await getDepartmentById(id);

    if (!department) {
        notFound();
    }

    return (
        <DepartmentEmployeesClient
            departmentId={department.id}
            departmentName={department.name}
        />
    );
}
