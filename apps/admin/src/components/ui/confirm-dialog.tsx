"use client";

import { useState, type ReactNode } from "react";
import { Modal } from "./modal";
import { Button } from "./button";

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Xác nhận",
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleConfirm() {
    setIsSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button variant="danger" isLoading={isSubmitting} onClick={handleConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-sm text-slate-600">{description}</div>
    </Modal>
  );
}
