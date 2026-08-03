"use client";

import { use, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAsync } from "@/hooks/use-async";
import { chaptersApi } from "@/lib/api/chapters";
import { ApiError } from "@/lib/api-client";
import { describeErrorCode } from "@/lib/error-codes";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateChapterForm } from "@/components/chapters/chapter-form";

export default function CreateChapterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: bookId } = use(params);
  const router = useRouter();

  const fetchNextNumber = useCallback(() => chaptersApi.getNextNumber(bookId), [bookId]);
  const { data, error, isLoading, retry } = useAsync(fetchNextNumber);

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/books/${bookId}/chapters`}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          ← Quay lại danh sách chương
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">Thêm chương mới</h1>
      </div>

      {isLoading && (
        <Card className="p-6">
          <Skeleton className="h-40 w-full" />
        </Card>
      )}

      {!isLoading && error && (
        <ErrorState
          message={
            error instanceof ApiError
              ? describeErrorCode(error.errorCode, error.message)
              : "Không thể lấy số chương tiếp theo."
          }
          onRetry={retry}
        />
      )}

      {!isLoading && !error && data && (
        <Card>
          <CardHeader title="Thông tin chương" />
          <CardBody>
            <CreateChapterForm
              bookId={bookId}
              nextNumber={data.nextNumber}
              onCreated={(chapter) =>
                router.push(`/books/${bookId}/chapters/${chapter.id}/edit`)
              }
            />
          </CardBody>
        </Card>
      )}
    </div>
  );
}
