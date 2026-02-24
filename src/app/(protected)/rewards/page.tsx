import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Khen thưởng & Kỷ luật | Digital HRM",
};

export default function RewardsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">
                Khen thưởng & Kỷ luật
            </h1>
            {/* TODO: Rewards, discipline management, honor board */}
        </div>
    );
}
