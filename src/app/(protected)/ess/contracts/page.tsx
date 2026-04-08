import { Metadata } from "next";
import { ESSContractsClient } from "./contracts-client";
import { requireAuth } from "@/lib/auth-session";
import { getContractsByEmployee } from "@/app/(protected)/contracts/actions";

export const metadata: Metadata = {
  title: "Hợp đồng lao động | Cổng nhân viên - Digital HRM",
  description: "Xem thông tin hợp đồng lao động của bạn",
};

export default async function ESSContractsPage() {
  const session = await requireAuth();

  const contracts = await getContractsByEmployee(session.user.id);

  return <ESSContractsClient initialContracts={contracts} />;
}
