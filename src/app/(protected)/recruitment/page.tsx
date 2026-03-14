import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth-session";
import { Permission } from "@/lib/rbac/permissions";
import { RecruitmentClient } from "./recruitment-client";

export default async function RecruitmentPage() {
    await requirePermission(Permission.RECRUITMENT_VIEW);

    return <RecruitmentClient />;
}
