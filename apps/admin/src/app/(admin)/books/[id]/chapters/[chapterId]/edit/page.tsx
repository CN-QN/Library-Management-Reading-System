"use client";

import { use, useCallback, useState } from "react";
import Link from "next/link";
import { useAsync } from "@/hooks/use-async";
import { chaptersApi, type Chapter } from "@/lib/api/chapters";
import { ApiError } from "@/lib/api-client";
import { describeErrorCode } from "@/lib/error-codes";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/badge";
import { EditChapterForm } from "@/components/chapters/chapter-form";

export default function EditChapterPage({
  params,
}: {
  params: Promise<{ id: string; chapterId: string }>;
}) {
  const { id: bookId, chapterId } = use(params);
  const [chapter, setChapter] = useState<Chapter | null>(null);

  const fetchChapter = useCallback(
    () => chaptersApi.getById(bookId, chapterId),
    [bookId, chapterId]
  );
  const { data, error, isLoading, retry } = useAsync(fetchChapter);

  const current = chapter ?? data;

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/books/${bookId}/chapters`}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          ← Quay lại danh sách chương
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">
          {current ? current.title : "Sửa chương"}
        </h1>
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
              : "Không thể tải thông tin chương."
          }
          onRetry={retry}
        />
      )}

      {!isLoading && !error && current && (
        <Card>
          <CardHeader title="Thông tin chương" description={<StatusBadge status={current.status} />} />
          <CardBody>
            <EditChapterForm bookId={bookId} chapter={current} onSaved={setChapter} />
          </CardBody>
        </Card>
      )}
    </div>
  );
}
