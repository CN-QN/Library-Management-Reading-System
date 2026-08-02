"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function MarkItemStatusModal({
  isOpen,
  bookTitle,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  bookTitle: string;
  onClose: () => void;
  onConfirm: (status: "LOST" | "DAMAGED", note: string) => Promise<void>;
}) {
  const [status, setStatus] = useState<"LOST" | "DAMAGED">("LOST");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleConfirm() {
    setIsSubmitting(true);
    try {
      await onConfirm(status, note);
      setNote("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Báo mất/hỏng: ${bookTitle}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button variant="danger" isLoading={isSubmitting} onClick={handleConfirm}>
            Xác nhận
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={status === "LOST" ? "primary" : "outline"}
            onClick={() => setStatus("LOST")}
          >
            Mất sách
          </Button>
          <Button
            type="button"
            size="sm"
            variant={status === "DAMAGED" ? "primary" : "outline"}
            onClick={() => setStatus("DAMAGED")}
          >
            Hư hỏng
          </Button>
        </div>
        <Input label="Ghi chú (tùy chọn)" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
    </Modal>
  );
}
