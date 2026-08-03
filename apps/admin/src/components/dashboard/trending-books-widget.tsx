import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { BookCover } from "@/components/ui/book-cover";
import type { SearchBookResult } from "@/lib/api/search";

export function TrendingBooksWidget({ books }: { books: SearchBookResult[] }) {
  return (
    <Card>
      <CardHeader title="Sách xu hướng" description="Theo lượt xem/đọc" />
      <CardBody className="space-y-3">
        {books.length === 0 && (
          <p className="text-sm text-slate-400">Chưa có dữ liệu.</p>
        )}
        {books.map((book, index) => (
          <div key={book.bookId} className="flex items-center gap-3">
            <span className="w-5 text-center text-sm font-semibold text-slate-400">
              {index + 1}
            </span>
            <BookCover title={book.title} size={32} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{book.title}</p>
            </div>
            <span className="shrink-0 text-xs text-slate-500">
              {book.viewCount.toLocaleString("vi-VN")} lượt xem
            </span>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
