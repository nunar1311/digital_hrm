import { Metadata } from "next";
import { EmployeesClient } from "./employees-client";

export const metadata: Metadata = {
  title: "Tất cả nhân viên",
  description: "Danh sách tất cả nhân viên",
};

export default function EmployeesPage() {
  return <EmployeesClient />;
}
