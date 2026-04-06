import { Metadata } from "next";
import { ESSAssetsClient } from "./assets-client";
import { requireAuth } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
    title: "Tài sản được giao | Cổng nhân viên - Digital HRM",
    description: "Xem danh sách tài sản và thiết bị được cấp phát",
};

export default async function ESSAssetsPage() {
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
        category: a.asset.category || "Không phân loại",
        serialNumber: a.asset.serialNumber,
        purchaseDate: a.asset.purchaseDate?.toISOString() || null,
        assignedAt: a.assignDate.toISOString(),
        condition: a.condition || "Tốt",
        notes: a.notes,
        assignedByName: a.assignedBy ? assignerMap.get(a.assignedBy) || "HCNS" : "HCNS",
        brand: a.asset.brand,
        model: a.asset.model,
        location: a.asset.location,
    }));

    return <ESSAssetsClient initialAssets={transformedAssets} />;
}
