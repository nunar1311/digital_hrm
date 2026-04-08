import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getDepartmentById } from "@/app/[locale]/(protected)/departments/actions";
import { DepartmentEmployeesClient } from "./department-employees-client";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("ProtectedPages");
    return {
        title: t("departmentEmployeesPageTitle"),
    };
}

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

