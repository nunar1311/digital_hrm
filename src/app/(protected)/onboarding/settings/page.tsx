import { Metadata } from "next";
import { SettingsClient } from "./settings-client";

export const metadata: Metadata = {
  title: "Cài đặt Onboarding | Digital HRM",
  description: "Quản lý template tiếp nhận nhân sự",
};

export default function OnboardingSettingsPage() {
  return <SettingsClient />;
}
