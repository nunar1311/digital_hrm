import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Mẫu hợp đồng | Digital HRM",
};

import TemplatesClient from "./templates-client";

export default function ContractTemplatesPage() {
    return <TemplatesClient />;
}
