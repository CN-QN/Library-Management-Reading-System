"use client";

import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useAsync } from "@/hooks/use-async";
import { rolesApi } from "@/lib/api/roles";
import { usersApi } from "@/lib/api/users";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";

interface FormValues {
  roleId: string;
  branchId: string;
  expiresAt: string;
}

export function AssignRoleModal({
  isOpen,
  onClose,
  userId,
  onAssigned,
}: {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onAssigned: () => void;
}) {
  const { showToast } = useToast();
  const fetchRoles = useCallback(() => rolesApi.list(), []);
  const { data: roles, error, isLoading, retry } = useAsync(fetchRoles);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: { roleId: "", branchId: "", expiresAt: "" } });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      await usersApi.assignRole(
        userId,
        values.roleId,
        values.branchId || undefined,
        values.expiresAt || undefined
      );
      showToast("Đã gán vai trò.", "success");
      reset();
      onAssigned();
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể gán vai trò.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gán vai trò">
      {isLoading && <Skeleton className="h-32 w-full" />}
      {!isLoading && error && <ErrorState message="Không thể tải danh sách vai trò." onRetry={retry} />}
      {!isLoading && !error && roles && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Select label="Vai trò" error={errors.roleId?.message} {...register("roleId", { required: "Vui lòng chọn vai trò." })}>
            <option value="">— Chọn vai trò —</option>
            {roles
              .filter((r) => r.status === "ACTIVE")
              .map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name} ({role.code})
                </option>
              ))}
          </Select>
          <Input label="Chi nhánh áp dụng (ID, tùy chọn)" {...register("branchId")} />
          <Input label="Hết hạn (tùy chọn)" type="date" {...register("expiresAt")} />
          <Button type="submit" isLoading={isSubmitting} fullWidth>
            Gán vai trò
          </Button>
        </form>
      )}
    </Modal>
  );
}
