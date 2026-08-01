"use client";

import { useForm } from "react-hook-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { usersApi, type CreateUserInput } from "@/lib/api/users";

interface FormValues {
  email: string;
  password: string;
  fullName: string;
  studentCode: string;
  branchId: string;
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
    defaultValues: { email: "", password: "", fullName: "", studentCode: "", branchId: "" },
  });

  async function onSubmit(values: FormValues) {
    try {
      const payload: CreateUserInput = {
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        studentCode: values.studentCode,
        branchId: values.branchId || undefined,
      };
      const user = await usersApi.create(payload);
      showToast("Tạo người dùng thành công.", "success");
      router.push(`/users/${user.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể tạo người dùng.";
      if (message.toLowerCase().includes("email")) {
        setError("email", { message });
      } else if (message.toLowerCase().includes("student")) {
        setError("studentCode", { message });
      } else {
        showToast(message, "error");
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
                  value: /^\S+@(gmail\.com|[a-zA-Z0-9-]+\.edu\.vn)$/,
                  message: "Email phải thuộc @gmail.com hoặc tên miền .edu.vn.",
                },
              })}
            />
            <Input
              label="Mã sinh viên"
              error={errors.studentCode?.message}
              {...register("studentCode", {
                required: "Vui lòng nhập mã sinh viên.",
                pattern: {
                  value: /^\d{8,12}$/,
                  message: "Mã sinh viên phải gồm 8–12 chữ số.",
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
            <Input
              label="Chi nhánh (ID)"
              placeholder="Tùy chọn"
              {...register("branchId")}
            />
            <p className="-mt-2 text-xs text-slate-400">
              Backend chưa có API danh sách chi nhánh — nhập tạm ID, sẽ chuyển sang dropdown
              khi API đó sẵn sàng.
            </p>

            <Button type="submit" isLoading={isSubmitting}>
              Tạo người dùng
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
