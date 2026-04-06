import type { Metadata } from "next";
import { RecruitmentDetailClient } from "./recruitment-detail-client";

export const metadata: Metadata = {
    title: "Chi tiết vị trí tuyển dụng | Digital HRM",
};

export default async function RecruitmentDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    return <RecruitmentDetailClient jobPostingId={id} />;
}
