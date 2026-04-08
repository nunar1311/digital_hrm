import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
    getMyExplanations,
    getPendingExplanations,
    getAllExplanations,
} from "../actions";
import { requireAuth, extractRole } from "@/lib/auth-session";
import { hasPermission } from "@/lib/rbac/check-access";
import { Permission } from "@/lib/rbac/permissions";
import { ExplanationsClient } from "./explanations-client";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "ProtectedPages" });

    return {
        title: `${t("attendanceExplanationsMetadataTitle")} | Digital HRM`,
    };
}

export default async function ExplanationsPage() {
    const session = await requireAuth();
    const role = extractRole(session);
    const canApprove = hasPermission(
        role,
        Permission.ATTENDANCE_APPROVE,
    );

    const [myExplanations, pendingExplanations, allExplanations] =
        await Promise.all([
            getMyExplanations(),
            canApprove
                ? getPendingExplanations()
                : Promise.resolve([]),
            canApprove ? getAllExplanations() : Promise.resolve([]),
        ]);

    return (
        <ExplanationsClient
            userId={session.user.id}
            myExplanations={JSON.parse(
                JSON.stringify(myExplanations),
            )}
            pendingExplanations={JSON.parse(
                JSON.stringify(pendingExplanations),
            )}
            allExplanations={JSON.parse(
                JSON.stringify(allExplanations),
            )}
            canApprove={canApprove}
        />
    );
}
