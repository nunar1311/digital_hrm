import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notification";
import { sendTemplatedEmail } from "@/lib/email";
import { NOTIFICATION_TYPES } from "@/lib/types/notification";

const ALERT_RECIPIENT_ROLES = ["HR_MANAGER", "HR_STAFF", "DIRECTOR"] as const;

function startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

function endOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
}

function formatDate(value: Date): string {
    return value.toLocaleDateString("vi-VN");
}

export interface ExpiringContractItem {
    contractId: string;
    contractNumber: string;
    contractTitle: string;
    endDate: Date;
    employeeId: string;
    employeeName: string;
    username: string | null;
    daysUntilExpiry: number;
}

export async function findExpiringContracts(daysUntilExpiry: number): Promise<
    ExpiringContractItem[]
> {
    const now = new Date();
    const target = new Date(now);
    target.setDate(target.getDate() + daysUntilExpiry);

    const contracts = await prisma.contract.findMany({
        where: {
            status: { in: ["ACTIVE", "PENDING"] },
            endDate: {
                gte: startOfDay(target),
                lte: endOfDay(target),
            },
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    username: true,
                },
            },
        },
        orderBy: [{ endDate: "asc" }, { contractNumber: "asc" }],
    });

    return contracts
        .filter((contract) => contract.endDate)
        .map((contract) => ({
            contractId: contract.id,
            contractNumber: contract.contractNumber,
            contractTitle: contract.title,
            endDate: contract.endDate as Date,
            employeeId: contract.user.id,
            employeeName: contract.user.name,
            username: contract.user.username,
            daysUntilExpiry,
        }));
}

export interface ContractReminderDispatchResult {
    processedContracts: number;
    createdDispatches: number;
    skippedDispatches: number;
}

export async function dispatchContractExpiryReminders(params?: {
    days?: Array<15 | 30>;
    source?: "scheduler" | "page_open" | "manual";
}): Promise<ContractReminderDispatchResult> {
    const days = params?.days ?? [15, 30];
    const source = params?.source ?? "manual";

    const recipients = await prisma.user.findMany({
        where: {
            hrmRole: {
                in: [...ALERT_RECIPIENT_ROLES],
            },
        },
        select: {
            id: true,
            name: true,
            email: true,
        },
    });

    if (recipients.length === 0) {
        return {
            processedContracts: 0,
            createdDispatches: 0,
            skippedDispatches: 0,
        };
    }

    let processedContracts = 0;
    let createdDispatches = 0;
    let skippedDispatches = 0;

    for (const dayMark of days) {
        const expiringContracts = await findExpiringContracts(dayMark);
        processedContracts += expiringContracts.length;

        for (const contract of expiringContracts) {
            for (const recipient of recipients) {
                let dispatched = false;
                try {
                    await prisma.contractExpiryDispatch.create({
                        data: {
                            contractId: contract.contractId,
                            recipientId: recipient.id,
                            reminderDays: dayMark,
                            contractEndDate: contract.endDate,
                            source,
                        },
                    });
                    dispatched = true;
                    createdDispatches += 1;
                } catch (error) {
                    if (
                        error instanceof Prisma.PrismaClientKnownRequestError &&
                        error.code === "P2002"
                    ) {
                        skippedDispatches += 1;
                        continue;
                    }
                    throw error;
                }

                if (!dispatched) {
                    continue;
                }

                const title = `Cảnh báo hợp đồng sắp hết hạn (${dayMark} ngày)`;
                const content = `${contract.employeeName} (${contract.username || "N/A"}) có hợp đồng ${contract.contractNumber} sẽ hết hạn vào ${formatDate(contract.endDate)}.`;
                const link = `/contracts/${contract.contractId}`;

                await createNotification({
                    userId: recipient.id,
                    type: NOTIFICATION_TYPES.CONTRACT,
                    title,
                    content,
                    link,
                    priority: dayMark === 15 ? "URGENT" : "HIGH",
                });

                if (recipient.email) {
                    await sendTemplatedEmail(recipient.email, "CONTRACT_EXPIRY", {
                        employeeName: contract.employeeName,
                        expiryDate: formatDate(contract.endDate),
                    });
                }
            }
        }
    }

    return {
        processedContracts,
        createdDispatches,
        skippedDispatches,
    };
}
