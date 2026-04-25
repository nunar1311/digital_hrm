import { JobPostingsClient } from "@/components/recruitment/job-postings";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quản lý Tin tuyển dụng",
  description: "Quản lý tin tuyển dụng",
};

export default function JobPostingsPage() {
  return <JobPostingsClient />;
}
