"use client";

import { useCallback, useState } from "react";
import { useAsync } from "@/hooks/use-async";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { booksApi } from "@/lib/api/books";
import { copiesApi, type Copy } from "@/lib/api/copies";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Sẵn có",
  BORROWED: "Đang mượn",
  RESERVED: "Đã đặt trước",
  LOST: "Đã mất",
  DAMAGED: "Hư hỏng",
  MAINTENANCE: "Bảo trì",
};

export function BookCopyPicker({
  disabledCopyIds,
  onAddCopy,
}: {
  disabledCopyIds: string[];
  onAddCopy: (copy: Copy) => void;
}) {
  const [bookSearch, setBookSearch] = useState("");
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(bookSearch, 300);

  // Search books by title/author/ISBN
  const fetchBooks = useCallback(() => {
    if (!debouncedSearch) {
      return Promise.resolve({ items: [], page: 1, limit: 5, totalItems: 0, totalPages: 0, hasNext: false });
    }
    return booksApi.search({
      keyword: debouncedSearch,
      page: 1,
      limit: 5,
      sortBy: "title",
      sortOrder: "asc",
    });
  }, [debouncedSearch]);
  const { data: bookResults } = useAsync(fetchBooks);

  // Search copies directly by barcode/shelfCode
  const fetchCopySearchResults = useCallback(() => {
    if (!debouncedSearch || debouncedSearch.length < 3) return Promise.resolve({ items: [], totalItems: 0 });
    return copiesApi.search(debouncedSearch).catch(() => ({ items: [], totalItems: 0 }));
  }, [debouncedSearch]);
  const { data: copySearchResults } = useAsync(fetchCopySearchResults);

  // Fetch copies for selected book
  const fetchCopies = useCallback(() => {
    if (!selectedBookId) return Promise.resolve([]);
    return copiesApi.getByBookId(selectedBookId);
  }, [selectedBookId]);
  const { data: copies, isLoading: isLoadingCopies } = useAsync(fetchCopies);

  return (
    <div className="space-y-2">
      <Input
        placeholder="Tìm theo tên sách hoặc mã barcode (ví dụ: BC0000000073)..."
        value={bookSearch}
        onChange={(e) => {
          setBookSearch(e.target.value);
          setSelectedBookId(null);
        }}
      />

      {/* Direct copy search by barcode */}
      {!selectedBookId && copySearchResults && copySearchResults.items && copySearchResults.items.length > 0 && (
        <div className="rounded-md border border-slate-200 bg-white p-2 shadow-sm space-y-1">
          <p className="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Kết quả tìm theo Barcode</p>
          {copySearchResults.items.map((copy) => {
            const alreadyAdded = disabledCopyIds.includes(copy.id);
            const isAvailable = copy.status === "AVAILABLE";
            const statusLabel = STATUS_LABELS[copy.status] || copy.status;

            return (
              <div
                key={copy.id}
                className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-slate-50 border border-slate-100"
              >
                <div>
                  <span className="font-medium text-slate-900">{copy.bookTitle}</span>{" "}
                  <span className="text-slate-500 font-mono text-xs">(Barcode: {copy.barcode})</span>
                  {copy.shelfCode && <span className="text-slate-400 text-xs"> · Kệ {copy.shelfCode}</span>}
                  {!isAvailable && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-600/20 ring-inset">
                      {statusLabel}
                    </span>
                  )}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={isAvailable ? "outline" : "ghost"}
                  disabled={alreadyAdded || !isAvailable}
                  onClick={() => isAvailable && onAddCopy(copy)}
                >
                  {!isAvailable ? statusLabel : alreadyAdded ? "Đã thêm" : "+ Thêm"}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Search results for book titles */}
      {!selectedBookId && bookResults && bookResults.items.length > 0 && (
        <div className="divide-y divide-slate-100 rounded-md border border-slate-200 bg-white shadow-sm">
          <p className="px-3 pt-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Sách tìm theo tên</p>
          {bookResults.items.map((book) => (
            <button
              key={book.id}
              type="button"
              onClick={() => setSelectedBookId(book.id)}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
            >
              {book.title}
            </button>
          ))}
        </div>
      )}

      {/* Copies of selected book */}
      {selectedBookId && (
        <div className="rounded-md border border-slate-200 p-3">
          {isLoadingCopies && <p className="text-sm text-slate-400">Đang tải bản sao...</p>}
          {!isLoadingCopies && (!copies || copies.length === 0) && (
            <p className="text-sm text-slate-400">Sách này chưa có bản sao nào trong hệ thống.</p>
          )}
          {!isLoadingCopies && copies && copies.length > 0 && (
            <div className="space-y-1">
              {copies.map((copy) => {
                const alreadyAdded = disabledCopyIds.includes(copy.id);
                const isAvailable = copy.status === "AVAILABLE";
                const statusLabel = STATUS_LABELS[copy.status] || copy.status;

                return (
                  <div
                    key={copy.id}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-slate-50"
                  >
                    <span>
                      Barcode <span className="font-mono">{copy.barcode}</span>
                      {copy.shelfCode && (
                        <span className="text-slate-400"> · Kệ {copy.shelfCode}</span>
                      )}
                      {!isAvailable && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-600/20 ring-inset">
                          {statusLabel}
                        </span>
                      )}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant={isAvailable ? "outline" : "ghost"}
                      disabled={alreadyAdded || !isAvailable}
                      onClick={() => isAvailable && onAddCopy(copy)}
                    >
                      {!isAvailable ? statusLabel : alreadyAdded ? "Đã thêm" : "+ Thêm"}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

