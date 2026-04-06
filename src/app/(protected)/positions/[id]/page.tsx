import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getPositionById } from "@/app/(protected)/positions/actions";
import { PositionDetailClient } from "./position-detail-client";

interface PositionDetailPageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({
    params,
}: PositionDetailPageProps): Promise<Metadata> {
    const { id } = await params;
    const position = await getPositionById(id);
    if (!position) return { title: "Không tìm thấy - Digital HRM" };
    return {
        title: `${position.name} - Chi tiết chức vụ | Digital HRM`,
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
