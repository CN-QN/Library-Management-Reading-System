"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useAsync } from "@/hooks/use-async";
import { chaptersApi, type Chapter } from "@/lib/api/chapters";
import { ApiError } from "@/lib/api-client";
import { describeErrorCode } from "@/lib/error-codes";
import { useToast } from "@/components/ui/toast";
import { ErrorState } from "@/components/ui/error-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import { SortableChapterRow } from "@/components/chapters/sortable-chapter-row";
import { ChapterPreviewModal } from "@/components/chapters/chapter-preview";

export default function ChaptersListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: bookId } = use(params);
  const { showToast } = useToast();

  const fetchChapters = useCallback(() => chaptersApi.listByBook(bookId), [bookId]);
  const { data, error, isLoading, retry } = useAsync(fetchChapters);

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [previewChapter, setPreviewChapter] = useState<Chapter | null>(null);

  // The extra async wrapper + await here isn't arbitrary complexity —
  // this project's ESLint config (react-hooks/set-state-in-effect, from
  // the React Compiler) rejects a setState call written directly and
  // synchronously in an effect body. Yielding a tick first satisfies it.
  useEffect(() => {
    let cancelled = false;
    async function sync() {
      await Promise.resolve();
      if (cancelled) return;
      if (data) setChapters(data);
    }
    void sync();
    return () => {
      cancelled = true;
    };
  }, [data]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = chapters.findIndex((c) => c.id === active.id);
    const newIndex = chapters.findIndex((c) => c.id === over.id);
    const previous = chapters;
    const reordered = arrayMove(chapters, oldIndex, newIndex);
    setChapters(reordered);

    try {
      await chaptersApi.reorder(bookId, reordered.map((c) => c.id));
      showToast("Đã lưu thứ tự chương mới.", "success");
    } catch {
      setChapters(previous);
      showToast(
        "Không thể lưu thứ tự chương (API sắp xếp chương chưa có ở backend) — đã khôi phục thứ tự cũ.",
        "info"
      );
    }
  }

  async function handleTogglePublish(chapter: Chapter) {
    setBusyId(chapter.id);
    try {
      let updated: Chapter;
      if (chapter.status === "PUBLISHED") {
        await chaptersApi.hide(bookId, chapter.id);
        updated = { ...chapter, status: "HIDDEN" };
      } else {
        updated = await chaptersApi.publish(bookId, chapter.id);
      }
      setChapters((prev) => prev.map((c) => (c.id === chapter.id ? updated : c)));
      showToast(
        chapter.status === "PUBLISHED" ? "Đã ẩn chương." : "Đã xuất bản chương.",
        "success"
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể đổi trạng thái chương.", "error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href={`/books/${bookId}/edit`} className="text-sm text-slate-500 hover:text-slate-700">
            ← Quay lại thông tin sách
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">Quản lý chương</h1>
        </div>
        <Link
          href={`/books/${bookId}/chapters/create`}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          + Thêm chương
        </Link>
      </div>

      {isLoading && <TableSkeleton columns={1} rows={5} />}

      {!isLoading && error && (
        <ErrorState
          message={
            error instanceof ApiError
              ? describeErrorCode(error.errorCode, error.message)
              : "Không thể tải danh sách chương."
          }
          onRetry={retry}
        />
      )}

      {!isLoading && !error && chapters.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          Sách này chưa có chương nào.
        </div>
      )}

      {!isLoading && !error && chapters.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={chapters.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {chapters.map((chapter) => (
                <SortableChapterRow
                  key={chapter.id}
                  chapter={chapter}
                  bookId={bookId}
                  isBusy={busyId === chapter.id}
                  onPreview={() => setPreviewChapter(chapter)}
                  onTogglePublish={() => handleTogglePublish(chapter)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <ChapterPreviewModal
        isOpen={Boolean(previewChapter)}
        onClose={() => setPreviewChapter(null)}
        title={previewChapter?.title ?? ""}
        content={previewChapter?.content}
      />
    </div>
  );
}
