'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { BookOpen, Bookmark, BookmarkCheck } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { BookCard } from '@/components/shared/BookCard';
import { ChapterList } from './ChapterList';
import { ReviewsSection } from './ReviewsSection';
import { useAuthStore } from '@/store/auth-store';
import { getBookmarked, toggleBookmarked } from '@/lib/api/mocks/bookmarks.mocks';
import { BOOK_DETAIL_COPY } from './BookDetailCopy';
import type {
  BookDetail,
  ChapterSummary,
  ReadingProgressDetail,
  BookRecommendation,
  BookFile,
} from '@/types/BookDetail';
import type { Book } from '@/types/Book';
import { cn } from '@/lib/utils';

export interface BookDetailInteractiveProps {
  /** Thông tin chi tiết cuốn sách */
  book: BookDetail;
  /** Chương đầu tiên (phục vụ nút Bắt đầu đọc) */
  firstChapter: ChapterSummary | null;
  /** Tiến độ đọc của người dùng hiện tại (nếu có) */
  progress: ReadingProgressDetail | null;
  /** Thông điệp lỗi tiến độ (nếu có, dạng string serializable) */
  progressError: string | null;
  /** Danh sách sách gợi ý cho bạn */
  recommendations: BookRecommendation[];
  /** Danh sách các chương sách */
  chapters: ChapterSummary[];
  /** Thông điệp lỗi tải danh sách chương (nếu có, dạng string serializable) */
  chaptersError: string | null;
  /** Thông tin file nội dung tải xuống */
  contentFile: BookFile | null;
}

/**
 * BookDetailInteractive - Client Component quản lý các tương tác người dùng:
 * CTA Đọc sách/Tiếp tục đọc, Đánh dấu yêu thích (Bookmark), Danh sách chương, Sách gợi ý, và Đánh giá.
 */
export function BookDetailInteractive({
  book,
  firstChapter,
  progress,
  recommendations,
  chapters,
  chaptersError,
  contentFile,
}: BookDetailInteractiveProps) {
  const { user } = useAuthStore();
  const userId = user?.id || null;

  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);

  // Ref và state phục vụ tính năng đè chuột kéo ngang (drag-to-scroll) hàng sách gợi ý
  const scrollRef = useRef<HTMLDivElement>(null);
  const isMouseDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  // Khởi tạo trạng thái bookmark từ localStorage phía client bất đồng bộ để tránh cascading render
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

  // Logic xử lý đè chuột/chạm lướt ngang danh sách gợi ý bằng Pointer Events (hỗ trợ cả chuột & cảm ứng)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Chỉ xử lý nút chuột trái (button === 0)
    if (e.button !== 0 || !scrollRef.current) return;

    isMouseDownRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.clientX - scrollRef.current.offsetLeft;
    scrollLeftRef.current = scrollRef.current.scrollLeft;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isMouseDownRef.current || !scrollRef.current) return;
    const x = e.clientX - scrollRef.current.offsetLeft;
    const walk = x - startXRef.current;

    // Xóa sạch mọi vùng bôi đen văn bản của trình duyệt khi người dùng đang đè chuột di chuyển
    window.getSelection()?.removeAllRanges();

    // Chỉ bật trạng thái lướt nếu người dùng di chuyển > 5px (tránh nhầm lẫn với click chọn)
    if (Math.abs(walk) > 5) {
      if (!hasDraggedRef.current) {
        hasDraggedRef.current = true;
        setIsDragging(true);
      }
      scrollRef.current.scrollLeft = scrollLeftRef.current - walk * 0.8;
    }
  };

  const handlePointerUp = () => {
    if (!isMouseDownRef.current) return;
    isMouseDownRef.current = false;
    setIsDragging(false);

    // Dán nhãn reset hasDraggedRef sau 50ms để click event hoàn tất việc chuyển trang nếu là click đơn
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 50);
  };

  const handlePointerCancel = () => {
    handlePointerUp();
  };

  // Ngăn chặn sự kiện click mở link sách nếu người dùng đang thực hiện thao tác kéo cuộn
  const handleClickCapture = (e: React.MouseEvent) => {
    if (hasDraggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // Xác định href cho nút Đọc sách / Tiếp tục đọc theo chuẩn Issue #44
  let readHref: string | null = null;
  let isContinue = false;

  if (progress && Number.isFinite(progress.chapterNumber) && progress.chapterNumber > 0) {
    // Nếu đã có tiến độ hợp lệ -> Tiếp tục đọc
    const scrollPos = Number.isFinite(progress.scrollPosition) ? progress.scrollPosition : 0;
    readHref = `/books/${encodeURIComponent(book.slug)}/read?chapter=${progress.chapterNumber}&position=${scrollPos}`;
    isContinue = true;
  } else if (firstChapter) {
    // Nếu chưa có tiến độ nhưng có chương đầu tiên -> Bắt đầu đọc
    readHref = `/books/${encodeURIComponent(book.slug)}/read?chapter=${firstChapter.number}&position=0`;
  }

  // Lọc bỏ cuốn sách hiện tại khỏi danh sách gợi ý
  const filteredRecommendations = recommendations.filter(
    (rec) => rec.id !== book.id && rec.slug !== book.slug
  );

  // Chuẩn hóa progress percentage từ 0 đến 100
  const progressPercent = progress ? Math.min(100, Math.max(0, progress.percentage)) : 0;

  return (
    <div className="space-y-12">
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

      {/* Danh sách chương */}
      <ChapterList
        bookSlug={book.slug}
        chapters={chapters}
        error={chaptersError}
        contentFile={contentFile}
      />

      {/* Gợi ý cho bạn */}
      <section className="space-y-6 pt-8 border-t" aria-labelledby="recommendations-heading">
        <h2 id="recommendations-heading" className="text-xl font-bold tracking-tight">
          {BOOK_DETAIL_COPY.recommendationsHeading}
        </h2>

        {filteredRecommendations.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            {BOOK_DETAIL_COPY.noRecommendations}
          </p>
        ) : (
          <div
            ref={scrollRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onDragStart={(e) => e.preventDefault()}
            onClickCapture={handleClickCapture}
            className={cn(
              'flex flex-nowrap items-stretch overflow-x-auto gap-5 pb-4 select-none [&_*]:select-none transition-colors scrollbar-thin scrollbar-thumb-muted touch-pan-x',
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            )}
          >
            {filteredRecommendations.map((rec) => {
              const recAsBook: Book = {
                id: rec.id,
                slug: rec.slug,
                title: rec.title,
                author: rec.authorNames.join(', ') || BOOK_DETAIL_COPY.missingAuthor,
                coverImage: rec.coverImage,
                rating: rec.rating,
                status: rec.status,
              };

              return (
                <div key={rec.id} className="w-[220px] sm:w-[240px] shrink-0 self-stretch flex flex-col">
                  <BookCard book={recAsBook} className="h-full flex flex-col" />
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Khu vực Đánh giá & Bình luận */}
      <ReviewsSection
        bookId={book.id}
        userId={userId}
        userDisplayName={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email}
      />
    </div>
  );
}
