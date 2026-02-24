import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Chi tiết Offboarding | Digital HRM",
};

export default async function OffboardingDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">
                Offboarding #{id}
            </h1>
            {/* TODO: Handover checklist, exit interview, final settlement */}
        </div>
    );
}
