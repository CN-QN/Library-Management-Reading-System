"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useAsync } from "@/hooks/use-async";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { usersApi, type AppUser, type UserQuery } from "@/lib/api/users";
import { ApiError } from "@/lib/api-client";
import { describeErrorCode } from "@/lib/error-codes";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ErrorState } from "@/components/ui/error-state";
import { Pagination } from "@/components/ui/pagination";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/table";

const STATUS_OPTIONS = ["ACTIVE", "LOCKED", "SUSPENDED", "PENDING", "DELETED"];
const PAGE_SIZE = 20;

export default function UsersListPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [branchId, setBranchId] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebouncedValue(search);
  const debouncedBranchId = useDebouncedValue(branchId);

  const fetchUsers = useCallback(() => {
    const query: UserQuery = {
      search: debouncedSearch || undefined,
      status: status || undefined,
      branchId: debouncedBranchId || undefined,
      page,
      limit: PAGE_SIZE,
    };
    return usersApi.search(query);
  }, [debouncedSearch, status, debouncedBranchId, page]);

  const { data, error, isLoading, retry } = useAsync(fetchUsers);

  // The list API has no role filter param — this only narrows the
  // already-fetched page client-side, so it can't be combined reliably
  // with pagination. Flagged in the UI note below.
  const visibleUsers = (data?.items ?? []).filter(
    (u) => !roleFilter || u.assignedRoles.some((r) => r.roleCode === roleFilter)
  );

  const columns: Column<AppUser>[] = [
    {
      key: "user",
      header: "Người dùng",
      render: (user) => (
        <div>
          <p className="font-medium text-slate-900">{user.fullName}</p>
          <p className="text-xs text-slate-400">{user.email}</p>
        </div>
      ),
    },
    {
      key: "studentCode",
      header: "Mã sinh viên",
      render: (user) => user.studentCode,
    },
    {
      key: "branch",
      header: "Chi nhánh",
      render: (user) => user.branchId ?? "—",
    },
    {
      key: "roles",
      header: "Vai trò",
      render: (user) => (
        <div className="flex flex-wrap gap-1">
          {user.assignedRoles.length === 0 && "—"}
          {user.assignedRoles.map((r) => (
            <Badge key={r.userRoleId} variant="info">
              {r.roleCode}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (user) => <StatusBadge status={user.status} />,
    },
    {
      key: "actions",
      header: "",
      render: (user) => (
        <div className="flex justify-end">
          <Link
            href={`/users/${user.id}`}
            className="rounded-md px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Xem chi tiết
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900">Quản lý người dùng</h1>
        <Link
          href="/users/create"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          + Thêm người dùng
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          placeholder="Tìm theo tên, email, mã SV..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Tất cả trạng thái</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Input
          placeholder="Lọc theo chi nhánh (ID)"
          value={branchId}
          onChange={(e) => {
            setBranchId(e.target.value);
            setPage(1);
          }}
        />
        <Input
          placeholder="Lọc theo mã vai trò (VD: LIBRARIAN)"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value.toUpperCase())}
        />
      </div>
      {roleFilter && (
        <p className="text-xs text-slate-400">
          Lọc vai trò chỉ áp dụng trong trang hiện tại — API danh sách người dùng chưa hỗ
          trợ lọc vai trò phía server.
        </p>
      )}

      {error ? (
        <ErrorState
          message={
            error instanceof ApiError
              ? describeErrorCode(error.errorCode, error.message)
              : "Không thể tải danh sách người dùng."
          }
          onRetry={retry}
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={visibleUsers}
            isLoading={isLoading}
            emptyMessage="Không tìm thấy người dùng nào phù hợp."
            getRowKey={(user) => user.id}
          />
          {data && (
            <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}
