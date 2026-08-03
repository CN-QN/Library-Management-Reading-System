"use client";

import { use, useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAsync } from "@/hooks/use-async";
import { booksApi, type Book } from "@/lib/api/books";
import { ApiError } from "@/lib/api-client";
import { describeErrorCode } from "@/lib/error-codes";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/context/auth-context";
import { Card, CardHeader, CardBody, CardFooter } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EditBookForm } from "@/components/books/book-form";
import { ArchiveBookDialog } from "@/components/books/archive-book-dialog";
import { Permissions } from "@/lib/permissions";

const NEXT_STATUS: Record<string, { label: string; status: string }[]> = {
  DRAFT: [{ label: "Gửi duyệt", status: "REVIEW" }],
  REVIEW: [{ label: "Xuất bản", status: "PUBLISHED" }],
  PUBLISHED: [{ label: "Chuyển về nháp", status: "DRAFT" }],
  ARCHIVED: [{ label: "Khôi phục về nháp", status: "DRAFT" }],
};

export default function EditBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { showToast } = useToast();
  const { can } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);

  const fetchBook = useCallback(() => booksApi.getById(id), [id]);
  const { data, error, isLoading, retry } = useAsync(fetchBook);

  const current = book ?? data;

  async function handleStatusChange(status: string) {
    if (!current) return;
    setIsChangingStatus(true);
    try {
      const updated = await booksApi.updateStatus(current.id, status);
      setBook(updated);
      showToast(`Đã chuyển trạng thái sang ${status}.`, "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể đổi trạng thái.", "error");
    } finally {
      setIsChangingStatus(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Link href="/books" className="text-sm text-slate-500 hover:text-slate-700">
          ← Quay lại danh sách sách
        </Link>
        <div className="mt-1 flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold text-slate-900">
            {current ? current.title : "Sửa sách"}
          </h1>
          <Link
            href={`/books/${id}/chapters`}
            className="shrink-0 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Quản lý chương →
          </Link>
        </div>
      </div>

      {isLoading && (
        <Card className="p-6">
          <Skeleton className="mb-3 h-6 w-1/3" />
          <Skeleton className="mb-2 h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </Card>
      )}

      {!isLoading && error && (
        <ErrorState
          message={
            error instanceof ApiError
              ? describeErrorCode(error.errorCode, error.message)
              : "Không thể tải thông tin sách."
          }
          onRetry={retry}
        />
      )}

      {!isLoading && !error && current && (
        <>
          <Card>
            <CardHeader
              title="Trạng thái"
              description={<StatusBadge status={current.status} />}
              action={
                can(Permissions.BookPublish) ? (
                  <div className="flex gap-2">
                    {(NEXT_STATUS[current.status] ?? []).map((opt) => (
                      <Button
                        key={opt.status}
                        size="sm"
                        variant="outline"
                        isLoading={isChangingStatus}
                        onClick={() => handleStatusChange(opt.status)}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                ) : undefined
              }
            />
          </Card>

          <Card>
            <CardHeader title="Thông tin sách" />
            <CardBody>
              <EditBookForm book={current} onSaved={setBook} />
            </CardBody>
            {can(Permissions.BookDelete) && current.status !== "ARCHIVED" && (
              <CardFooter className="flex justify-end">
                <Button variant="danger" size="sm" onClick={() => setShowArchiveDialog(true)}>
                  Lưu trữ sách
                </Button>
              </CardFooter>
            )}
          </Card>
        </>
      )}

      <ArchiveBookDialog
        book={showArchiveDialog ? current ?? null : null}
        onClose={() => setShowArchiveDialog(false)}
        onArchived={() => router.push("/books")}
      />
    </div>
  );
}
