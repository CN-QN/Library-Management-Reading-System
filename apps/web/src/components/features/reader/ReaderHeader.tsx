'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReaderTheme } from '@/types/Reading';

/**
 * Props cho component ReaderHeader.
 */
export interface ReaderHeaderProps {
  /** Tiêu đề của cuốn sách đang đọc */
  bookTitle: string;
  /** Chuỗi slug cuốn sách (dùng cho đường dẫn quay lại trang chi tiết sách) */
  bookSlug: string;
  /** Tiêu đề của chương hiện tại */
  chapterTitle: string;
  /** Số thứ tự của chương hiện tại */
  chapterNumber: number;
  /** Chủ đề màu nền đọc sách (light, sepia, dark) */
  theme: ReaderTheme;
  /** Callback kích hoạt mở drawer / modal Mục lục chương sách */
  onOpenTOC: () => void;
  /** Callback kích hoạt mở drawer / modal Cài đặt giao diện đọc */
  onOpenSettings: () => void;
  /** Class CSS tùy biến bổ sung từ bên ngoài (nếu có) */
  className?: string;
}

/**
 * Trả về bộ class CSS hỗ trợ màu sắc và hiệu ứng kính mờ (backdrop-blur) cho ReaderHeader.
 *
 * TẠI SAO CẦN HELPER NÀY:
 * - Đảm bảo thanh điều hướng tương thích màu sắc hoàn hảo với 3 chủ đề đọc sách.
 * - Giúp các icon và nút điều hướng rõ nét, dễ tương tác trên mọi nền chủ đề.
 *
 * @param theme - Chủ đề màu nền hiện tại
 */
function getHeaderThemeClasses(theme: ReaderTheme = 'light') {
  switch (theme) {
    case 'sepia':
      return {
        container: 'bg-[#f4ecd8]/90 text-[#433422] border-[#e2d5b7] shadow-xs',
        mutedText: 'text-[#7c6950]',
        button:
          'bg-[#ebdcb9]/70 hover:bg-[#e2d2aa] active:bg-[#d8c79d] text-[#433422] border border-[#d8c79d]/60',
        backBtn:
          'bg-[#ebdcb9]/70 hover:bg-[#e2d2aa] active:bg-[#d8c79d] text-[#433422] border border-[#d8c79d]/60',
      };
    case 'dark':
      return {
        container: 'bg-stone-950/85 text-stone-100 border-stone-800/80 shadow-md shadow-black/20',
        mutedText: 'text-stone-400',
        button:
          'bg-stone-900/80 hover:bg-stone-800 active:bg-stone-800/80 text-stone-200 border border-stone-800',
        backBtn:
          'bg-stone-900/80 hover:bg-stone-800 active:bg-stone-800/80 text-stone-200 border border-stone-800',
      };
    case 'light':
    default:
      return {
        container: 'bg-stone-50/90 text-stone-900 border-stone-200/80 shadow-xs',
        mutedText: 'text-stone-500',
        button:
          'bg-stone-100/80 hover:bg-stone-200/70 active:bg-stone-200 text-stone-800 border border-stone-200/60',
        backBtn:
          'bg-stone-100/80 hover:bg-stone-200/70 active:bg-stone-200 text-stone-800 border border-stone-200/60',
      };
  }
}

/**
 * ReaderHeader - Thanh điều hướng phía trên trang đọc sách.
 *
 * Vị trí: Cố định phía trên (fixed top-0 left-0 right-0 z-40).
 *
 * TẠI SAO CẦN COMPONENT NÀY:
 * - Cung cấp lối thoát nhanh về trang chi tiết sách (`/books/${bookSlug}`).
 * - Hiển thị ngữ cảnh tên sách và tiêu đề chương hiện tại một cách gọn gàng, chống vỡ layout trên màn hình nhỏ.
 * - Chứa 2 lối tắt quan trọng: Mở Mục lục và Tùy chỉnh cài đặt giao diện đọc.
 *
 * @param props - Chi tiết thuộc tính cấu hình Header
 */
export function ReaderHeader({
  bookTitle,
  bookSlug,
  chapterTitle,
  chapterNumber,
  theme = 'light',
  onOpenTOC,
  onOpenSettings,
  className,
}: ReaderHeaderProps) {
  const themeClasses = getHeaderThemeClasses(theme);

  // Chuỗi định dạng hiển thị tên chương (tránh lặp từ Chương nếu chapterTitle đã có sẵn)
  const isPrefixed = /^chương\s+\d+/i.test(chapterTitle.trim());
  const formattedChapterLabel =
    isPrefixed || chapterNumber <= 0
      ? chapterTitle
      : `Chương ${chapterNumber}: ${chapterTitle}`;

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-40 h-14 border-b backdrop-blur-md transition-colors duration-200',
        themeClasses.container,
        className
      )}
    >
      <div className="max-w-7xl mx-auto h-full px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
        {/* Bên trái: Nút Quay lại trang chi tiết sách */}
        <div className="flex items-center shrink-0">
          <Link
            href={`/books/${bookSlug}`}
            title="Quay lại trang chi tiết sách"
            aria-label="Quay lại trang chi tiết sách"
            className={cn(
              'group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/40',
              themeClasses.backBtn
            )}
          >
            <ArrowLeft className="w-4 h-4 shrink-0 transition-transform group-hover:-translate-x-0.5" />
            <span className="hidden md:inline font-semibold">Chi tiết sách</span>
          </Link>
        </div>

        {/* Ở giữa: Tiêu đề sách (nhỏ, muted) & Tên chương (in đậm vừa, truncate chống vỡ mobile) */}
        <div className="flex-1 min-w-0 text-center px-1 sm:px-2">
          <div
            className={cn(
              'text-[11px] sm:text-xs font-normal truncate tracking-wide',
              themeClasses.mutedText
            )}
            title={bookTitle}
          >
            {bookTitle}
          </div>
          <h1
            className="text-xs sm:text-sm font-semibold truncate leading-tight mt-0.5"
            title={formattedChapterLabel}
          >
            {formattedChapterLabel}
          </h1>
        </div>

        {/* Bên phải: Nút Mở Mục lục & Nút Cài đặt giao diện */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Nút Mở Mục lục */}
          <button
            type="button"
            onClick={onOpenTOC}
            title="Mở mục lục chương sách"
            aria-label="Mở mục lục"
            className={cn(
              'group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/40 cursor-pointer',
              themeClasses.button
            )}
          >
            <BookOpen className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform" />
            <span className="hidden sm:inline font-semibold">Mục lục</span>
          </button>

          {/* Nút Tùy chỉnh Cài đặt */}
          <button
            type="button"
            onClick={onOpenSettings}
            title="Tùy chỉnh giao diện đọc sách"
            aria-label="Tùy chỉnh giao diện"
            className={cn(
              'group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/40 cursor-pointer',
              themeClasses.button
            )}
          >
            <SlidersHorizontal className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
            <span className="hidden sm:inline font-semibold">Tùy chỉnh</span>
          </button>
        </div>
      </div>
    </header>
  );
}
