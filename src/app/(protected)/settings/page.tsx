import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Cài đặt hệ thống | Digital HRM",
};

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">
                Cài đặt hệ thống
            </h1>
            {/* TODO: System settings, RBAC, audit log */}
        </div>
    );
}
