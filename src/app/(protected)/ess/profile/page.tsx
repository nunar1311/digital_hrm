import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Hồ sơ cá nhân | Digital HRM",
};

export default function ESSProfilePage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">
                Hồ sơ cá nhân
            </h1>
            {/* TODO: Self-update profile, pending approval */}
        </div>
    );
}
