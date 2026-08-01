import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { BookCover } from "@/components/ui/book-cover";
import type { Book } from "@/lib/api/books";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function RecentBooksWidget({ books }: { books: Book[] }) {
  return (
    <Card>
      <CardHeader title="Sách mới thêm" />
      <CardBody className="space-y-3">
        {books.length === 0 && (
          <p className="text-sm text-slate-400">Chưa có dữ liệu.</p>
        )}
        {books.map((book) => (
          <div key={book.id} className="flex items-center gap-3">
            <BookCover title={book.title} size={32} />
            <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">
              {book.title}
            </p>
            <span className="shrink-0 text-xs text-slate-500">
              {formatDate(book.createdAt)}
            </span>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
