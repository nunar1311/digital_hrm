import type { Metadata } from "next";
import { getEmployeeProfile, getMyProfileRequests } from "../actions";
import { ProfileClient } from "./profile-client";
import { requireAuth } from "@/lib/auth-session";

export const metadata: Metadata = {
  title: "Hồ sơ cá nhân | Digital HRM",
};

export default async function ESSProfilePage() {
  await requireAuth();

  const profile = await getEmployeeProfile();
  const requests = await getMyProfileRequests();

  if (!profile) {
    return <div className="p-6">Không tìm thấy thông tin hồ sơ.</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Hồ sơ cá nhân</h1>
      <ProfileClient profile={profile} requests={requests} />
    </div>
  );
}
