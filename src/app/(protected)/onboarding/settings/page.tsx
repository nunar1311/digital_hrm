import { Metadata } from "next";
import { SettingsClient } from "./settings-client";

export const metadata: Metadata = {
  title: "Thiết lập Onboarding",
  description: "Quản lý template tiếp nhận nhân sự",
};

export default function OnboardingSettingsPage() {
  return <SettingsClient />;
}
