import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ESSAssetsClient } from "./assets-client";
import { requireAuth } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "ProtectedPages" });

    return {
        title: `${t("essAssetsMetadataTitle")} | Digital HRM`,
        description: t("essAssetsMetadataDescription"),
    };
}

export default async function ESSAssetsPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "ProtectedPages" });
    const session = await requireAuth();

    // Get user's assigned assets
    const assets = await prisma.assetAssignment.findMany({
        where: {
            userId: session.user.id,
            status: { in: ["ASSIGNED", "ACTIVE"] },
        },
        include: {
            asset: true,
        },
        orderBy: {
            assignDate: "desc",
        },
    });

    // Get assigner names
    const assignerIds = [...new Set(assets.map((a) => a.assignedBy).filter(Boolean))] as string[];
    const assigners = await prisma.user.findMany({
        where: { id: { in: assignerIds } },
        select: { id: true, name: true },
    });
    const assignerMap = new Map(assigners.map((u) => [u.id, u.name]));

    // Transform data
    const transformedAssets = assets.map((a) => ({
        id: a.id,
        assetId: a.asset.id,
        name: a.asset.name,
        code: a.asset.code,
        category: a.asset.category || t("essAssetsFallbackUncategorized"),
        serialNumber: a.asset.serialNumber,
        purchaseDate: a.asset.purchaseDate?.toISOString() || null,
        assignedAt: a.assignDate.toISOString(),
        condition: a.condition || t("essAssetsFallbackGoodCondition"),
        notes: a.notes,
        assignedByName: a.assignedBy
            ? assignerMap.get(a.assignedBy) || t("essAssetsFallbackAdmin")
            : t("essAssetsFallbackAdmin"),
        brand: a.asset.brand,
        model: a.asset.model,
        location: a.asset.location,
    }));

    return <ESSAssetsClient initialAssets={transformedAssets} />;
}
