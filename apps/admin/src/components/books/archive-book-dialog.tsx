"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { booksApi, type Book } from "@/lib/api/books";

export function ArchiveBookDialog({
  book,
  onClose,
  onArchived,
}: {
  book: Book | null;
  onClose: () => void;
  onArchived: () => void;
}) {
  const { showToast } = useToast();
  const [isArchiving, setIsArchiving] = useState(false);

  async function handleConfirm() {
    if (!book) return;
    setIsArchiving(true);
    try {
      await booksApi.archive(book.id);
      showToast(`Đã lưu trữ sách "${book.title}".`, "success");
      onArchived();
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể lưu trữ sách.", "error");
    } finally {
      setIsArchiving(false);
    }
  }

  return (
    <Modal
      isOpen={Boolean(book)}
      onClose={onClose}
      title="Lưu trữ sách"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button variant="danger" isLoading={isArchiving} onClick={handleConfirm}>
            Lưu trữ
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-600">
        Bạn có chắc muốn lưu trữ sách <span className="font-medium">&quot;{book?.title}&quot;</span>?
        Sách sẽ chuyển sang trạng thái <span className="font-medium">ARCHIVED</span> và ẩn
        khỏi danh sách công khai. Thao tác này có thể phục hồi sau bằng cách đổi lại trạng thái.
      </p>
    </Modal>
  );
}
