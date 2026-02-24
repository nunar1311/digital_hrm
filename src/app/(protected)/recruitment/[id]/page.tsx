import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Chi tiết vị trí tuyển dụng | Digital HRM",
};

export default async function RecruitmentDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">
                Vị trí tuyển dụng #{id}
            </h1>
            {/* TODO: Applicant pipeline, interview scheduling */}
        </div>
    );
}
