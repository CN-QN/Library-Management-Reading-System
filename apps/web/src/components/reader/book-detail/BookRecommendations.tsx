'use client';

import { useState, useRef } from 'react';
import { BookCard } from '@/components/shared/BookCard';
import { BOOK_DETAIL_COPY } from './BookDetailCopy';
import type { BookRecommendation } from '@/types/BookDetail';
import type { Book } from '@/types/Book';
import { cn } from '@/lib/utils';

/**
 * Thuộc tính đầu vào của component BookRecommendations.
 */
export interface BookRecommendationsProps {
  /** Danh sách các cuốn sách gợi ý */
  recommendations: BookRecommendation[];
  /** ID cuốn sách hiện tại (để lọc bỏ khỏi danh sách gợi ý nếu bị trùng) */
  currentBookId: string;
  /** Slug cuốn sách hiện tại */
  currentBookSlug: string;
}

/**
 * BookRecommendations - Client Component hiển thị danh sách sách gợi ý cho độc giả.
 * Hỗ trợ thao tác kéo trượt ngang (drag-to-scroll) bằng chuột và cảm ứng mượt mà.
 *
 * Dùng ở: Trang chi tiết sách (/books/[slug]), nằm phía dưới danh sách chương.
 *
 * @param recommendations - Danh sách các sách gợi ý được đề xuất
 * @param currentBookId - ID sách hiện tại
 * @param currentBookSlug - Slug sách hiện tại
 */
export function BookRecommendations({
  recommendations,
  currentBookId,
  currentBookSlug,
}: BookRecommendationsProps) {
  // Ref và state phục vụ tính năng đè chuột kéo ngang (drag-to-scroll) hàng sách gợi ý
  const scrollRef = useRef<HTMLDivElement>(null);
  const isMouseDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

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

    // Chỉ bật trạng thái lướt nếu người dùng di chuyển > 5px (tránh nhầm lẫn với click chọn thẻ)
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

  // Lọc bỏ cuốn sách hiện tại khỏi danh sách gợi ý
  const filteredRecommendations = recommendations.filter(
    (rec) => rec.id !== currentBookId && rec.slug !== currentBookSlug
  );

  return (
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
  );
}
