"use client";

import { use, useCallback, useState } from "react";
import Link from "next/link";
import { useAsync } from "@/hooks/use-async";
import {
  circulationApi,
  type Borrowing,
  type BorrowingItem,
  type ReturnItemInput,
} from "@/lib/api/circulation";
import { finesApi, type Fine } from "@/lib/api/fines";
import { ApiError } from "@/lib/api-client";
import { describeErrorCode } from "@/lib/error-codes";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/context/auth-context";
import { Card, CardHeader, CardBody, CardFooter } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/badge";
import { MarkItemStatusModal } from "@/components/borrowings/mark-item-status-modal";
import { BorrowingFinesCard } from "@/components/borrowings/borrowing-fines-card";
import { Permissions } from "@/lib/permissions";

const CONDITIONS = ["GOOD", "DAMAGED"];

function isItemOverdue(item: BorrowingItem) {
  return item.status === "BORROWED" && new Date(item.dueAt).getTime() < Date.now();
}

export default function BorrowingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { showToast } = useToast();
  const { can } = useAuth();

  const [borrowing, setBorrowing] = useState<Borrowing | null>(null);
  const [selectedForReturn, setSelectedForReturn] = useState<Record<string, boolean>>({});
  const [conditionByItem, setConditionByItem] = useState<Record<string, string>>({});
  const [isReturning, setIsReturning] = useState(false);
  const [renewingItemId, setRenewingItemId] = useState<string | null>(null);
  const [markItemTarget, setMarkItemTarget] = useState<BorrowingItem | null>(null);
  const [fines, setFines] = useState<Fine[] | null>(null);

  const fetchBorrowing = useCallback(() => circulationApi.getById(id), [id]);
  const { data, error, isLoading, retry } = useAsync(fetchBorrowing);
  const current = borrowing ?? data;

  const fetchFines = useCallback(() => {
    if (!current) return Promise.resolve<Fine[]>([]);
    return finesApi.search({ userId: current.userId, page: 1, limit: 50 }).then((r) => r.items);
  }, [current]);
  const { data: fetchedFines } = useAsync(fetchFines);
  const relevantFines = (fines ?? fetchedFines ?? []).filter((f) => f.borrowingId === id);

  function toggleReturnSelection(item: BorrowingItem) {
    setSelectedForReturn((prev) => ({ ...prev, [item.id]: !prev[item.id] }));
    if (!conditionByItem[item.id]) {
      setConditionByItem((prev) => ({ ...prev, [item.id]: "GOOD" }));
    }
  }

  async function handleConfirmReturn() {
    if (!current) return;
    const items: ReturnItemInput[] = Object.entries(selectedForReturn)
      .filter(([, checked]) => checked)
      .map(([itemId]) => ({ itemId, conditionIn: conditionByItem[itemId] ?? "GOOD" }));

    if (items.length === 0) {
      showToast("Vui lòng chọn ít nhất 1 cuốn để trả.", "error");
      return;
    }

    setIsReturning(true);
    try {
      const updated = await circulationApi.returnItems(current.id, items);
      setBorrowing(updated);
      setSelectedForReturn({});
      showToast("Đã ghi nhận trả sách.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể xử lý trả sách.", "error");
    } finally {
      setIsReturning(false);
    }
  }

  async function handleRenew(item: BorrowingItem) {
    setRenewingItemId(item.id);
    try {
      const updatedItem = await circulationApi.renewItem(item.id, 7);
      setBorrowing((prev) =>
        prev
          ? { ...prev, items: prev.items.map((i) => (i.id === item.id ? updatedItem : i)) }
          : prev
      );
      showToast("Đã gia hạn thêm 7 ngày.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể gia hạn.", "error");
    } finally {
      setRenewingItemId(null);
    }
  }

  async function handleMarkStatus(status: "LOST" | "DAMAGED", note: string) {
    if (!markItemTarget) return;
    try {
      const updatedItem = await circulationApi.markItemStatus(markItemTarget.id, status, undefined, note);
      setBorrowing((prev) =>
        prev
          ? { ...prev, items: prev.items.map((i) => (i.id === markItemTarget.id ? updatedItem : i)) }
          : prev
      );
      showToast("Đã cập nhật trạng thái sách.", "success");
      setMarkItemTarget(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể cập nhật trạng thái.", "error");
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Link href="/borrowings" className="text-sm text-slate-500 hover:text-slate-700">
          ← Quay lại danh sách phiếu mượn
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">
          {current ? `Phiếu mượn ${current.code}` : "Chi tiết phiếu mượn"}
        </h1>
      </div>

      {isLoading && (
        <Card className="p-6">
          <Skeleton className="h-32 w-full" />
        </Card>
      )}

      {!isLoading && error && (
        <ErrorState
          message={
            error instanceof ApiError
              ? describeErrorCode(error.errorCode, error.message)
              : "Không thể tải thông tin phiếu mượn."
          }
          onRetry={retry}
        />
      )}

      {!isLoading && !error && current && (
        <>
          <Card>
            <CardHeader
              title={current.userName ?? current.userId}
              description={`Mã SV: ${current.studentCode ?? "—"} · Chi nhánh: ${current.branchName ?? current.branchId}`}
              action={<StatusBadge status={current.status} />}
            />
            <CardBody className="grid grid-cols-1 gap-2 text-sm text-slate-600 sm:grid-cols-3">
              <p>Ngày mượn: {new Date(current.borrowedAt).toLocaleDateString("vi-VN")}</p>
              <p>Hạn trả: {new Date(current.expectedReturnAt).toLocaleDateString("vi-VN")}</p>
              <p>Ghi chú: {current.note ?? "—"}</p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Sách trong phiếu" />
            <CardBody className="space-y-2">
              {current.items.map((item) => {
                const overdue = isItemOverdue(item);
                return (
                  <div
                    key={item.id}
                    className={`rounded-lg border p-3 ${overdue ? "border-red-200 bg-red-50" : "border-slate-200"}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {item.status === "BORROWED" && can(Permissions.LoanReturn) && (
                          <input
                            type="checkbox"
                            checked={Boolean(selectedForReturn[item.id])}
                            onChange={() => toggleReturnSelection(item)}
                            className="h-4 w-4"
                          />
                        )}
                        <div>
                          <p className="font-medium text-slate-900">{item.bookTitle}</p>
                          <p className="text-xs text-slate-500">
                            Barcode <span className="font-mono">{item.barcode}</span>
                            {item.shelfCode && ` · Kệ ${item.shelfCode}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${overdue ? "font-medium text-red-600" : "text-slate-500"}`}>
                          Hạn: {new Date(item.dueAt).toLocaleDateString("vi-VN")}
                          {overdue && " (Quá hạn)"}
                        </span>
                        <StatusBadge status={item.status} />
                      </div>
                    </div>

                    {selectedForReturn[item.id] && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-slate-500">Tình trạng khi trả:</span>
                        <Select
                          value={conditionByItem[item.id] ?? "GOOD"}
                          onChange={(e) =>
                            setConditionByItem((prev) => ({ ...prev, [item.id]: e.target.value }))
                          }
                          className="w-40"
                        >
                          {CONDITIONS.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </Select>
                      </div>
                    )}

                    {item.status === "BORROWED" && (
                      <div className="mt-2 flex gap-2">
                        {can(Permissions.LoanExtend) && (
                          <Button
                            size="sm"
                            variant="outline"
                            isLoading={renewingItemId === item.id}
                            onClick={() => handleRenew(item)}
                          >
                            Gia hạn 7 ngày
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => setMarkItemTarget(item)}>
                          Báo mất/hỏng
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardBody>
            {can(Permissions.LoanReturn) && (
              <CardFooter>
                <Button isLoading={isReturning} onClick={handleConfirmReturn}>
                  Xác nhận trả sách đã chọn
                </Button>
              </CardFooter>
            )}
          </Card>

          <BorrowingFinesCard
            fines={relevantFines}
            onChanged={(updated) =>
              setFines((prev) =>
                (prev ?? fetchedFines ?? []).map((f) => (f.id === updated.id ? updated : f))
              )
            }
          />

          <MarkItemStatusModal
            isOpen={Boolean(markItemTarget)}
            bookTitle={markItemTarget?.bookTitle ?? ""}
            onClose={() => setMarkItemTarget(null)}
            onConfirm={handleMarkStatus}
          />
        </>
      )}
    </div>
  );
}
