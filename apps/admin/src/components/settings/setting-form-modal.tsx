"use client";

import { useForm } from "react-hook-form";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { settingsApi, type SystemSetting } from "@/lib/api/settings";

interface FormValues {
  key: string;
  value: string;
  scope: string;
  description: string;
}

export function SettingFormModal({
  isOpen,
  onClose,
  setting,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  /** null = creating a new setting */
  setting: SystemSetting | null;
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
      key: setting?.key ?? "",
      value: setting?.value ?? "",
      scope: setting?.scope ?? "SYSTEM",
      description: setting?.description ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      await settingsApi.update(values.key, {
        value: values.value,
        scope: values.scope || undefined,
        description: values.description || undefined,
      });
      showToast(setting ? "Cập nhật cài đặt thành công." : "Tạo cài đặt thành công.", "success");
      reset();
      onSaved();
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể lưu cài đặt.", "error");
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={setting ? "Sửa cài đặt" : "Thêm cài đặt mới"}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Key"
          disabled={Boolean(setting)}
          error={errors.key?.message}
          {...register("key", { required: "Vui lòng nhập key." })}
        />
        <Input
          label="Giá trị (Value)"
          error={errors.value?.message}
          {...register("value", { required: "Vui lòng nhập giá trị." })}
        />
        <Input label="Phạm vi (Scope)" {...register("scope")} />
        <Textarea label="Mô tả (tùy chọn)" rows={2} {...register("description")} />
        <Button type="submit" isLoading={isSubmitting} fullWidth>
          {setting ? "Lưu thay đổi" : "Tạo cài đặt"}
        </Button>
      </form>
    </Modal>
  );
}
