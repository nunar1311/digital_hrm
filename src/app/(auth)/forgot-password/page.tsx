"use client";

import Link from "next/link";

export default function ForgotPasswordPage() {
    return (
        <div className="space-y-6 animate-in fade-in zoom-in duration-500">
            {/* Header */}
            <div className="flex flex-col space-y-2 text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-900/20">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                </div>
                
                <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-md">
                    Quên mật khẩu
                </h1>
                <p className="text-sm text-gray-300 font-medium">
                    Nhập email để nhận link đặt lại mật khẩu
                </p>
            </div>

            {/* Form */}
            <form className="grid gap-4" onSubmit={(e) => e.preventDefault()}>
                <div className="grid gap-2 text-left">
                    <label 
                        htmlFor="email" 
                        className="text-sm font-bold text-gray-100 ml-1"
                    >
                        Địa chỉ Email
                    </label>
                    <input 
                        id="email" 
                        type="email" 
                        placeholder="admin@company.vn" 
                        className="flex h-11 w-full rounded-lg border border-gray-600 bg-gray-900/50 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner"
                        required 
                    />
                </div>
                
                <button 
                    type="submit" 
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-500 h-11 px-4 py-2 w-full shadow-lg transition-all active:scale-95"
                >
                    Gửi yêu cầu
                </button>
            </form>

            {/* Footer */}
            <div className="text-center pt-2">
                <p className="text-sm text-gray-400">
                    Nhớ ra mật khẩu?{" "}
                    <Link 
                        href="/login" 
                        className="text-white hover:text-blue-400 transition-colors font-bold underline underline-offset-4"
                    >
                        Quay lại Đăng nhập
                    </Link>
                </p>
            </div>
        </div>
    );
}