import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { useAuth } from "@/context/AuthContext";
import { authApi } from "@/services/api";

type RegisterFormValues = {
  email: string;
  password: string;
  user_type: "student" | "professional" | "organizer";
};

const USER_TYPE_OPTIONS = [
  {
    value: "student",
    label: "🎓 Sinh viên",
    helper: "Nhận lịch sự kiện và ưu đãi học thuật.",
  },
  {
    value: "professional",
    label: "💼 Chuyên gia",
    helper: "Kết nối cộng đồng chuyên nghiệp để mở rộng network.",
  },
  {
    value: "organizer",
    label: "🎪 Người tổ chức",
    helper: "Tạo và quản lý sự kiện ngay trên EventPass.",
  },
] as const;

export default function RegisterPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<RegisterFormValues>();
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const userTypeOptions = useMemo(() => USER_TYPE_OPTIONS, []);

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      const res = await authApi.register({
        email: data.email,
        password: data.password,
        user_type: data.user_type,
      });

      if (res.data?.access_token) {
        login(res.data.access_token);
        router.push("/");
      }
    } catch (err: any) {
      console.error(err);
      const errorMessage =
        err.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.";
      setError("root", { message: errorMessage });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
            Tạo tài khoản mới
          </h1>
          <p className="text-gray-600">Tham gia cùng chúng tôi ngay hôm nay</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="email"
                  autoComplete="email"
                  {...register("email", {
                    required: "Vui lòng nhập email",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Email không hợp lệ",
                    },
                  })}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  placeholder="email@example.com"
                  onInput={() => clearErrors("email")}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-500 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.email.message as string}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  {...register("password", {
                    required: "Vui lòng nhập mật khẩu",
                    minLength: {
                      value: 6,
                      message: "Mật khẩu phải có ít nhất 6 ký tự",
                    },
                  })}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  placeholder="••••••••"
                  onInput={() => clearErrors("password")}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-500 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.password.message as string}
                </p>
              )}
            </div>

            {/* User Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Bạn là ai? <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <select
                  {...register("user_type", {
                    required: "Vui lòng chọn loại tài khoản",
                  })}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none bg-white appearance-none"
                  defaultValue=""
                  onChange={() => clearErrors("user_type")}
                >
                  <option value="" disabled>
                    -- Chọn loại tài khoản --
                  </option>
                  {userTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              {errors.user_type ? (
                <p className="mt-1 text-sm text-red-500 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {errors.user_type.message as string}
                </p>
              ) : (
                <ul className="mt-2 space-y-1 text-xs text-gray-500">
                  {userTypeOptions.map((option) => (
                    <li key={`hint-${option.value}`}>{option.helper}</li>
                  ))}
                </ul>
              )}
            </div>

            {/* Error Message */}
            {errors.root && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {errors.root.message as string}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] mt-6"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang xử lý...
                </span>
              ) : (
                "Tạo tài khoản"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 flex items-center">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-4 text-sm text-gray-500">hoặc</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          {/* Login Link */}
          <p className="mt-6 text-center text-sm text-gray-600">
            Đã có tài khoản?{" "}
            <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors">
              Đăng nhập ngay
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-500">
          Bằng việc đăng ký, bạn đồng ý với{" "}
          <Link href="#" className="text-blue-600 hover:underline">Điều khoản sử dụng</Link>
          {" "}và{" "}
          <Link href="#" className="text-blue-600 hover:underline">Chính sách bảo mật</Link>
        </p>
      </div>
    </div>
  );
}
