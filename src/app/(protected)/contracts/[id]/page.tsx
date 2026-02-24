import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Chi tiết hợp đồng | Digital HRM",
};

export default async function ContractDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">
                Hợp đồng #{id}
            </h1>
            {/* TODO: Contract detail, addendums history, print */}
        </div>
    );
}
