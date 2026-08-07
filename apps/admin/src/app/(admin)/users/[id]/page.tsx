"use client";

import { use, useCallback, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { useAsync } from "@/hooks/use-async";
import { usersApi, type AppUser, type UserReadingHistoryItem } from "@/lib/api/users";
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
import { Permissions } from "@/lib/permissions";
import { BookOpen, Repeat, Clock, Book } from "lucide-react";

interface ProfileFormValues {
  fullName: string;
}

function UserBorrowingsSection({ userId }: { userId: string }) {
  const fetchBorrowings = useCallback(() => usersApi.getCurrentBorrowings(userId), [userId]);
  const { data, isLoading, error } = useAsync(fetchBorrowings);

  const borrowings = data?.items ?? [];

  return (
    <Card>
      <CardHeader
        title="Sách đang mượn"
        description="Danh sách các phiếu mượn và sách đang được mượn bởi người dùng"
      />
      <CardBody>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : error ? (
          <p className="text-sm text-red-600">Không thể tải danh sách sách đang mượn.</p>
        ) : borrowings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-slate-400">
            <Repeat className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">Người dùng hiện không mượn cuốn sách nào.</p>
          </div>
        ) : (
          <div className="divide-y border rounded-lg overflow-hidden">
            {borrowings.map((b) => (
              <div key={b.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-slate-900">{b.code}</span>
                    <StatusBadge status={b.status} />
                  </div>
                  <p className="text-xs text-slate-500">
                    Số sách mượn: <span className="font-semibold text-slate-700">{b.items.length} cuốn</span> · Hạn trả:{" "}
                    <span className="font-semibold text-slate-700">
                      {new Date(b.expectedReturnAt).toLocaleDateString("vi-VN")}
                    </span>
                  </p>
                </div>
                <Link
                  href={`/borrowings/${b.id}`}
                  className="text-xs font-semibold text-slate-700 hover:text-slate-900 border rounded-md px-3 py-1.5 self-start sm:self-center"
                >
                  Xem chi tiết
                </Link>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function UserReadingHistorySection({ userId }: { userId: string }) {
  const fetchHistory = useCallback(() => usersApi.getReadingHistory(userId), [userId]);
  const { data: history, isLoading, error } = useAsync(fetchHistory);

  return (
    <Card>
      <CardHeader
        title="Lịch sử đọc sách"
        description="Tiến trình đọc sách điện tử của người dùng trên hệ thống"
      />
      <CardBody>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : error ? (
          <p className="text-sm text-red-600">Không thể tải lịch sử đọc sách.</p>
        ) : !history || history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-slate-400">
            <BookOpen className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">Chưa có lịch sử đọc sách nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {history.map((item: UserReadingHistoryItem) => (
              <div key={item.id} className="p-3 border rounded-xl flex items-start gap-3 bg-slate-50/50">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 shrink-0">
                  <Book className="h-5 w-5" />
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <h4 className="font-semibold text-sm text-slate-900 truncate">
                    {item.bookTitle ?? "Sách điện tử"}
                  </h4>
                  <p className="text-xs text-slate-500">{item.authorName}</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-600 font-medium">
                      Chương {item.chapterNumber ?? 1} · {Math.round(item.percentage ?? 0)}%
                    </span>
                    {item.lastReadAt && (
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(item.lastReadAt).toLocaleDateString("vi-VN")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
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
        }
      : undefined,
  });

  async function onSubmitProfile(values: ProfileFormValues) {
    try {
      const updated = await usersApi.update(id, {
        fullName: values.fullName,
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
                <div className="max-w-md">
                  <Input
                    label="Họ tên"
                    error={errors.fullName?.message}
                    {...register("fullName", { required: "Vui lòng nhập họ tên." })}
                  />
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

          {/* Connected Real Borrowed Books */}
          <UserBorrowingsSection userId={current.id} />

          {/* Connected Real Reading History */}
          <UserReadingHistorySection userId={current.id} />
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
