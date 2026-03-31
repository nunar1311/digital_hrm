import { Metadata } from "next";
import { ESSProfileClient } from "./profile-client";
import { getEmployeeProfile } from "../actions";

export const metadata: Metadata = {
    title: "Hồ sơ cá nhân | Cổng nhân viên - Digital HRM",
    description: "Xem và cập nhật thông tin cá nhân của bạn",
};

export default async function ESSProfilePage() {
    const profile = await getEmployeeProfile();
    
    return <ESSProfileClient initialProfile={profile} />;
}
