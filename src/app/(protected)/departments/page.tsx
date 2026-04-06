import type { Metadata } from "next";
import { DepartmentsClient } from "./departments-client";

export const metadata: Metadata = {
  title: "Quản lý phòng ban",
};

export default async function DepartmentsPage() {
  return <DepartmentsClient />;
}
