import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-session";
import { getMyAdministrativeRequests } from "../actions";
import { RequestsClient } from "./requests-client";

export const metadata: Metadata = {
  title: "Yêu cầu hành chính | Digital HRM",
};

export default async function ESSRequestsPage() {
  await requireAuth();
  const requests = await getMyAdministrativeRequests();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Yêu cầu hành chính</h1>
      <RequestsClient initialRequests={requests} />
    </div>
  );
}
