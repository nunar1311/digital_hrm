import { Metadata } from "next";
import { ESSContractsClient } from "./contracts-client";
import { requireAuth } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
    title: "Hợp đồng lao động | Cổng nhân viên - Digital HRM",
    description: "Xem thông tin hợp đồng lao động của bạn",
};

export default async function ESSContractsPage() {
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
        typeName: c.contractType?.name || "Hợp đồng lao động",
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
