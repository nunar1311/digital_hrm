"use client";

import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
    return (
        <div className="space-y-6 animate-in fade-in zoom-in duration-500">
            {/* Header */}
            <div className="flex flex-col space-y-2 text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]">
                    <Mail className="h-6 w-6" />
                </div>
                
                {/* Tiêu đề trắng tinh khôi, font Semibold như trang Login */}
                <h1 className="text-2xl font-semibold tracking-tight text-white drop-shadow-md">
                    Quên mật khẩu
                </h1>
                
                {/* Mô tả màu Zinc sáng để dễ đọc hơn trên nền xám mờ */}
                <p className="text-sm text-zinc-300 font-medium">
                    Nhập email để nhận link đặt lại mật khẩu
                </p>
            </div>

            {/* Form */}
            <form className="grid gap-4" onSubmit={(e) => e.preventDefault()}>
                <div className="grid gap-2 text-left">
                    <label 
                        htmlFor="email" 
                        className="text-sm font-semibold text-white ml-1 tracking-wide"
                    >
                        Email
                    </label>
                    <input 
                        id="email" 
                        type="email" 
                        placeholder="admin@company.vn" 
                        className="flex h-11 w-full rounded-lg border border-white/20 bg-black/40 px-4 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                        required 
                    />
                </div>
                
                {/* Nút bấm đồng nhất với màu Primary của hệ thống */}
                <button 
                    type="submit" 
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-500 h-11 px-4 py-2 w-full shadow-lg transition-all active:scale-95"
                >
                    Gửi yêu cầu
                </button>
            </form>

            {/* Footer */}
            <div className="text-center pt-2">
                <p className="text-sm text-zinc-400">
                    Nhớ ra mật khẩu?{" "}
                    <Link 
                        href="/login" 
                        className="text-white hover:text-blue-400 transition-colors font-bold inline-flex items-center gap-1 underline-offset-4 hover:underline"
                    >
                        <ArrowLeft className="h-3 w-3" /> Quay lại đăng nhập
                    </Link>
                </p>
            </div>
        </div>
    );
}