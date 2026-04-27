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

  return <ContractTemplateManager initialTemplates={initialTemplates} />;
}
