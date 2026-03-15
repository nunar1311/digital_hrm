import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Danh sách hợp đồng | Digital HRM",
};

import { ContractsClient } from "./contracts-client";

export default function ContractsPage() {
    return <ContractsClient />;
}
