import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Chi tiết Onboarding | Digital HRM",
};

export default async function OnboardingDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">
                Onboarding #{id}
            </h1>
            {/* TODO: Onboarding progress, checklist tracking */}
        </div>
    );
}
