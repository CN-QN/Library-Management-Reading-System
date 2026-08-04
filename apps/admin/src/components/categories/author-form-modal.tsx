"use client";

import { useForm } from "react-hook-form";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { authorsApi, type Author, type CreateAuthorInput } from "@/lib/api/authors";

interface FormValues {
  name: string;
  biography: string;
  avatar: string;
}

export function AuthorFormModal({
  isOpen,
  onClose,
  author,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  /** null = creating a new author */
  author: Author | null;
  onSaved: () => void;
}) {
  const { showToast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    values: {
      name: author?.name ?? "",
      biography: author?.biography ?? "",
      avatar: author?.avatar ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      const payload: CreateAuthorInput = {
        name: values.name,
        biography: values.biography || undefined,
        avatar: values.avatar || undefined,
      };
      if (author) {
        await authorsApi.update(author.id, payload);
        showToast("Cập nhật tác giả thành công.", "success");
      } else {
        await authorsApi.create(payload);
        showToast("Tạo tác giả thành công.", "success");
      }
      reset();
      onSaved();
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể lưu tác giả.", "error");
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={author ? "Sửa tác giả" : "Thêm tác giả"}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Tên tác giả"
          error={errors.name?.message}
          {...register("name", { required: "Vui lòng nhập tên tác giả." })}
        />
        <Textarea label="Tiểu sử (tùy chọn)" rows={3} {...register("biography")} />
        <Input label="URL ảnh đại diện (tùy chọn)" {...register("avatar")} />
        <Button type="submit" isLoading={isSubmitting} fullWidth>
          {author ? "Lưu thay đổi" : "Tạo tác giả"}
        </Button>
      </form>
    </Modal>
  );
}
