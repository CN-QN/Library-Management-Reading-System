"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api-client";
import { usersApi, type BranchOption, type CreateUserInput } from "@/lib/api/users";

interface FormValues {
  email: string;
  password: string;
  fullName: string;
  branchId: string;
}

export default function CreateUserPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [branchError, setBranchError] = useState("");
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { email: "", password: "", fullName: "", branchId: "" },
  });

  useEffect(() => {
    usersApi.branches()
      .then(setBranches)
      .catch((error) => setBranchError(error instanceof Error ? error.message : "Không thể tải chi nhánh."));
  }, []);

  async function onSubmit(values: FormValues) {
    try {
      const payload: CreateUserInput = {
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        branchId: values.branchId || undefined,
      };
      const user = await usersApi.create(payload);
      showToast("Tạo người dùng thành công.", "success");
      router.push(`/users/${user.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.details?.length) {
        for (const detail of err.details) {
          const field = detail.field.charAt(0).toLowerCase() + detail.field.slice(1);
          if (field === "email" || field === "password" || field === "fullName" || field === "branchId") {
            setError(field, { message: detail.message });
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
            <Select label="Chi nhánh" error={errors.branchId?.message} {...register("branchId")}>
              <option value="">Không chọn chi nhánh</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}{branch.code ? ` (${branch.code})` : ""}
                </option>
              ))}
            </Select>
            {branchError && <p className="-mt-2 text-xs text-red-600">{branchError}</p>}

            <Button type="submit" isLoading={isSubmitting}>
              Tạo người dùng
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
