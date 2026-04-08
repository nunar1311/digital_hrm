import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getPositionById } from "@/app/[locale]/(protected)/positions/actions";
import { PositionDetailClient } from "./position-detail-client";

interface PositionDetailPageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({
    params,
}: PositionDetailPageProps): Promise<Metadata> {
    const { id } = await params;
    const position = await getPositionById(id);
    const t = await getTranslations("ProtectedPages");

    if (!position) {
        return { title: t("positionsDetailNotFoundTitle") };
    }

    return {
        title: t("positionsDetailPageTitle", { name: position.name }),
    };
}

export default async function PositionDetailPage({
    params,
}: PositionDetailPageProps) {
    const { id } = await params;

    if (!id) {
        notFound();
    }

    const position = await getPositionById(id);

    if (!position) {
        notFound();
    }

    return <PositionDetailClient position={position} />;
}

