'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Bookmark, BookmarkCheck } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { getBookmarked, toggleBookmarked } from '@/lib/api/mocks/bookmarks.mocks';
import { BOOK_DETAIL_COPY } from './BookDetailCopy';
import type { BookDetail, ChapterSummary, ReadingProgressDetail } from '@/types/BookDetail';
import { cn } from '@/lib/utils';

/**
 * Thuộc tính đầu vào của component BookHeroActions.
 */
export interface BookHeroActionsProps {
  /** Thông tin chi tiết cuốn sách */
  book: BookDetail;
  /** Chương đầu tiên (phục vụ nút Bắt đầu đọc khi chưa có tiến độ) */
  firstChapter: ChapterSummary | null;
  /** Tiến độ đọc của người dùng hiện tại (nếu có) */
  progress: ReadingProgressDetail | null;
}

/**
 * BookHeroActions - Client Component quản lý các hành động chính trong khối Hero của trang chi tiết sách:
 * Hiển thị thanh tiến độ đọc, nút CTA Đọc sách / Tiếp tục đọc và nút Đánh dấu yêu thích (Bookmark).
 *
 * Dùng ở: Khối Hero bên phải của trang chi tiết sách (/books/[slug]).
 *
 * @param book - Dữ liệu chi tiết cuốn sách
 * @param firstChapter - Thông tin chương 1 để bắt đầu đọc
 * @param progress - Tiến độ đọc sách của người dùng
 */
export function BookHeroActions({ book, firstChapter, progress }: BookHeroActionsProps) {
  const { user } = useAuthStore();
  const userId = user?.id || null;

  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);

  // Khởi tạo trạng thái bookmark từ localStorage phía client bất đồng bộ để tránh cascading render / hydration mismatch
  useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) {
        setIsBookmarked(getBookmarked(userId, book.id));
      }
    });
    return () => {
      isMounted = false;
    };
  }, [userId, book.id]);

  const handleBookmarkToggle = () => {
    const newState = toggleBookmarked(userId, book.id);
    setIsBookmarked(newState);
  };

  // Xác định href cho nút Đọc sách / Tiếp tục đọc theo chuẩn Issue #44
  let readHref: string | null = null;
  let isContinue = false;

  if (progress && Number.isFinite(progress.chapterNumber) && progress.chapterNumber > 0) {
    // Nếu đã có tiến độ hợp lệ -> Tiếp tục đọc tại vị trí đang đọc dở
    const scrollPos = Number.isFinite(progress.scrollPosition) ? progress.scrollPosition : 0;
    readHref = `/books/${encodeURIComponent(book.slug)}/read?chapter=${progress.chapterNumber}&position=${scrollPos}`;
    isContinue = true;
  } else if (firstChapter) {
    // Nếu chưa có tiến độ nhưng có chương đầu tiên -> Bắt đầu đọc từ chương 1
    readHref = `/books/${encodeURIComponent(book.slug)}/read?chapter=${firstChapter.number}&position=0`;
  }

  // Chuẩn hóa progress percentage từ 0 đến 100
  const progressPercent = progress ? Math.min(100, Math.max(0, progress.percentage)) : 0;

  return (
    <div className="space-y-4 pt-2">
      {/* Khối Tiến độ đọc (nếu user đã đọc sách này) */}
      {isContinue && progress && (
        <div className="p-4 rounded-lg border bg-secondary/30 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-primary">
              <BookOpen className="w-4 h-4" />
              {BOOK_DETAIL_COPY.progressHeading}
            </span>
            <span>
              {BOOK_DETAIL_COPY.chapterLabel} {progress.chapterNumber} • {Math.round(progressPercent)}% {BOOK_DETAIL_COPY.progressPercentLabel}
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Khối các Nút Hành động CTA chính (Đọc & Bookmark) */}
      <div className="flex flex-wrap items-center gap-4">
        {readHref ? (
          <Link
            href={readHref}
            className={cn(
              buttonVariants({ variant: 'default', size: 'lg' }),
              'min-w-[160px] font-semibold shadow-md'
            )}
          >
            <BookOpen className="w-5 h-5 mr-2" />
            {isContinue ? BOOK_DETAIL_COPY.continueReading : BOOK_DETAIL_COPY.startReading}
          </Link>
        ) : (
          <Button disabled variant="secondary" size="lg" className="min-w-[160px]">
            <BookOpen className="w-5 h-5 mr-2" />
            {BOOK_DETAIL_COPY.noChaptersAvailable}
          </Button>
        )}

        {/* Nút Toggle Bookmark */}
        <Button
          variant={isBookmarked ? 'secondary' : 'outline'}
          size="lg"
          onClick={handleBookmarkToggle}
          aria-pressed={isBookmarked}
          title={BOOK_DETAIL_COPY.bookmarkNotice}
          className="transition-all"
        >
          {isBookmarked ? (
            <>
              <BookmarkCheck className="w-5 h-5 mr-2 text-primary fill-primary/20" />
              {BOOK_DETAIL_COPY.bookmarkRemove}
            </>
          ) : (
            <>
              <Bookmark className="w-5 h-5 mr-2" />
              {BOOK_DETAIL_COPY.bookmarkAdd}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
