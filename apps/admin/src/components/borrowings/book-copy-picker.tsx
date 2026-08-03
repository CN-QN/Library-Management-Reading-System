"use client";

import { useCallback, useState } from "react";
import { useAsync } from "@/hooks/use-async";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { booksApi } from "@/lib/api/books";
import { copiesApi, type Copy } from "@/lib/api/copies";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

  const fetchCopies = useCallback(() => {
    if (!selectedBookId) return Promise.resolve([]);
    return copiesApi.getByBookId(selectedBookId);
  }, [selectedBookId]);
  const { data: copies, isLoading: isLoadingCopies } = useAsync(fetchCopies);

  const availableCopies = (copies ?? []).filter((c) => c.status === "AVAILABLE");

  return (
    <div className="space-y-2">
      <Input
        placeholder="Tìm sách để thêm vào phiếu mượn..."
        value={bookSearch}
        onChange={(e) => {
          setBookSearch(e.target.value);
          setSelectedBookId(null);
        }}
      />
      {!selectedBookId && bookResults && bookResults.items.length > 0 && (
        <div className="divide-y divide-slate-100 rounded-md border border-slate-200 bg-white shadow-sm">
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

      {selectedBookId && (
        <div className="rounded-md border border-slate-200 p-3">
          {isLoadingCopies && <p className="text-sm text-slate-400">Đang tải bản sao...</p>}
          {!isLoadingCopies && availableCopies.length === 0 && (
            <p className="text-sm text-slate-400">Sách này hiện không còn bản sao sẵn có.</p>
          )}
          {!isLoadingCopies && availableCopies.length > 0 && (
            <div className="space-y-1">
              {availableCopies.map((copy) => {
                const alreadyAdded = disabledCopyIds.includes(copy.id);
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
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={alreadyAdded}
                      onClick={() => onAddCopy(copy)}
                    >
                      {alreadyAdded ? "Đã thêm" : "+ Thêm"}
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
