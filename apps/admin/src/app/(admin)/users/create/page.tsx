"use client";

import { useForm } from "react-hook-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api-client";
import { usersApi, type CreateUserInput } from "@/lib/api/users";

interface FormValues {
  email: string;
  password: string;
  fullName: string;
}

export default function CreateUserPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { email: "", password: "", fullName: "" },
  });

  async function onSubmit(values: FormValues) {
    try {
      const payload: CreateUserInput = {
        email: values.email,
        password: values.password,
        fullName: values.fullName,
      };
      const user = await usersApi.create(payload);
      showToast("Tạo người dùng thành công.", "success");
      router.push(`/users/${user.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.details?.length) {
        for (const detail of err.details) {
          const field = detail.field.charAt(0).toLowerCase() + detail.field.slice(1);
          if (field === "email" || field === "password" || field === "fullName") {
            setError(field as keyof FormValues, { message: detail.message });
          }
        }
      } else {
        showToast(err instanceof Error ? err.message : "Không thể tạo người dùng.", "error");
      }
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Link href="/users" className="text-sm text-slate-500 hover:text-slate-700">
          ← Quay lại danh sách người dùng
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">Thêm người dùng mới</h1>
      </div>

      <Card>
        <CardHeader title="Thông tin tài khoản" />
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              label="Họ tên"
              error={errors.fullName?.message}
              {...register("fullName", { required: "Vui lòng nhập họ tên." })}
            />
            <Input
              label="Email"
              type="email"
              error={errors.email?.message}
              {...register("email", {
                required: "Vui lòng nhập email.",
                pattern: {
                  value: /^\S+@gmail\.com$/i,
                  message: "Email phải thuộc tên miền @gmail.com.",
                },
              })}
            />
            <Input
              label="Mật khẩu"
              type="password"
              error={errors.password?.message}
              {...register("password", {
                required: "Vui lòng nhập mật khẩu.",
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/,
                  message:
                    "Mật khẩu cần ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.",
                },
              })}
            />

            <Button type="submit" isLoading={isSubmitting}>
              Tạo người dùng
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
