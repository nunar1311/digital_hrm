import type { Metadata } from "next";
import { getContractTemplates } from "@/app/(protected)/contracts/actions";
import { ContractTemplateManager } from "@/components/contracts/contract-template-manager";

export const metadata: Metadata = {
  title: "Mẫu hợp đồng | Digital HRM",
};

export default async function ContractTemplatesPage() {
  const initialTemplates = await getContractTemplates({
    includeInactive: true,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Mẫu hợp đồng</h1>
      <ContractTemplateManager initialTemplates={initialTemplates} />
    </div>
  );
}
