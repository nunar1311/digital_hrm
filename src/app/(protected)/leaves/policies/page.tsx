import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Chính sách nghỉ phép | Digital HRM",
};

export default function LeavePoliciesPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">
                Chính sách nghỉ phép
            </h1>
            {/* TODO: Leave policies config - annual, sick, maternity */}
        </div>
    );
}
