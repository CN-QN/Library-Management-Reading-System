'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Bookmark, BookmarkCheck, QrCode, CheckCircle2 } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { getBookmarked, toggleBookmarked } from '@/lib/api/mocks/bookmarks.mocks';
import { checkBookAccess } from '@/lib/api/payment';
import { PaymentModal } from '@/components/features/payment/PaymentModal';
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
 * Hiển thị thanh tiến độ đọc, nút CTA Đọc sách / Tiếp tục đọc, nút Đánh dấu yêu thích và Nút Mua sách Premium VietQR SePay.
 */
export function BookHeroActions({ book, firstChapter, progress }: BookHeroActionsProps) {
  const { user, isAuthenticated } = useAuthStore();
  const userId = user?.id || null;

  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState<boolean>(false);
  const [hasPaidAccess, setHasPaidAccess] = useState<boolean>(false);

  const isPaidBook = book.accessType === 'PAID' || book.accessType === 'PREMIUM';

  // Kiểm tra quyền truy cập sách Premium
  useEffect(() => {
    if (isAuthenticated && isPaidBook && book.id) {
      checkBookAccess(book.id)
        .then((res) => {
          if (res?.hasAccess) setHasPaidAccess(true);
        })
        .catch(() => {});
    }
  }, [isAuthenticated, isPaidBook, book.id]);

  // Khởi tạo trạng thái bookmark
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

  // Xác định href cho nút Đọc sách / Tiếp tục đọc
  let rawReadTarget: string | null = null;
  let isContinue = false;

  if (isAuthenticated && progress && Number.isFinite(progress.chapterNumber) && progress.chapterNumber > 0) {
    const scrollPos = Number.isFinite(progress.scrollPosition) ? progress.scrollPosition : 0;
    rawReadTarget = `/books/${encodeURIComponent(book.slug)}/read?chapter=${progress.chapterNumber}&position=${scrollPos}`;
    isContinue = true;
  } else if (firstChapter) {
    rawReadTarget = `/books/${encodeURIComponent(book.slug)}/read?chapter=${firstChapter.number}&position=0`;
  }

  const readHref = rawReadTarget
    ? isAuthenticated
      ? rawReadTarget
      : `/login?returnUrl=${encodeURIComponent(rawReadTarget)}`
    : null;

  const progressPercent = progress ? Math.min(100, Math.max(0, progress.percentage)) : 0;
  const canRead = !isPaidBook || hasPaidAccess;

  return (
    <div className="space-y-4 pt-2">
      {/* Khối Tiến độ đọc */}
      {isAuthenticated && isContinue && progress && (
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

      {/* Khối Nút Hành động */}
      <div className="flex flex-wrap items-center gap-4">
        {readHref && canRead ? (
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
        ) : isPaidBook && !hasPaidAccess ? (
          <Button
            size="lg"
            onClick={() => {
              if (!isAuthenticated) {
                window.location.href = `/login?returnUrl=${encodeURIComponent(window.location.pathname)}`;
                return;
              }
              setIsPaymentOpen(true);
            }}
            className="min-w-[190px] font-semibold shadow-md"
          >
            <QrCode className="w-5 h-5 mr-2" />
            Mua để đọc{book.price > 0 ? ` · ${book.price.toLocaleString('vi-VN')} ₫` : ''}
          </Button>
        ) : (
          <Button disabled variant="secondary" size="lg" className="min-w-[160px]">
            <BookOpen className="w-5 h-5 mr-2" />
            {BOOK_DETAIL_COPY.noChaptersAvailable}
          </Button>
        )}

        {/* Nút Mua sách Premium qua VietQR SePay */}
        {isPaidBook && hasPaidAccess && (
          <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
            Đã mở khóa Premium
          </span>
        )}

        {/* Nút Bookmark */}
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

      {/* Modal Thanh toán VietQR SePay */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        bookId={book.id}
        bookTitle={book.title}
        onPaymentSuccess={() => {
          setHasPaidAccess(true);
        }}
      />
    </div>
  );
}

