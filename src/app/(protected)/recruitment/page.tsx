import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth-session";
import { Permission } from "@/lib/rbac/permissions";
import { RecruitmentClient } from "./recruitment-client";

export const metadata = {
  title: "Tuyển dụng",
  description: "Quản lý tuyển dụng, ứng viên và lịch phỏng vấn",
};

export default async function RecruitmentPage() {
  await requirePermission(Permission.RECRUITMENT_VIEW);

  return <RecruitmentClient />;
}
