'use client';

import { useState } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BookCard } from '@/components/shared/BookCard';
import { Book } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { StarRating } from '@/components/shared/StarRating';
import { BookOpen } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

interface BookListContainerProps {
  books: Book[];
}

/**
 * BookListContainer - Hiển thị danh sách sách dưới dạng Lưới (Grid) hoặc Danh sách (List).
 * 
 * Cho phép chuyển đổi chế độ xem tức thì thông qua local state mà không cần cập nhật URL.
 * Nếu không có sách nào, hiển thị màn hình trống (empty state).
 * 
 * @param books - Mảng dữ liệu sách đã được chuẩn hóa từ Server
 */
export function BookListContainer({ books }: BookListContainerProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  if (!books || books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center border rounded-lg bg-muted/20">
        <BookOpen className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-semibold">Không tìm thấy sách phù hợp</h3>
        <p className="text-muted-foreground mt-2 max-w-sm">
          Thử thay đổi từ khóa tìm kiếm để xem thêm nhiều sách khác.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Hiển thị <strong>{books.length}</strong> kết quả
        </p>
        <div className="flex items-center gap-1 border rounded-md p-1 bg-muted/50">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-11 w-11 px-0"
            onClick={() => setViewMode('grid')}
            aria-label="Xem dạng lưới"
            aria-pressed={viewMode === 'grid'}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-11 w-11 px-0"
            onClick={() => setViewMode('list')}
            aria-label="Xem dạng danh sách"
            aria-pressed={viewMode === 'list'}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Book List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-6">
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {books.map((book) => {
            const detailHref = `/books/${encodeURIComponent(book.slug || book.id)}`;
            return (
              <div key={book.id} className="flex gap-4 p-4 border rounded-lg bg-card hover:shadow-md transition-shadow">
                <Link href={detailHref} className="shrink-0 relative w-24 sm:w-32 aspect-[2/3] overflow-hidden rounded-md bg-muted flex items-center justify-center">
                  {book.coverImage ? (
                    <Image
                      src={book.coverImage}
                      alt={book.title}
                      fill
                      sizes="(max-width: 768px) 33vw, 20vw"
                      className="object-cover transition-transform hover:scale-105"
                    />
                  ) : (
                    <BookOpen className="w-8 h-8 text-muted-foreground/30" />
                  )}
                </Link>
                <div className="flex flex-col flex-1 justify-between">
                  <div>
                    <Link href={detailHref} className="hover:underline font-semibold text-lg line-clamp-2">
                      {book.title}
                    </Link>
                    <p className="text-muted-foreground text-sm mt-1">{book.author}</p>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <StarRating rating={book.rating || 0} />
                    <Link href={detailHref} className={buttonVariants({ variant: "secondary", size: "sm" })}>
                      Đọc ngay
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
