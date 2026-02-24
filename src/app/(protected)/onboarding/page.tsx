import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Onboarding | Digital HRM",
};

export default function OnboardingPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">
                Onboarding - Tiếp nhận nhân viên mới
            </h1>
            {/* TODO: Onboarding checklist and welcome portal */}
        </div>
    );
}
