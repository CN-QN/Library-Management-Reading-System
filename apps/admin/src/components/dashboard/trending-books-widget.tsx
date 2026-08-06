import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { BookCover } from "@/components/ui/book-cover";
import type { DashboardBook } from "@/lib/api/reports";

export function TrendingBooksWidget({ books }: { books: DashboardBook[] }) {
  return (
    <Card>
      <CardHeader title="Sách xu hướng" description="Theo lượt xem/đọc" />
      <CardBody className="space-y-3">
        {books.length === 0 && (
          <p className="text-sm text-slate-400">Chưa có dữ liệu.</p>
        )}
        {books.map((book, index) => (
          <div key={book.id} className="flex items-center gap-3">
            <span className="w-5 text-center text-sm font-semibold text-slate-400">
              {index + 1}
            </span>
            <BookCover title={book.title} size={32} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{book.title}</p>
            </div>
            <span className="shrink-0 text-xs text-slate-500">
              {(book.stats?.readingCount ?? book.stats?.viewCount ?? 0).toLocaleString("vi-VN")} lượt đọc
            </span>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
