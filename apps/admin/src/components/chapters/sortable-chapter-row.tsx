"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Chapter } from "@/lib/api/chapters";

export function SortableChapterRow({
  chapter,
  bookId,
  isBusy,
  onPreview,
  onTogglePublish,
}: {
  chapter: Chapter;
  bookId: string;
  isBusy: boolean;
  onPreview: () => void;
  onTogglePublish: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: chapter.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 ${
        isDragging ? "opacity-60 shadow-lg" : ""
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Kéo để sắp xếp lại"
        className="cursor-grab touch-none rounded p-1 text-slate-400 hover:bg-slate-100 active:cursor-grabbing"
      >
        ⠿
      </button>

      <span className="w-8 shrink-0 text-center text-sm font-semibold text-slate-400">
        {chapter.number}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">{chapter.title}</p>
        <p className="text-xs text-slate-400">{chapter.wordCount.toLocaleString("vi-VN")} từ</p>
      </div>

      <StatusBadge status={chapter.status} />

      <div className="flex shrink-0 items-center gap-1">
        <Button variant="ghost" size="sm" onClick={onPreview}>
          Xem trước
        </Button>
        <Link
          href={`/books/${bookId}/chapters/${chapter.id}/edit`}
          className="rounded-md px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Sửa
        </Link>
        <Button
          variant="outline"
          size="sm"
          isLoading={isBusy}
          onClick={onTogglePublish}
        >
          {chapter.status === "PUBLISHED" ? "Ẩn chương" : "Xuất bản"}
        </Button>
      </div>
    </div>
  );
}
