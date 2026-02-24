import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Hồ sơ nhân viên | Digital HRM",
};

export default async function EmployeeDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">
                Hồ sơ nhân viên #{id}
            </h1>
            {/* TODO: 360 profile, timeline, work history */}
        </div>
    );
}
