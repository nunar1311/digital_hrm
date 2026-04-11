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
    <div className="w-full min-h-0 h-full grow flex flex-col">
      <div className="w-full min-h-0 h-full min-w-0 flex flex-col relative bg-background">
        <div className="flex flex-col gap-0 border-b shrink-0">
          <section>
            <header className="p-2 sm:px-4 flex items-center h-10 border-b">
              <h1 className="font-bold text-sm sm:text-base">
                {contract.title}
              </h1>
            </header>
          </section>
        </div>

        <section className="flex-1 relative h-full min-h-0 overflow-hidden bg-muted/10 p-3">
          <div className="h-full overflow-y-auto no-scrollbar">
            <ContractDetailClient contractId={id} initialData={contract} />
          </div>
        </section>
      </div>
    </div>
  );
}
