"use client";

import { use, useCallback, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { useAsync } from "@/hooks/use-async";
import { usersApi, type AppUser } from "@/lib/api/users";
import { ApiError } from "@/lib/api-client";
import { describeErrorCode } from "@/lib/error-codes";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/context/auth-context";
import { Card, CardHeader, CardBody, CardFooter } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { AssignRoleModal } from "@/components/users/assign-role-modal";
import { PendingBackendCard } from "@/components/users/pending-backend-card";
import { Permissions } from "@/lib/permissions";

interface ProfileFormValues {
  fullName: string;
  avatar: string;
  branchId: string;
}

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { showToast } = useToast();
  const { can } = useAuth();
  const [user, setUser] = useState<AppUser | null>(null);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [removingRoleId, setRemovingRoleId] = useState<string | null>(null);

  const fetchUser = useCallback(() => usersApi.getById(id), [id]);
  const { data, error, isLoading, retry } = useAsync(fetchUser);
  const current = user ?? data;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    values: current
      ? {
          fullName: current.fullName,
          avatar: current.avatar ?? "",
          branchId: current.branchId ?? "",
        }
      : undefined,
  });

  async function onSubmitProfile(values: ProfileFormValues) {
    try {
      const updated = await usersApi.update(id, {
        fullName: values.fullName,
        avatar: values.avatar || undefined,
        branchId: values.branchId || undefined,
      });
      setUser(updated);
      showToast("Cập nhật hồ sơ thành công.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể cập nhật hồ sơ.", "error");
    }
  }

  async function handleToggleLock() {
    if (!current) return;
    const nextStatus = current.status === "LOCKED" ? "ACTIVE" : "LOCKED";
    setIsChangingStatus(true);
    try {
      await usersApi.updateStatus(id, nextStatus);
      setUser({ ...current, status: nextStatus });
      showToast(nextStatus === "LOCKED" ? "Đã khóa tài khoản." : "Đã mở khóa tài khoản.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể đổi trạng thái tài khoản.", "error");
    } finally {
      setIsChangingStatus(false);
    }
  }

  async function handleRemoveRole(userRoleId: string) {
    if (!current) return;
    setRemovingRoleId(userRoleId);
    try {
      await usersApi.removeRole(id, userRoleId);
      setUser({
        ...current,
        assignedRoles: current.assignedRoles.filter((r) => r.userRoleId !== userRoleId),
      });
      showToast("Đã gỡ vai trò.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể gỡ vai trò.", "error");
    } finally {
      setRemovingRoleId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Link href="/users" className="text-sm text-slate-500 hover:text-slate-700">
          ← Quay lại danh sách người dùng
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">
          {current ? current.fullName : "Chi tiết người dùng"}
        </h1>
      </div>

      {isLoading && (
        <Card className="p-6">
          <Skeleton className="mb-3 h-6 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
        </Card>
      )}

      {!isLoading && error && (
        <ErrorState
          message={
            error instanceof ApiError
              ? describeErrorCode(error.errorCode, error.message)
              : "Không thể tải thông tin người dùng."
          }
          onRetry={retry}
        />
      )}

      {!isLoading && !error && current && (
        <>
          <Card>
            <CardHeader
              title="Trạng thái tài khoản"
              description={<StatusBadge status={current.status} />}
              action={
                can(Permissions.UserLock) ? (
                  <Button
                    variant={current.status === "LOCKED" ? "outline" : "danger"}
                    size="sm"
                    isLoading={isChangingStatus}
                    onClick={handleToggleLock}
                  >
                    {current.status === "LOCKED" ? "Mở khóa" : "Khóa tài khoản"}
                  </Button>
                ) : undefined
              }
            />
          </Card>

          <Card>
            <CardHeader title="Hồ sơ" description={`Mã sinh viên: ${current.studentCode} · ${current.email}`} />
            <CardBody>
              <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-4" noValidate>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Input
                    label="Họ tên"
                    error={errors.fullName?.message}
                    {...register("fullName", { required: "Vui lòng nhập họ tên." })}
                  />
                  <Input label="Chi nhánh (ID)" {...register("branchId")} />
                  <Input label="URL ảnh đại diện" {...register("avatar")} />
                </div>
                <Button type="submit" isLoading={isSubmitting}>
                  Lưu thay đổi
                </Button>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Vai trò"
              action={
                can(Permissions.UserAssignRole) ? (
                  <Button size="sm" variant="outline" onClick={() => setIsAssignModalOpen(true)}>
                    + Gán vai trò
                  </Button>
                ) : undefined
              }
            />
            <CardBody className="flex flex-wrap gap-2">
              {current.assignedRoles.length === 0 && (
                <p className="text-sm text-slate-400">Chưa có vai trò nào.</p>
              )}
              {current.assignedRoles.map((role) => (
                <span
                  key={role.userRoleId}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-100 py-1 pl-3 pr-1 text-sm"
                >
                  <Badge variant="info">{role.roleCode}</Badge>
                  {role.branchName && (
                    <span className="text-xs text-slate-500">{role.branchName}</span>
                  )}
                  {can(Permissions.UserAssignRole) && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRole(role.userRoleId)}
                      disabled={removingRoleId === role.userRoleId}
                      aria-label={`Gỡ vai trò ${role.roleCode}`}
                      className="rounded-full px-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-50"
                    >
                      ✕
                    </button>
                  )}
                </span>
              ))}
            </CardBody>
            {can(Permissions.UserAssignRole) && (
              <CardFooter>
                <p className="text-xs text-slate-400">
                  Gỡ vai trò có hiệu lực ngay; người dùng cần đăng nhập lại để permission cache
                  được làm mới.
                </p>
              </CardFooter>
            )}
          </Card>

          <PendingBackendCard
            title="Sách đang mượn"
            description="Backend chưa có module Circulation/Borrowing (chỉ mới có Auth, Catalog, DigitalContent, Inventory, Roles, Users) nên chưa có API để hiển thị phiếu mượn hiện tại. Đã định nghĩa sẵn hợp đồng GET /api/users/{id}/borrowings trong lib/api/users.ts, chờ backend triển khai."
          />

          <PendingBackendCard
            title="Lịch sử đọc"
            description="Tương tự, backend chưa có module Reading Progress. Hợp đồng GET /api/users/{id}/reading-history đã được định nghĩa sẵn, chờ backend triển khai."
          />
        </>
      )}

      {current && (
        <AssignRoleModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          userId={current.id}
          onAssigned={retry}
        />
      )}
    </div>
  );
}
