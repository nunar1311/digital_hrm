import { Metadata } from "next";
import { ESSRequestsClient } from "./requests-client";
import { getMyAdministrativeRequests } from "../actions";

export const metadata: Metadata = {
    title: "Yêu cầu hành chính | Cổng nhân viên - Digital HRM",
    description: "Gửi và theo dõi các yêu cầu hành chính của bạn",
};

export default async function ESSRequestsPage() {
    const requests = await getMyAdministrativeRequests();
    
    return <ESSRequestsClient initialRequests={requests} />;
}
