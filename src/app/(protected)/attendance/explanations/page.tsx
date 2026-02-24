import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Giải trình chấm công | Digital HRM",
};

export default function ExplanationsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">
                Giải trình chấm công
            </h1>
            {/* TODO: Late/early/missing punch explanations */}
        </div>
    );
}
