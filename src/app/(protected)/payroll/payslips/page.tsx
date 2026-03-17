import type { Metadata } from "next";
import { getPayslips } from "../actions";
import PayslipsClient from "./payslips-client";

export const metadata: Metadata = {
    title: "Phiếu lương | Digital HRM",
    description: "Xem và tải phiếu lương",
};

export default async function PayslipsPage() {
    const payslips = await getPayslips({});

    return <PayslipsClient initialData={payslips} />;
}
