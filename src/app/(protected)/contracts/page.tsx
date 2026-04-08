import type { Metadata } from "next";
import { getContracts } from "@/app/(protected)/contracts/actions";
import { ContractsListClient } from "@/components/contracts/contracts-list-client";

export const metadata: Metadata = {
  title: "Danh sách hợp đồng | Digital HRM",
};

export default async function ContractsPage() {
  const initialResult = await getContracts({
    page: 1,
    pageSize: 50,
    status: "ALL",
  });

  return <ContractsListClient initialResult={initialResult} />;
}
