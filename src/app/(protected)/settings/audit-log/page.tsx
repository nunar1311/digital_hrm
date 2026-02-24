import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Nhật ký hệ thống | Digital HRM",
};

export default function AuditLogPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">
                Nhật ký hệ thống (Audit Log)
            </h1>
            {/* TODO: Activity audit log */}
        </div>
    );
}
