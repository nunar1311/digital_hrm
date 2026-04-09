import { Metadata } from "next";
import { ESSLeaveClient } from "./leave-client";
import { getMyLeaveBalances, getMyLeaveRequests } from "./actions";

export const metadata: Metadata = {
  title: "Nghỉ phép | Cổng nhân viên - Digital HRM",
  description: "Quản lý yêu cầu nghỉ phép của bạn",
};

export default async function ESSLeavePage() {
  const [balancesData, requestsData] = await Promise.all([
    getMyLeaveBalances(),
    getMyLeaveRequests({ pageSize: 100 }),
  ]);

  return (
    <ESSLeaveClient
      initialBalances={balancesData}
      initialRequests={requestsData}
    />
  );
}
