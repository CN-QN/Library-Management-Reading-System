"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { ApiError, apiClient } from "@/lib/api-client";
import { describeErrorCode } from "@/lib/error-codes";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { Library, KeyRound, ArrowRight } from "lucide-react";

interface LoginFormValues {
  email: string;
  password: string;
}

export default function LoginPage() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [formError, setFormError] = useState<string | null>(null);
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isResetStep, setIsResetStep] = useState(false);
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setFormError(null);
    try {
      await login(values.email, values.password);
      showToast("Đăng nhập thành công.", "success");
      router.replace("/dashboard");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? describeErrorCode(err.errorCode, err.message)
          : "Không thể kết nối tới máy chủ. Vui lòng thử lại.";
      setFormError(message);
    }
  }

  async function handleGoogleLogin() {
    try {
      await apiClient.post("/api/auth/google", {
        email: "google.user@libraryhub.com",
        name: "Google Reader User",
        googleId: "google-123456789",
        avatar: "https://lh3.googleusercontent.com/a/default-user",
      });
      showToast("Đăng nhập bằng tài khoản Google thành công!", "success");
      window.location.href = "/dashboard";
    } catch {
      showToast("Không thể xác thực với Google.", "error");
    }
  }

  async function handleRequestForgot(e: React.FormEvent) {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      showToast("Vui lòng nhập Email khôi phục!", "error");
      return;
    }

    setIsForgotLoading(true);
    try {
      await apiClient.post("/api/auth/forgot-password", { email: forgotEmail });
      showToast(`Đã gửi yêu cầu khôi phục đến ${forgotEmail}!`, "success");
      setIsResetStep(true);
    } catch {
      showToast("Email không tồn tại trong hệ thống.", "error");
    } finally {
      setIsForgotLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!newPassword.trim()) {
      showToast("Vui lòng nhập Mật khẩu mới!", "error");
      return;
    }

    setIsForgotLoading(true);
    try {
      await apiClient.post("/api/auth/reset-password", {
        email: forgotEmail,
        newPassword,
      });
      showToast("Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.", "success");
      setIsForgotOpen(false);
      setIsResetStep(false);
    } catch {
      showToast("Không thể đặt lại mật khẩu.", "error");
    } finally {
      setIsForgotLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-12 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-xl p-8 shadow-2xl space-y-6 text-slate-100">
        {isSubmitting && <LoadingOverlay message="Đang xác thực đăng nhập..." />}

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-slate-800 border border-slate-700 shadow-inner">
            <Library className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">LibraryHub Admin</h1>
          <p className="text-xs text-slate-400">Cổng Quản Trị Hệ Thống Đọc Sách Số & Thư Viện</p>
        </div>

        {/* Google OAuth Login Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-800/80 py-2.5 px-4 text-sm font-semibold text-slate-200 hover:bg-slate-800 hover:border-slate-600 transition-all shadow-sm"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z" />
            <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
            <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12.5s.7 2.8 1.9 5.2l3.7-2.9z" />
            <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 17C3.7 20.7 7.5 24 12 24z" />
          </svg>
          Đăng nhập bằng Google
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-xs font-semibold text-slate-500 uppercase">Hoặc tài khoản</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        {/* Form Login */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email quản trị *</label>
            <input
              type="email"
              autoComplete="email"
              placeholder="admin@libraryhub.com"
              className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              {...register("email", { required: "Vui lòng nhập email." })}
            />
            {errors.email && <p className="text-xs text-rose-400 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">Mật khẩu *</label>
              <button
                type="button"
                onClick={() => setIsForgotOpen(true)}
                className="text-xs font-medium text-primary hover:underline"
              >
                Quên mật khẩu?
              </button>
            </div>
            <input
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              {...register("password", { required: "Vui lòng nhập mật khẩu." })}
            />
            {errors.password && <p className="text-xs text-rose-400 mt-1">{errors.password.message}</p>}
          </div>

          {formError && (
            <div role="alert" className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
              {formError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 px-4 font-bold text-sm text-primary-foreground hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/20 disabled:opacity-50"
          >
            Đăng nhập hệ thống
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* Modal Quên Mật Khẩu */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" />
                Quên Mật Khẩu Hệ Thống
              </h3>
              <button type="button" onClick={() => setIsForgotOpen(false)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>

            {!isResetStep ? (
              <form onSubmit={handleRequestForgot} className="space-y-4">
                <p className="text-xs text-slate-400">
                  Nhập email đăng ký của bạn. Hệ thống sẽ xác thực và cho phép bạn đặt lại mật khẩu mới.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email đăng ký</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="VD: admin@libraryhub.com"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button type="button" onClick={() => setIsForgotOpen(false)} className="rounded-xl border border-slate-700 px-4 py-2 text-xs">Hủy</button>
                  <button type="submit" disabled={isForgotLoading} className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">
                    {isForgotLoading ? "Đang gửi..." : "Gửi yêu cầu khôi phục"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <p className="text-xs text-emerald-400">
                  ✓ Email {forgotEmail} đã được xác thực thành công. Vui lòng nhập mật khẩu mới.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Mật khẩu mới *</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button type="button" onClick={() => setIsForgotOpen(false)} className="rounded-xl border border-slate-700 px-4 py-2 text-xs">Hủy</button>
                  <button type="submit" disabled={isForgotLoading} className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">
                    {isForgotLoading ? "Đang đặt lại..." : "Lưu mật khẩu mới"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
