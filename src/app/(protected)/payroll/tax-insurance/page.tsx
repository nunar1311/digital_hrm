import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Thuế & Bảo hiểm | Digital HRM",
};

export default function TaxInsurancePage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">
                Thuế TNCN & Bảo hiểm
            </h1>
            {/* TODO: PIT calculation, social insurance deductions */}
        </div>
    );
}
