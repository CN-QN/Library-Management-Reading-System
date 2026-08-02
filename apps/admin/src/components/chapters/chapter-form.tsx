"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { ChapterContentEditor } from "./chapter-content-editor";
import {
  chaptersApi,
  emptyChapterContent,
  type Chapter,
  type ChapterContent,
  type CreateChapterInput,
  type UpdateChapterInput,
} from "@/lib/api/chapters";

interface CreateFormValues {
  number: number;
  title: string;
  summary: string;
}

export function CreateChapterForm({
  bookId,
  nextNumber,
  onCreated,
}: {
  bookId: string;
  nextNumber: number;
  onCreated: (chapter: Chapter) => void;
}) {
  const { showToast } = useToast();
  const [content, setContent] = useState<ChapterContent>(emptyChapterContent());
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateFormValues>({
    defaultValues: { number: nextNumber, title: "", summary: "" },
  });

  async function onSubmit(values: CreateFormValues) {
    try {
      const payload: CreateChapterInput = {
        number: Number(values.number),
        title: values.title,
        summary: values.summary || undefined,
        content,
      };
      const chapter = await chaptersApi.create(bookId, payload);
      showToast("Tạo chương thành công.", "success");
      onCreated(chapter);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể tạo chương.";
      if (message.toLowerCase().includes("already exists")) {
        setError("number", { message: "Số chương này đã tồn tại trong sách." });
        return;
      }
      showToast(message, "error");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[120px_1fr]">
        <Input
          label="Số chương"
          type="number"
          error={errors.number?.message}
          {...register("number", { required: true, valueAsNumber: true })}
        />
        <Input
          label="Tên chương"
          error={errors.title?.message}
          {...register("title", { required: "Vui lòng nhập tên chương." })}
        />
      </div>

      <Textarea label="Tóm tắt (tùy chọn)" rows={2} {...register("summary")} />

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Nội dung</label>
        <ChapterContentEditor value={content} onChange={setContent} />
      </div>

      <Button type="submit" isLoading={isSubmitting}>
        Tạo chương
      </Button>
    </form>
  );
}

export function EditChapterForm({
  bookId,
  chapter,
  onSaved,
}: {
  bookId: string;
  chapter: Chapter;
  onSaved: (chapter: Chapter) => void;
}) {
  const { showToast } = useToast();
  const [content, setContent] = useState<ChapterContent>(chapter.content ?? emptyChapterContent());
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<{ title: string; number: number; summary: string }>({
    defaultValues: {
      title: chapter.title,
      number: chapter.number,
      summary: chapter.summary ?? "",
    },
  });

  async function onSubmit(values: { title: string; number: number; summary: string }) {
    try {
      const payload: UpdateChapterInput = {
        title: values.title,
        number: Number(values.number),
        summary: values.summary || undefined,
        content,
      };
      const updated = await chaptersApi.update(bookId, chapter.id, payload);
      showToast("Cập nhật chương thành công.", "success");
      onSaved(updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể cập nhật chương.";
      if (message.toLowerCase().includes("already exists")) {
        setError("number", { message: "Số chương này đã tồn tại trong sách." });
        return;
      }
      showToast(message, "error");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[120px_1fr]">
        <Input
          label="Số chương"
          type="number"
          error={errors.number?.message}
          {...register("number", { required: true, valueAsNumber: true })}
        />
        <Input
          label="Tên chương"
          error={errors.title?.message}
          {...register("title", { required: "Vui lòng nhập tên chương." })}
        />
      </div>

      <Textarea label="Tóm tắt (tùy chọn)" rows={2} {...register("summary")} />

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Nội dung</label>
        <ChapterContentEditor value={content} onChange={setContent} />
      </div>

      <Button type="submit" isLoading={isSubmitting}>
        Lưu thay đổi
      </Button>
    </form>
  );
}
