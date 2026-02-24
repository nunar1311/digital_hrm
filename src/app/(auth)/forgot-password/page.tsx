import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Quên mật khẩu | Digital HRM",
};

export default function ForgotPasswordPage() {
    return (
        <div className="space-y-6">
            <div className="space-y-2 text-center">
                <h1 className="text-2xl font-bold">Quên mật khẩu</h1>
                <p className="text-muted-foreground">
                    Nhập email để nhận link đặt lại mật khẩu
                </p>
            </div>
            {/* TODO: Forgot password form */}
        </div>
    );
}
