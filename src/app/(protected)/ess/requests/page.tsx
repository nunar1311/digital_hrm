import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Yêu cầu hành chính | Digital HRM",
};

export default function ESSRequestsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">
                Yêu cầu hành chính
            </h1>
            {/* TODO: Submit admin requests - salary confirmation, visa, etc. */}
        </div>
    );
}
