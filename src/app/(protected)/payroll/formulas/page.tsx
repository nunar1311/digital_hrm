import type { Metadata } from "next";
import { getAllSalaryComponentTypes } from "../actions";
import FormulasClient from "./formulas-client";

export const metadata: Metadata = {
    title: "Cấu hình lương | Digital HRM",
    description: "Quản lý cấu trúc lương, phụ cấp, thưởng",
};

export default async function FormulasPage() {
    const componentTypes = await getAllSalaryComponentTypes();

    return <FormulasClient initialData={JSON.parse(JSON.stringify(componentTypes))} />;
}
