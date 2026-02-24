import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Quản lý làm thêm giờ | Digital HRM",
};

export default function OvertimePage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">
                Đăng ký & Duyệt OT
            </h1>
            {/* TODO: OT registration, approval, coefficient config */}
        </div>
    );
}
