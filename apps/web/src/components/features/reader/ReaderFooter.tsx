'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReaderTheme } from '@/types/Reading';

/**
 * Props cho component ReaderFooter.
 */
export interface ReaderFooterProps {
  /** Chuỗi slug của cuốn sách đang đọc */
  bookSlug: string;
  /** ID của chương trước (null/undefined nếu đang ở chương đầu tiên) */
  prevChapterId?: string | null;
  /** ID của chương kế tiếp (null/undefined nếu đang ở chương cuối cùng) */
  nextChapterId?: string | null;
  /** Số thứ tự của chương trước (tùy chọn) */
  prevChapterNumber?: number | null;
  /** Số thứ tự của chương sau (tùy chọn) */
  nextChapterNumber?: number | null;
  /** Số thứ tự chương đang đọc hiện tại */
  currentChapterNumber: number;
  /** Tổng số chương của cuốn sách */
  totalChapters: number;
  /** Phần trăm tiến độ đọc sách hiện tại (0 - 100) */
  percentage: number;
  /** Thời gian đọc ước tính của chương hiện tại tính bằng phút (tùy chọn) */
  readingTime?: number;
  /** Chủ đề giao diện đọc sách hiện tại (light, sepia, dark) */
  theme: ReaderTheme;
  /** Callback kích hoạt mở drawer / modal Mục lục chương sách */
  onOpenTOC: () => void;
  /** Class CSS tùy biến bổ sung từ bên ngoài (nếu có) */
  className?: string;
}

/**
 * Trả về các class CSS phù hợp với 3 chủ đề đọc sách (light, sepia, dark) cho ReaderFooter.
 *
 * TẠI SAO CẦN HELPER NÀY:
 * - Đảm bảo tính nhất quán về màu sắc và hiệu ứng kính mờ (backdrop-blur) với Header và Body.
 * - Phân biệt rõ ràng trạng thái có thể bấm (active/hover) và trạng thái vô hiệu hóa (disabled) của nút chuyển chương.
 *
 * @param theme - Chủ đề màu nền đọc sách
 */
function getFooterThemeClasses(theme: ReaderTheme = 'light') {
  switch (theme) {
    case 'sepia':
      return {
        container: 'bg-[#f4ecd8]/90 text-[#433422] border-[#e2d5b7] shadow-xs',
        navBtn:
          'bg-[#ebdcb9]/80 hover:bg-[#e2d2aa] active:bg-[#d8c79d] text-[#433422] border border-[#d8c79d]/60 shadow-2xs',
        navBtnDisabled:
          'bg-[#f4ecd8]/50 text-[#a3947c] border border-[#e2d5b7]/50 cursor-not-allowed opacity-50',
        tocBtn: 'hover:bg-[#e6dcbe] text-[#433422] active:bg-[#ded1af]',
        mutedText: 'text-[#7c6950]',
      };
    case 'dark':
      return {
        container: 'bg-stone-950/85 text-stone-100 border-stone-800/80 shadow-md shadow-black/20',
        navBtn:
          'bg-stone-900/90 hover:bg-stone-800 active:bg-stone-800/80 text-stone-200 border border-stone-800 shadow-2xs',
        navBtnDisabled:
          'bg-stone-950/40 text-stone-600 border border-stone-900 cursor-not-allowed opacity-40',
        tocBtn: 'hover:bg-stone-800/70 text-stone-300 active:bg-stone-800',
        mutedText: 'text-stone-400',
      };
    case 'light':
    default:
      return {
        container: 'bg-stone-50/90 text-stone-900 border-stone-200/80 shadow-xs',
        navBtn:
          'bg-stone-100/90 hover:bg-stone-200/80 active:bg-stone-200 text-stone-800 border border-stone-200/80 shadow-2xs',
        navBtnDisabled:
          'bg-stone-100/40 text-stone-400 border border-stone-200/40 cursor-not-allowed opacity-40',
        tocBtn: 'hover:bg-stone-200/60 text-stone-700 active:bg-stone-200',
        mutedText: 'text-stone-500',
      };
  }
}

/**
 * ReaderFooter - Thanh footer điều hướng điều khiển chuyển chương và hiển thị tiến độ đọc.
 *
 * Vị trí: Cố định phía dưới màn hình (fixed bottom-0 left-0 right-0 z-40).
 *
 * TẠI SAO CẦN COMPONENT NÀY:
 * - Giúp độc giả dễ dàng chuyển đổi nhanh giữa các chương (Chương trước / Chương sau).
 * - Tự động vô hiệu hóa nút chuyển chương khi người đọc đang ở chương đầu hoặc chương cuối.
 * - Cung cấp thông tin tiến độ tổng quan (số chương hiện tại, phần trăm hoàn thành, thời gian đọc ước tính).
 * - Cho phép bấm trực tiếp vào thông tin ở giữa để kích hoạt xem nhanh Mục lục toàn bộ cuốn sách.
 *
 * @param props - Chi tiết thuộc tính cấu hình Footer
 */
