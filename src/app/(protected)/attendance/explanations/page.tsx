import type { Metadata } from "next";
import {
    getMyExplanations,
    getPendingExplanations,
    getAllExplanations,
} from "../actions";
import { requireAuth, extractRole } from "@/lib/auth-session";
import { hasPermission } from "@/lib/rbac/check-access";
import { Permission } from "@/lib/rbac/permissions";
import { ExplanationsClient } from "./explanations-client";

export const metadata: Metadata = {
    title: "Giải trình chấm công",
};

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
