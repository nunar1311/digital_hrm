import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getContractTemplates } from "@/app/(protected)/contracts/actions";
import { ContractTemplateDetailClient } from "@/components/contracts/contract-template-detail-client";

export const metadata: Metadata = {
  title: "Chỉnh sửa mẫu hợp đồng | Digital HRM",
};

export default async function ContractTemplateEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (id === "new") {
    return <ContractTemplateDetailClient initialData={null} />;
  }

  const templates = await getContractTemplates({ includeInactive: true });
  const template = templates.find((t) => t.id === id);

  if (!template) {
    redirect("/contracts/templates");
  }

  return <ContractTemplateDetailClient initialData={template} />;
}
