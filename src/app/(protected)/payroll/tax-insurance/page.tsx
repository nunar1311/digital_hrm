import type { Metadata } from "next";
import { getPayrollConfigs } from "../actions";
import TaxInsuranceClient from "./tax-insurance-client";

export const metadata: Metadata = {
    title: "Thuế & Bảo hiểm | Digital HRM",
    description: "Cấu hình thuế TNCN và bảo hiểm",
};

export default async function TaxInsurancePage() {
    const configs = await getPayrollConfigs();
    return <TaxInsuranceClient initialData={JSON.parse(JSON.stringify(configs))} />;
}
