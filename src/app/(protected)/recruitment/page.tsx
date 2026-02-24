import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Tuyển dụng | Digital HRM",
};

export default function RecruitmentPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">
                Quản lý tuyển dụng
            </h1>
            {/* TODO: Job postings, ATS pipeline */}
        </div>
    );
}
