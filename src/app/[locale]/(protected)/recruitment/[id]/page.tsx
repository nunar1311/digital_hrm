import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { RecruitmentDetailClient } from "./recruitment-detail-client";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("ProtectedPages");
    return {
        title: t("recruitmentDetailMetadataTitle"),
    };
}

export default async function RecruitmentDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    return <RecruitmentDetailClient jobPostingId={id} />;
}
