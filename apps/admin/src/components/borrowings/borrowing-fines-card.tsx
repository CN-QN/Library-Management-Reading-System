"use client";

import { useState } from "react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { finesApi, type Fine } from "@/lib/api/fines";
import { Permissions } from "@/lib/permissions";
import { useAuth } from "@/context/auth-context";

function formatVnd(amount: number) {
  return amount.toLocaleString("vi-VN") + " đ";
}

export function BorrowingFinesCard({
  fines,
  onChanged,
}: {
  fines: Fine[];
  onChanged: (fine: Fine) => void;
}) {
  const { can } = useAuth();
  const { showToast } = useToast();
  const [waivingId, setWaivingId] = useState<string | null>(null);
  const [waiveReason, setWaiveReason] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handlePay(fine: Fine) {
    setBusyId(fine.id);
    try {
      const updated = await finesApi.pay(fine.id);
      onChanged(updated);
      showToast("Đã ghi nhận thanh toán tiền phạt.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể thanh toán tiền phạt.", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function handleWaive(fine: Fine) {
    if (!waiveReason.trim()) {
      showToast("Vui lòng nhập lý do miễn giảm.", "error");
      return;
    }
    setBusyId(fine.id);
    try {
      const updated = await finesApi.waive(fine.id, waiveReason);
      onChanged(updated);
      setWaivingId(null);
      setWaiveReason("");
      showToast("Đã miễn giảm tiền phạt.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể miễn giảm tiền phạt.", "error");
    } finally {
      setBusyId(null);
    }
  }

  if (fines.length === 0) return null;

  return (
    <Card>
      <CardHeader title="Tiền phạt" description="Tự động tạo khi trả sách quá hạn" />
      <CardBody className="space-y-3">
        {fines.map((fine) => (
          <div key={fine.id} className="rounded-lg border border-slate-200 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-slate-900">{formatVnd(fine.amount)}</p>
                <p className="text-xs text-slate-500">{fine.reason}</p>
              </div>
              <StatusBadge status={fine.status} />
            </div>
            {fine.status === "UNPAID" && can(Permissions.FineWaive) && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  isLoading={busyId === fine.id}
                  onClick={() => handlePay(fine)}
                >
                  Ghi nhận đã đóng
                </Button>
                {waivingId === fine.id ? (
                  <>
                    <Input
                      placeholder="Lý do miễn giảm"
                      value={waiveReason}
                      onChange={(e) => setWaiveReason(e.target.value)}
                    />
                    <Button
                      size="sm"
                      variant="danger"
                      isLoading={busyId === fine.id}
                      onClick={() => handleWaive(fine)}
                    >
                      Xác nhận miễn
                    </Button>
                  </>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => setWaivingId(fine.id)}>
                    Miễn giảm
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
