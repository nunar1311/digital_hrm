import { CandidatesClient } from "@/components/recruitment/candidates";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quản lý ứng viên",
  description: "Quản lý ứng viên",
};

const page = () => {
  return <CandidatesClient />;
};

export default page;
