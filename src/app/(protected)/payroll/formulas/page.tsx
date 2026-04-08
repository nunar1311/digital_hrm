import type { Metadata } from "next";
import { getAllSalaryComponentTypes, getPayrollFormulas } from "../actions";
import FormulasClient from "./formulas-client";

export const metadata: Metadata = {
  title: "Cấu hình lương | Digital HRM",
  description: "Quản lý cấu trúc lương, phụ cấp, thưởng",
};

export default async function FormulasPage() {
  const componentTypes = await getAllSalaryComponentTypes();
  let formulas: unknown[] = [];

  try {
    formulas = await getPayrollFormulas();
  } catch {
    formulas = [];
  }

  return (
    <FormulasClient
      initialData={JSON.parse(JSON.stringify(componentTypes))}
      initialFormulas={JSON.parse(JSON.stringify(formulas))}
    />
  );
}
