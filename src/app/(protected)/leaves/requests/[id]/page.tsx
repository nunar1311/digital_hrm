import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Chi tiết đơn phép | Digital HRM",
};

export default async function LeaveRequestDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">
                Đơn nghỉ phép #{id}
            </h1>
            {/* TODO: Leave request detail with approval flow */}
        </div>
    );
}