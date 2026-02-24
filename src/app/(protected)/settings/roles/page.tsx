import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Phân quyền | Digital HRM",
};

export default function RolesPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">
                Phân quyền vai trò
            </h1>
            {/* TODO: RBAC role management */}
        </div>
    );
}
