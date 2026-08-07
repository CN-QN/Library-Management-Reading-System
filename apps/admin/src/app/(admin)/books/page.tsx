"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useAsync } from "@/hooks/use-async";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { booksApi, type Book, type BookQuery } from "@/lib/api/books";
import { ApiError } from "@/lib/api-client";
import { describeErrorCode } from "@/lib/error-codes";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ErrorState } from "@/components/ui/error-state";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/badge";
import { BookCover } from "@/components/ui/book-cover";
import { DataTable, type Column } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/context/auth-context";
import { Permissions } from "@/lib/permissions";

const STATUS_OPTIONS = ["DRAFT", "PUBLISHED"];
const ACCESS_TYPE_OPTIONS = ["FREE", "PREMIUM", "PHYSICAL_ONLY"];
const PAGE_SIZE = 10;

type SortField = "title" | "createdAt" | "updatedAt";

export default function BooksListPage() {
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [accessType, setAccessType] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [changingStatusBookId, setChangingStatusBookId] = useState<string | null>(null);
  const { showToast } = useToast();
  const { can } = useAuth();

  const debouncedKeyword = useDebouncedValue(keyword);

  const fetchBooks = useCallback(() => {
    const query: BookQuery = {
      keyword: debouncedKeyword || undefined,
      status: status || undefined,
      accessType: accessType || undefined,
      page,
      limit: PAGE_SIZE,
      sortBy,
      sortOrder,
    };
    return booksApi.search(query);
  }, [debouncedKeyword, status, accessType, page, sortBy, sortOrder]);

  const { data, error, isLoading, retry } = useAsync(fetchBooks);

  function toggleSort(field: SortField) {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(1);
  }

  function sortIndicator(field: SortField) {
    if (sortBy !== field) return null;
    return sortOrder === "asc" ? " ▲" : " ▼";
  }

  async function changeBookStatus(book: Book, status: "DRAFT" | "PUBLISHED") {
    setChangingStatusBookId(book.id);
    try {
      await booksApi.updateStatus(book.id, status);
      showToast(status === "PUBLISHED" ? `Đã xuất bản “${book.title}”.` : `Đã chuyển “${book.title}” về nháp.`, "success");
      retry();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể xuất bản sách.", "error");
    } finally {
      setChangingStatusBookId(null);
    }
  }

  const columns: Column<Book>[] = [
    {
      key: "title",
      header: (
        <button type="button" onClick={() => toggleSort("title")} className="hover:text-slate-700">
          Sách{sortIndicator("title")}
        </button>
      ),
      render: (book) => (
        <div className="flex items-center gap-3">
          <BookCover title={book.title} size={32} coverUrl={book.coverImageUrl ?? book.coverAssetId} />
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-900">{book.title}</p>
            <p className="truncate text-xs text-slate-400">{book.isbn ?? "Chưa có ISBN"}</p>
          </div>
        </div>
      ),
    },
    {
      key: "authors",
      header: "Tác giả",
      render: (book) => book.authorNames?.join(", ") || "—",
    },
    {
      key: "category",
      header: "Thể loại",
      render: (book) => book.categoryNames?.join(", ") || "—",
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (book) => <StatusBadge status={book.status} />,
    },
    {
      key: "chapters",
      header: "Số chương",
      render: (book) => book.totalChapters,
    },
    {
      key: "updatedAt",
      header: (
        <button
          type="button"
          onClick={() => toggleSort("updatedAt")}
          className="hover:text-slate-700"
        >
          Cập nhật{sortIndicator("updatedAt")}
        </button>
      ),
      render: (book) => new Date(book.updatedAt).toLocaleDateString("vi-VN"),
    },
    {
      key: "actions",
      header: "",
      render: (book) => (
        <div className="flex justify-end gap-2">
          <Link
            href={`/books/${book.id}/chapters`}
            className="rounded-md px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Chương
          </Link>
          <Link
            href={`/books/${book.id}/edit`}
            className="rounded-md px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Sửa
          </Link>
          {can(Permissions.BookPublish) && book.status === "DRAFT" && (
            <button
              type="button"
              onClick={() => void changeBookStatus(book, "PUBLISHED")}
              disabled={changingStatusBookId === book.id}
              className="rounded-md px-2 py-1 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {changingStatusBookId === book.id ? "Đang xuất bản…" : "Xuất bản"}
            </button>
          )}
          {can(Permissions.BookPublish) && book.status === "PUBLISHED" && (
            <button
              type="button"
              onClick={() => void changeBookStatus(book, "DRAFT")}
              disabled={changingStatusBookId === book.id}
              className="rounded-md px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {changingStatusBookId === book.id ? "Đang chuyển…" : "Chuyển về nháp"}
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900">Quản lý sách</h1>
        <Link
          href="/books/create"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          + Thêm sách
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Input
          placeholder="Tìm theo tên sách..."
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
        <Select
          value={accessType}
          onChange={(e) => {
            setAccessType(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Tất cả loại truy cập</option>
          {ACCESS_TYPE_OPTIONS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </Select>
      </div>

      {error ? (
        <ErrorState
          message={
            error instanceof ApiError
              ? describeErrorCode(error.errorCode, error.message)
              : "Không thể tải danh sách sách."
          }
          onRetry={retry}
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={data?.items ?? []}
            isLoading={isLoading}
            emptyMessage="Không tìm thấy sách nào phù hợp."
            getRowKey={(book) => book.id}
          />
          {data && (
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
