"use client";

import { useForm } from "react-hook-form";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { categoriesApi, type Category, type CreateCategoryInput } from "@/lib/api/categories";

interface FormValues {
  name: string;
  description: string;
  parentId: string;
  status: string;
  displayOrder: number;
}

export function CategoryFormModal({
  isOpen,
  onClose,
  category,
  allCategories,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  /** null = creating a new category */
  category: Category | null;
  allCategories: Category[];
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
      name: category?.name ?? "",
      description: category?.description ?? "",
      parentId: category?.parentId ?? "",
      status: category?.status ?? "ACTIVE",
      displayOrder: category?.displayOrder ?? 0,
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      const payload: CreateCategoryInput = {
        name: values.name,
        description: values.description || undefined,
        parentId: values.parentId || undefined,
        status: values.status,
        displayOrder: Number(values.displayOrder) || 0,
      };
      if (category) {
        await categoriesApi.update(category.id, payload);
        showToast("Cập nhật thể loại thành công.", "success");
      } else {
        await categoriesApi.create(payload);
        showToast("Tạo thể loại thành công.", "success");
      }
      reset();
      onSaved();
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể lưu thể loại.", "error");
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={category ? "Sửa thể loại" : "Thêm thể loại"}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Tên thể loại"
          error={errors.name?.message}
          {...register("name", { required: "Vui lòng nhập tên thể loại." })}
        />
        <Textarea label="Mô tả (tùy chọn)" rows={2} {...register("description")} />
        <Select label="Thể loại cha (tùy chọn)" {...register("parentId")}>
          <option value="">— Không có —</option>
          {allCategories
            .filter((c) => c.id !== category?.id)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </Select>
        <div className="grid grid-cols-2 gap-4">
          <Select label="Trạng thái" {...register("status")}>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </Select>
          <Input
            label="Thứ tự hiển thị"
            type="number"
            {...register("displayOrder", { valueAsNumber: true })}
          />
        </div>
        <Button type="submit" isLoading={isSubmitting} fullWidth>
          {category ? "Lưu thay đổi" : "Tạo thể loại"}
        </Button>
      </form>
    </Modal>
  );
}
