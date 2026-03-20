import type { Metadata } from "next";
import { CompanySetupForm } from "./company-setup-form";

export const metadata: Metadata = {
    title: "Tạo hồ sơ công ty | Digital HRM",
};

export default function CompanySetupPage() {
    return (
        <div className="flex items-center justify-center h-screen w-3xl mx-auto">
            <CompanySetupForm />
        </div>
    );
}
