"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { UserPicker } from "@/components/borrowings/user-picker";
import { BookCopyPicker } from "@/components/borrowings/book-copy-picker";
import type { AppUser } from "@/lib/api/users";
import type { Copy } from "@/lib/api/copies";
import { circulationApi } from "@/lib/api/circulation";

const MAX_COPIES = 5;

export default function CreateBorrowingPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [user, setUser] = useState<AppUser | null>(null);
  const [cart, setCart] = useState<Copy[]>([]);
  const [branchId, setBranchId] = useState("");
  const [daysToBorrow, setDaysToBorrow] = useState(14);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleSelectUser(selected: AppUser) {
    setUser(selected);
    if (selected?.branchId) setBranchId(selected.branchId);
  }

  function addCopy(copy: Copy) {
    if (cart.length >= MAX_COPIES) {
      showToast(`Mỗi phiếu mượn chỉ được tối đa ${MAX_COPIES} cuốn.`, "info");
      return;
    }
    setCart((prev) => [...prev, copy]);
  }

  function removeCopy(copyId: string) {
    setCart((prev) => prev.filter((c) => c.id !== copyId));
  }

  async function handleSubmit() {
    if (!user) {
      showToast("Vui lòng chọn người mượn.", "error");
      return;
    }
    if (cart.length === 0) {
      showToast("Vui lòng thêm ít nhất 1 cuốn sách.", "error");
      return;
    }
    if (!branchId) {
      showToast("Vui lòng nhập chi nhánh.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const borrowing = await circulationApi.create({
        userId: user.id,
        branchId,
        copyIds: cart.map((c) => c.id),
        daysToBorrow,
        note: note || undefined,
      });
      showToast("Lập phiếu mượn thành công.", "success");
      router.push(`/borrowings/${borrowing.id}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể lập phiếu mượn.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Link href="/borrowings" className="text-sm text-slate-500 hover:text-slate-700">
          ← Quay lại danh sách phiếu mượn
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">Lập phiếu mượn sách</h1>
      </div>

      <Card>
        <CardHeader title="1. Người mượn" />
        <CardBody>
          <UserPicker selected={user} onSelect={handleSelectUser} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="2. Sách mượn"
          description={`${cart.length}/${MAX_COPIES} cuốn`}
        />
        <CardBody className="space-y-3">
          {cart.length > 0 && (
            <div className="space-y-1">
              {cart.map((copy) => (
                <div
                  key={copy.id}
                  className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm"
                >
                  <span>
                    {copy.bookTitle}{" "}
                    <span className="text-slate-400">
                      (barcode <span className="font-mono">{copy.barcode}</span>)
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeCopy(copy.id)}
                    className="text-slate-400 hover:text-red-600"
                  >
                    Bỏ
                  </button>
                </div>
              ))}
            </div>
          )}
          {cart.length < MAX_COPIES && (
            <BookCopyPicker disabledCopyIds={cart.map((c) => c.id)} onAddCopy={addCopy} />
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="3. Chi tiết phiếu mượn" />
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Chi nhánh (ID)"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
            />
            <Input
              label="Số ngày mượn"
              type="number"
              min={1}
              max={30}
              value={daysToBorrow}
              onChange={(e) => setDaysToBorrow(Number(e.target.value))}
            />
          </div>
          <Input label="Ghi chú (tùy chọn)" value={note} onChange={(e) => setNote(e.target.value)} />
          <Button isLoading={isSubmitting} onClick={handleSubmit}>
            Xác nhận cho mượn
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
