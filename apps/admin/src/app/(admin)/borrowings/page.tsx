"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useAsync } from "@/hooks/use-async";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  circulationApi,
  isBorrowingOverdue,
  type Borrowing,
  type BorrowingQuery,
} from "@/lib/api/circulation";
import { ApiError } from "@/lib/api-client";
import { describeErrorCode } from "@/lib/error-codes";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ErrorState } from "@/components/ui/error-state";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/table";

const STATUS_OPTIONS = ["OPEN", "PARTIALLY_RETURNED", "RETURNED", "CANCELLED"];
const PAGE_SIZE = 20;

export default function BorrowingsListPage() {
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [userId, setUserId] = useState("");
  const [page, setPage] = useState(1);

  const debouncedKeyword = useDebouncedValue(keyword);
  const debouncedUserId = useDebouncedValue(userId);

  const fetchBorrowings = useCallback(() => {
    const query: BorrowingQuery = {
      keyword: debouncedKeyword || undefined,
      status: status || undefined,
      userId: debouncedUserId || undefined,
      page,
      limit: PAGE_SIZE,
    };
    return circulationApi.search(query);
  }, [debouncedKeyword, status, debouncedUserId, page]);

  const { data, error, isLoading, retry } = useAsync(fetchBorrowings);

  const columns: Column<Borrowing>[] = [
    {
      key: "code",
      header: "Mã phiếu",
      render: (b) => <span className="font-mono text-xs">{b.code}</span>,
    },
    {
      key: "user",
      header: "Người mượn",
      render: (b) => (
        <div>
          <p className="font-medium text-slate-900">{b.userName ?? b.userId}</p>
          <p className="text-xs text-slate-400">{b.studentCode ?? "—"}</p>
        </div>
      ),
    },
    {
      key: "items",
      header: "Số sách",
      render: (b) => `${b.items.length} cuốn`,
    },
    {
      key: "dueDate",
      header: "Hạn trả",
      render: (b) => {
        const overdue = isBorrowingOverdue(b);
        return (
          <span className={overdue ? "font-medium text-red-600" : "text-slate-700"}>
            {new Date(b.expectedReturnAt).toLocaleDateString("vi-VN")}
            {overdue && " (Quá hạn)"}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (b) => <StatusBadge status={b.status} />,
    },
    {
      key: "actions",
      header: "",
      render: (b) => (
        <div className="flex justify-end">
          <Link
            href={`/borrowings/${b.id}`}
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
        <h1 className="text-xl font-semibold text-slate-900">Quản lý mượn / trả</h1>
        <Link
          href="/borrowings/create"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          + Lập phiếu mượn
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Input
          placeholder="Tìm theo mã phiếu, tên, mã SV..."
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
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
          placeholder="Lọc theo User ID"
          value={userId}
          onChange={(e) => {
            setUserId(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {error ? (
        <ErrorState
          message={
            error instanceof ApiError
              ? describeErrorCode(error.errorCode, error.message)
              : "Không thể tải danh sách phiếu mượn."
          }
          onRetry={retry}
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={data?.items ?? []}
            isLoading={isLoading}
            emptyMessage="Không tìm thấy phiếu mượn nào phù hợp."
            getRowKey={(b) => b.id}
          />
          {data && (
            <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}
