import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Offboarding | Digital HRM",
};

export default function OffboardingPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">
                Offboarding - Nghỉ việc
            </h1>
            {/* TODO: Offboarding list, handover process */}
        </div>
    );
}
