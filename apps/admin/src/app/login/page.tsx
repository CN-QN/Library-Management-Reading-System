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

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="relative w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        {isSubmitting && <LoadingOverlay message="Đang đăng nhập..." />}

        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold text-slate-900">LibraryHub Admin</h1>
          <p className="mt-1 text-sm text-slate-500">Đăng nhập để tiếp tục quản trị</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="admin@libraryhub.com"
            error={errors.email?.message}
            {...register("email", {
              required: "Vui lòng nhập email.",
              pattern: {
                value: /^\S+@\S+\.\S+$/,
                message: "Email không hợp lệ.",
              },
            })}
          />

          <Input
            label="Mật khẩu"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register("password", {
              required: "Vui lòng nhập mật khẩu.",
            })}
          />

          {formError && (
            <p role="alert" className="text-sm text-red-600">
              {formError}
            </p>
          )}

          <Button type="submit" isLoading={isSubmitting} fullWidth>
            Đăng nhập
          </Button>
        </form>
      </div>
    </div>
  );
}
