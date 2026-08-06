"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { campaignsApi, type EmailCampaign } from "@/lib/api/campaigns";

interface CampaignFormValues {
  subject: string;
  body: string;
  campaignType: string;
}

export default function EmailCampaignsPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<EmailCampaign[]>([]);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CampaignFormValues>({
    defaultValues: {
      subject: "",
      body: "",
      campaignType: "NEW_BOOKS",
    },
  });

  const load = useCallback(async () => {
    try {
      setItems(await campaignsApi.list());
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể tải chiến dịch.");
    }
  }, []);

  useEffect(() => {
    // Synchronize the page with persisted campaigns on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function create(values: CampaignFormValues) {
    setError("");
    try {
      const item = await campaignsApi.create({
        subject: values.subject.trim(),
        body: values.body,
        campaignType: values.campaignType,
      });
      setItems((current) => [item, ...current]);
      reset();
      showToast("Đã lưu bản nháp chiến dịch.", "success");
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Không thể tạo chiến dịch.";
      setError(message);
      showToast(message, "error");
    }
  }

  async function send(id: string) {
    setSendingId(id);
    try {
      const sent = await campaignsApi.send(id);
      setItems((current) => current.map((item) => item.id === id ? sent : item));
      showToast(
        `Đã gửi ${sent.sentCount}/${sent.recipientCount} email.`,
        sent.failedCount ? "error" : "success"
      );
    } catch (cause) {
      showToast(cause instanceof Error ? cause.message : "Gửi thất bại.", "error");
    } finally {
      setSendingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Chiến dịch email</h1>
      {error && <p className="bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <form onSubmit={handleSubmit(create)} className="grid gap-3 rounded-xl bg-white p-5" noValidate>
        <Input
          placeholder="Tiêu đề"
          error={errors.subject?.message}
          {...register("subject", { required: "Vui lòng nhập tiêu đề." })}
        />
        <select
          className="rounded-lg border border-slate-200 p-2 text-sm"
          {...register("campaignType")}
        >
          <option value="NEW_BOOKS">NEW_BOOKS</option>
          <option value="VOUCHER">VOUCHER</option>
          <option value="FLASH_SALE">FLASH_SALE</option>
        </select>
        <div>
          <textarea
            className="min-h-32 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-slate-400"
            placeholder="Nội dung HTML"
            aria-invalid={Boolean(errors.body)}
            {...register("body", { required: "Vui lòng nhập nội dung email." })}
          />
          {errors.body && <p className="mt-1 text-sm text-red-600">{errors.body.message}</p>}
        </div>
        <Button type="submit" isLoading={isSubmitting}>Lưu bản nháp</Button>
      </form>

      <div className="divide-y divide-slate-100 rounded-xl bg-white">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-4">
            <div>
              <p className="font-semibold">{item.subject}</p>
              <p className="text-xs text-slate-500">
                {item.campaignType} · {item.status} · gửi {item.sentCount}/{item.recipientCount} · lỗi {item.failedCount}
              </p>
            </div>
            <Button
              disabled={sendingId !== null || item.status === "SENT"}
              isLoading={sendingId === item.id}
              onClick={() => void send(item.id)}
            >
              Gửi
            </Button>
          </div>
        ))}
        {!items.length && <p className="p-6 text-center text-sm text-slate-400">Chưa có chiến dịch.</p>}
      </div>
    </div>
  );
}