export function ReaderFooter({
  bookSlug,
  prevChapterId,
  nextChapterId,
  currentChapterNumber,
  totalChapters,
  percentage,
  readingTime,
  theme = 'light',
  onOpenTOC,
  className,
}: ReaderFooterProps) {
  const themeClasses = getFooterThemeClasses(theme);

  // Làm tròn tỷ lệ phần trăm tiến độ đọc sách
  const formattedPercentage = Math.round(
    Math.min(100, Math.max(0, isNaN(percentage) ? 0 : percentage))
  );

  return (
    <footer
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 h-14 border-t backdrop-blur-md transition-colors duration-200',
        themeClasses.container,
        className
      )}
    >
      <div className="max-w-7xl mx-auto h-full px-3 sm:px-6 flex items-center justify-between gap-2">
        {/* Nút "Chương trước" (Trái) */}
        <div className="flex items-center shrink-0">
          {prevChapterId ? (
            <Link
              href={`/books/${bookSlug}/read?chapterId=${prevChapterId}`}
              title="Đi tới chương phía trước"
              aria-label="Chương trước"
              className={cn(
                'group inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-amber-500/40',
                themeClasses.navBtn
              )}
            >
              <ChevronLeft className="w-4 h-4 shrink-0 transition-transform group-hover:-translate-x-0.5" />
              <span className="hidden sm:inline font-semibold">Chương trước</span>
              <span className="sm:hidden font-semibold">Trước</span>
            </Link>
          ) : (
            <button
              type="button"
              disabled
              aria-disabled="true"
              title="Đã ở chương đầu tiên"
              className={cn(
                'inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 select-none',
                themeClasses.navBtnDisabled
              )}
            >
              <ChevronLeft className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline font-semibold">Chương trước</span>
              <span className="sm:hidden font-semibold">Trước</span>
            </button>
          )}
        </div>

        {/* Thông tin tiến độ đọc & Nút bấm nhanh mở Mục lục ở giữa */}
        <div className="flex-1 min-w-0 flex items-center justify-center px-1">
          <button
            type="button"
            onClick={onOpenTOC}
            title="Bấm để xem danh sách toàn bộ các chương sách"
            className={cn(
              'group inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/40 cursor-pointer max-w-full truncate',
              themeClasses.tocBtn
            )}
          >
            <List className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="font-semibold truncate">
              Chương {currentChapterNumber}/{totalChapters}
            </span>
            <span className={cn('mx-0.5 opacity-60 shrink-0', themeClasses.mutedText)}>•</span>
            <span className="shrink-0">{formattedPercentage}%</span>
            {typeof readingTime === 'number' && readingTime > 0 && (
              <>
                <span
                  className={cn(
                    'mx-0.5 opacity-60 hidden md:inline shrink-0',
                    themeClasses.mutedText
                  )}
                >
                  •
                </span>
                <span className={cn('hidden md:inline shrink-0', themeClasses.mutedText)}>
                  ~{readingTime} phút
                </span>
              </>
            )}
          </button>
        </div>

        {/* Nút "Chương sau" (Phải) */}
        <div className="flex items-center shrink-0">
          {nextChapterId ? (
            <Link
              href={`/books/${bookSlug}/read?chapterId=${nextChapterId}`}
              title="Đi tới chương kế tiếp"
              aria-label="Chương sau"
              className={cn(
                'group inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-amber-500/40',
                themeClasses.navBtn
              )}
            >
              <span className="hidden sm:inline font-semibold">Chương sau</span>
              <span className="sm:hidden font-semibold">Sau</span>
              <ChevronRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ) : (
            <button
              type="button"
              disabled
              aria-disabled="true"
              title="Đã ở chương cuối cùng"
              className={cn(
                'inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 select-none',
                themeClasses.navBtnDisabled
              )}
            >
              <span className="hidden sm:inline font-semibold">Chương sau</span>
              <span className="sm:hidden font-semibold">Sau</span>
              <ChevronRight className="w-4 h-4 shrink-0" />
            </button>
          )}
        </div>
      </div>
    </footer>
  );
}
