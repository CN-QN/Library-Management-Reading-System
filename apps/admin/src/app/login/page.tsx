"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { ApiError } from "@/lib/api-client";
import { describeErrorCode } from "@/lib/error-codes";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { Library } from "lucide-react";

interface LoginFormValues {
  email: string;
  password: string;
}

export default function LoginPage() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

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
      showToast("Đăng nhập quản trị thành công.", "success");
      router.replace("/dashboard");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? describeErrorCode(err.errorCode, err.message)
          : "Không thể kết nối tới máy chủ. Vui lòng thử lại.";
      setFormError(message);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="relative w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm space-y-6">
        {isSubmitting && <LoadingOverlay message="Đang xác thực tài khoản..." />}

        {/* Admin Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-xl bg-slate-900 text-white shadow-sm">
            <Library className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">LibraryHub Admin</h1>
          <p className="text-xs text-slate-500">Đăng nhập tài khoản cán bộ quản trị hệ thống</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input
            label="Email cán bộ quản trị *"
            type="email"
            autoComplete="email"
            placeholder="admin@libraryhub.com"
            error={errors.email?.message}
            {...register("email", {
              required: "Vui lòng nhập email cán bộ.",
              pattern: {
                value: /^\S+@\S+\.\S+$/,
                message: "Email không hợp lệ.",
              },
            })}
          />

          <Input
            label="Mật khẩu *"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register("password", {
              required: "Vui lòng nhập mật khẩu.",
            })}
          />

          {formError && (
            <div role="alert" className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-600 font-medium">
              {formError}
            </div>
          )}

          <Button type="submit" isLoading={isSubmitting} fullWidth className="bg-slate-900 hover:bg-slate-800 text-white font-semibold">
            Đăng nhập Quản trị
          </Button>
        </form>
      </div>
    </div>
  );
}
