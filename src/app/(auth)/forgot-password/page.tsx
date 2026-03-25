
import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    // Dùng nền trắng tinh (bg-white) cho toàn trang để không bị lộ khung viền
    <div className="flex min-h-[100vh] w-full items-center justify-center bg-white p-4">
      
      {/* Khung chứa form - ĐÃ XÓA nền trắng, viền và bóng mờ (shadow) */}
      <div className="w-full max-w-[400px]">
        
        {/* Logo HR giống trang đăng nhập */}
        <div className="flex justify-center mb-6">
          <div className="bg-[#111111] text-white font-bold text-xl flex items-center justify-center w-12 h-12 rounded-lg">
            HR
          </div>
        </div>

        {/* Tiêu đề */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-black mb-2">Khôi phục mật khẩu</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Vui lòng nhập email của bạn. Chúng tôi sẽ gửi một liên kết để giúp bạn đặt lại mật khẩu mới.
          </p>
        </div>

        {/* Form nhập liệu */}
        <form className="space-y-5">
          <div className="text-left">
            <label className="block text-sm font-semibold text-black mb-1.5">
              Email
            </label>
            <input
              type="email"
              placeholder="admin@company.vn"
              // Ô input có màu nền xanh xám nhạt giống hệt trang Đăng nhập
              className="w-full px-4 py-3 bg-[#f0f4f8] border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-black outline-none transition"
              required
            />
          </div>

          <button
            type="submit"
            // Nút bấm màu Đen
            className="w-full bg-[#111111] hover:bg-black text-white font-semibold py-3 rounded-lg transition duration-200 mt-2"
          >
            Gửi liên kết khôi phục
          </button>
        </form>

        {/* Nút Quay lại */}
        <div className="mt-8 text-center">
          <Link 
            href="/login" 
            className="text-sm text-gray-500 hover:text-black font-medium transition"
          >
             Quay lại trang đăng nhập
          </Link>
        </div>

      </div>
    </div>
  );
}
