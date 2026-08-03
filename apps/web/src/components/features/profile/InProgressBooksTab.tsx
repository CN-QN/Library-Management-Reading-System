'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Clock, ArrowRight, BookMarked } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ProfileEmptyState } from './ProfileEmptyState';
import type { InProgressBook } from '@/types/Profile';

/**
 * Interface định nghĩa các props đầu vào cho component InProgressBooksTab.
 */
export interface InProgressBooksTabProps {
  /** Danh sách các cuốn sách người dùng đang đọc dở */
  books: InProgressBook[];
  /** Cờ hiệu thể hiện trạng thái đang truy vấn dữ liệu từ API */
  isLoading?: boolean;
}

/**
 * Component InProgressBooksTab - Tab hiển thị danh sách các cuốn sách đang đọc dở.
 *
 * Dùng ở: Trang Hồ sơ cá nhân độc giả (/profile), tab "Sách đang đọc".
 * Tác dụng: Hiển thị thanh tiến độ %, chương gần nhất và nút "Tiếp tục đọc"
 * để chuyển trực tiếp đến trang đọc sách đúng vị trí cuộn trước đó.
 *
 * @param props - InProgressBooksTabProps
 */
export function InProgressBooksTab({ books, isLoading }: InProgressBooksTabProps) {
  // Hiển thị trạng thái trống khi không ở trạng thái loading và không có sách nào đang đọc
  if (!isLoading && books.length === 0) {
    return (
      <ProfileEmptyState
        icon={<BookOpen className="h-8 w-8 text-amber-600 dark:text-amber-400" />}
        title="Chưa có sách nào đang đọc"
        description="Khám phá ngay kho sách phong phú và bắt đầu trải nghiệm đọc sách số tuyệt vời ngay hôm nay!"
        actionText="Khám phá kho sách"
        actionHref="/books"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {books.map((book) => {
        // Xây dựng đường dẫn URL đọc sách kèm query parameters chapterId và scrollPosition
        // giúp bộ đọc tự động cuộn đúng đến đoạn độc giả đã tạm dừng
        const queryParams = [
          book.chapterId ? `chapterId=${encodeURIComponent(book.chapterId)}` : '',
          book.scrollPosition > 0 ? `position=${book.scrollPosition}` : '',
        ].filter(Boolean).join('&');
        const readLink = `/books/${book.bookSlug}/read${queryParams ? `?${queryParams}` : ''}`;

        return (
          <Card
            key={book.bookId}
            className="group border-border/60 bg-card/80 hover:bg-card/100 transition-all shadow-sm hover:shadow-md overflow-hidden flex flex-col justify-between"
          >
            <CardContent className="p-4 flex flex-col justify-between h-full space-y-4">
              <div className="flex gap-3.5">
                {/* Bìa sách có ảnh hoặc fallback giao diện Warm Sepia */}
                <div className="relative h-28 w-20 shrink-0 rounded-md overflow-hidden bg-muted/60 border border-border/50 shadow-inner flex items-center justify-center">
                  {book.bookCoverImage ? (
                    <Image
                      src={book.bookCoverImage}
                      alt={book.bookTitle}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="80px"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-amber-500/20 to-primary/20 flex flex-col items-center justify-center p-1 text-center">
                      <BookOpen className="h-6 w-6 text-primary/60 mb-1" />
                      <span className="text-[10px] font-bold text-primary/80 line-clamp-2 leading-tight">
                        {book.bookTitle}
                      </span>
                    </div>
                  )}
                </div>

                {/* Thông tin chi tiết cuốn sách */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <Link
                      href={`/books/${book.bookSlug}`}
                      className="text-sm font-semibold text-foreground line-clamp-2 hover:text-primary transition-colors leading-snug"
                    >
                      {book.bookTitle}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {book.authorName || 'Nhiều tác giả'}
                    </p>
                  </div>

                  <div className="space-y-1 mt-2">
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <BookMarked className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="truncate font-medium text-foreground/90">
                        {book.chapterTitle || `Chương ${book.chapterNumber || 1}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3 shrink-0" />
                      <span>Đọc gần nhất: {formatRelativeTime(book.lastReadAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Thanh tiến độ phần trăm hoàn thành */}
              <div className="space-y-1.5 pt-1 border-t border-border/40">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Tiến độ hoàn thành</span>
                  <span className="font-bold text-primary">{book.percentage}%</span>
                </div>
                <Progress value={book.percentage} className="h-1.5 bg-muted" />
              </div>

              {/* Nút thao tác chuyển trực tiếp đến trang đọc */}
              <Link
                href={readLink}
                className={cn(
                  buttonVariants({ size: 'sm' }),
                  'w-full gap-1.5 cursor-pointer shadow-sm'
                )}
              >
                <BookOpen className="h-4 w-4" />
                <span>Tiếp tục đọc</span>
                <ArrowRight className="h-3.5 w-3.5 ml-auto" />
              </Link>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/**
 * Định dạng thời gian tương đối theo tiếng Việt từ chuỗi thời gian ISO 8601.
 * Giúp người dùng biết đã đọc lại sách từ bao lâu trước.
 *
 * @param isoString - Chuỗi mốc thời gian ISO 8601
 * @returns Chuỗi hiển thị thời gian tương đối
 */
function formatRelativeTime(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Vừa xong';
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} ngày trước`;
    return new Date(isoString).toLocaleDateString('vi-VN');
  } catch {
    return 'Gần đây';
  }
}
