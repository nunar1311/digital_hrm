import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Cổng nhân viên | Digital HRM",
};

export default function ESSPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">
                Cổng nhân viên (Self-Service)
            </h1>
            {/* TODO: Employee self-service portal */}
        </div>
    );
}
