import { redirect } from "next/navigation";
import { getDepartmentById } from "@/app/(protected)/departments/actions";
import { DepartmentEmployeesClient } from "./department-employees-client";

export async function generateMetadata({
  params,
}: DepartmentEmployeesPageProps) {
  const resolvedParams = await params;
  const department = await getDepartmentById(resolvedParams.id);
  if (!department) return { title: "Quản lý phòng ban" };
  return {
    title: `${department.name}`,
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
    redirect("/departments");
  }

  const department = await getDepartmentById(id);

  if (!department) {
    redirect("/departments");
  }

  return (
    <DepartmentEmployeesClient
      departmentId={department.id}
      departmentName={department.name}
    />
  );
}
