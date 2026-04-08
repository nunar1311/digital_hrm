import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getContractById } from "@/app/(protected)/contracts/actions";
import { ContractDetailClient } from "@/components/contracts/contract-detail-client";

export const metadata: Metadata = {
  title: "Chi tiết hợp đồng | Digital HRM",
};

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contract = await getContractById(id);

  if (!contract) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Hợp đồng #{id}</h1>
      <ContractDetailClient contractId={id} initialData={contract} />
    </div>
  );
}
