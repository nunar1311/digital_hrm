import { Metadata } from "next";
import { OnboardingClient } from "./onboarding-client";
import { getOnboardings, getOnboardingStats } from "./actions";
import { requirePermission } from "@/lib/auth-session";
import { Permission } from "@/lib/rbac/permissions";

export const metadata: Metadata = {
  title: "Tiếp nhận nhân sự",
  description: "Quản lý quy trình tiếp nhận nhân viên mới vào công ty",
};

export default async function OnboardingPage() {
  await requirePermission(Permission.ONBOARDING_VIEW);

  const [onboardingsData, statsData] = await Promise.all([
    getOnboardings({ page: 1, pageSize: 100 }),
    getOnboardingStats(),
  ]);

  return (
    <OnboardingClient
      initialOnboardings={JSON.parse(JSON.stringify(onboardingsData))}
      initialStats={statsData}
    />
  );
}
