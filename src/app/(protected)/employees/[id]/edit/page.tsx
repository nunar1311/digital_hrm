import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Chỉnh sửa nhân viên | Digital HRM",
};

export default async function EditEmployeePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">
                Chỉnh sửa nhân viên #{id}
            </h1>
            {/* TODO: Edit employee form */}
        </div>
    );
}
