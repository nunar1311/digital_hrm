import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ESSContractsClient } from "./contracts-client";
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
        title: `${t("essContractsMetadataTitle")} | Digital HRM`,
        description: t("essContractsMetadataDescription"),
    };
}

export default async function ESSContractsPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "ProtectedPages" });
    const session = await requireAuth();

    // Get user's contracts
    const contracts = await prisma.contract.findMany({
        where: {
            userId: session.user.id,
        },
        include: {
            contractType: true,
        },
        orderBy: {
            startDate: "desc",
        },
    });

    // Transform data
    const transformedContracts = contracts.map((c) => ({
        id: c.id,
        contractNumber: c.contractNumber,
        title: c.title,
        typeName: c.contractType?.name || t("essContractsFallbackContractType"),
        typeDuration: c.contractType?.durationMonths || null,
        startDate: c.startDate.toISOString(),
        endDate: c.endDate?.toISOString() || null,
        status: c.status,
        salary: c.salary,
        currency: c.currency || "VND",
        probationSalary: c.probationSalary,
        signedDate: c.signedDate?.toISOString() || null,
        fileUrl: c.fileUrl,
        notes: c.notes,
    }));

    return <ESSContractsClient initialContracts={transformedContracts} />;
}
