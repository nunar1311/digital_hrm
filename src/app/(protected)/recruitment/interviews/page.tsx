import { InterviewsClient } from "@/components/recruitment/interviews";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quản lý Phỏng vấn",
  description: "Quản lý lịch phỏng vấn",
};

export default function RecruitmentInterviewsPage() {
    return <InterviewsClient />;
}
