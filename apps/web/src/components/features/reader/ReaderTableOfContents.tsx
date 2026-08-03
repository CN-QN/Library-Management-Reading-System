'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, BookOpen, CheckCircle2, Clock, X, ListOrdered } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import type { Chapter, ReaderTheme } from '@/types/Reading';

/**
 * Props định nghĩa cho component ReaderTableOfContents.
 */
export interface ReaderTableOfContentsProps {
  /** Cờ bật/tắt trạng thái mở drawer/sheet mục lục */
  isOpen: boolean;
  /** Callback đóng sheet mục lục */
  onClose: () => void;
  /** Tiêu đề của cuốn sách */
  bookTitle: string;
  /** Slug của cuốn sách (dùng cho liên kết điều hướng đọc chương) */
  bookSlug: string;
  /** Danh sách tất cả các chương của cuốn sách */
  chapters: Chapter[];
  /** ID của chương sách đang đọc hiện tại */
  currentChapterId: string;
  /** Chủ đề màu nền đọc sách hiện tại ('light' | 'sepia' | 'dark') */
  theme: ReaderTheme;
}

/**
 * Trả về màu nền và style phù hợp theo chủ đề đọc hiện tại cho Drawer Mục lục.
 *
 * TẠI SAO CẦN HELPER NÀY:
 * - Đảm bảo màu sắc giao diện mục lục hài hòa đồng bộ với theme đọc chính của người dùng.
 * - Giúp làm nổi bật chương đang đọc (Active) và ô tìm kiếm một cách tự nhiên.
 *
 * @param theme - Chủ đề màu nền đọc hiện tại ('light' | 'sepia' | 'dark')
 */
function getTOCThemeClasses(theme: ReaderTheme = 'light') {
  switch (theme) {
    case 'sepia':
      return {
        content: 'bg-[#f4ecd8] text-[#433422] border-[#e2d5b7]',
        mutedText: 'text-[#7c6950]',
        inputBg:
          'bg-[#ebdcb9]/70 border-[#d8c79d] text-[#433422] placeholder:text-[#7c6950]/70 focus-visible:ring-amber-700/30',
        itemBg: 'hover:bg-[#ebdcb9]/80 border-transparent text-[#433422]',
        itemActive:
          'bg-[#ebdcb9] border-amber-600/70 ring-1 ring-amber-600/40 text-[#322517] font-semibold shadow-2xs',
        activeIcon: 'text-amber-700',
        badgeBg: 'bg-[#ebdcb9] text-[#5c4a35] border border-[#d8c79d]',
      };
    case 'dark':
      return {
        content: 'bg-stone-950 text-stone-100 border-stone-800',
        mutedText: 'text-stone-400',
        inputBg:
          'bg-stone-900 border-stone-800 text-stone-100 placeholder:text-stone-500 focus-visible:ring-amber-500/30',
        itemBg: 'hover:bg-stone-900/80 border-transparent text-stone-300',
        itemActive:
          'bg-stone-900 border-amber-500/60 ring-1 ring-amber-500/40 text-amber-300 font-semibold shadow-2xs',
        activeIcon: 'text-amber-400',
        badgeBg: 'bg-stone-900 text-stone-400 border border-stone-800',
      };
    case 'light':
    default:
      return {
        content: 'bg-white text-stone-900 border-stone-200',
        mutedText: 'text-stone-500',
        inputBg:
          'bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400 focus-visible:ring-amber-500/30',
        itemBg: 'hover:bg-stone-100/80 border-transparent text-stone-800',
        itemActive:
          'bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/30 text-amber-950 font-semibold shadow-2xs',
        activeIcon: 'text-amber-600',
        badgeBg: 'bg-stone-100 text-stone-600 border border-stone-200/80',
      };
  }
}

/**
 * ReaderTableOfContents - Component hiển thị danh sách mục lục chương sách.
 *
 * Mở dạng Sheet slide-over từ cạnh trái màn hình (`side="left"`).
 *
 * TẠI SAO CẦN COMPONENT NÀY:
 * - Giúp người đọc dễ dàng theo dõi toàn bộ danh sách chương và cấu trúc cuốn sách.
 * - Cho phép tìm kiếm nhanh chương theo từ khóa tên chương hoặc số thứ tự.
 * - Đánh dấu nổi bật chương đang đọc hiện tại (Active state).
 * - Chuyển hướng mượt mà đến chương được chọn thông qua Next.js `Link`.
 *
 * @param props - Chi tiết thuộc tính cấu hình danh sách chương và theme
 */
export function ReaderTableOfContents({
  isOpen,
  onClose,
  bookTitle,
  bookSlug,
  chapters = [],
  currentChapterId,
  theme = 'light',
}: ReaderTableOfContentsProps) {
  // State từ khóa tìm kiếm chương sách
  const [searchQuery, setSearchQuery] = useState<string>('');

  const themeClasses = getTOCThemeClasses(theme);

  /**
   * Filter danh sách chương dựa trên từ khóa tìm kiếm (tên chương hoặc số thứ tự).
   * Dùng useMemo để tránh tính toán lại không cần thiết khi re-render.
   */
  const filteredChapters = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    if (!trimmed) return chapters;

    return chapters.filter((ch) => {
      const matchTitle = ch.title.toLowerCase().includes(trimmed);
      const matchNumber = ch.number.toString().includes(trimmed);
      const matchLabel = `chương ${ch.number}`.includes(trimmed);
      return matchTitle || matchNumber || matchLabel;
    });
  }, [chapters, searchQuery]);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="left"
        className={cn(
          'w-full sm:max-w-md overflow-hidden p-0 flex flex-col transition-colors duration-200 font-sans',
          themeClasses.content
        )}
      >
        {/* HEADER MỤC LỤC */}
        <SheetHeader className="p-5 pr-10 border-b border-stone-200/40 dark:border-stone-800/40 text-left shrink-0">
          <div className="flex items-center justify-between gap-2">
            <SheetTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
              <ListOrdered className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              Mục lục sách
            </SheetTitle>
            <span
              className={cn(
                'text-xs px-2.5 py-0.5 rounded-full font-medium',
                themeClasses.badgeBg
              )}
            >
              {chapters.length} chương
            </span>
          </div>
          <SheetDescription className={cn('text-xs sm:text-sm mt-1 truncate', themeClasses.mutedText)}>
            {bookTitle}
          </SheetDescription>

          {/* THANH TÌM KIẾM CHƯƠNG */}
          <div className="relative mt-3">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" />
            <Input
              type="text"
              placeholder="Tìm theo tên hoặc số chương..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn('pl-9 pr-8 h-9 text-xs sm:text-sm rounded-xl', themeClasses.inputBg)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Xóa nội dung tìm kiếm"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-stone-500/20 text-stone-400 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </SheetHeader>

        {/* DANH SÁCH CHƯƠNG (SCROLLABLE CONTAINER) */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 max-h-[calc(100vh-140px)] scrollbar-thin">
          {filteredChapters.length > 0 ? (
            filteredChapters.map((chapter) => {
              const isActive = chapter.id === currentChapterId;
              const isPrefixed = /^chương\s+\d+/i.test(chapter.title.trim());
              const formattedTitle = isPrefixed ? chapter.title : `Chương ${chapter.number}: ${chapter.title}`;

              return (
                <Link
                  key={chapter.id}
                  href={`/books/${bookSlug}/read?chapterId=${chapter.id}`}
                  onClick={onClose}
                  className={cn(
                    'group flex items-center justify-between p-3 rounded-xl border text-xs sm:text-sm transition-all cursor-pointer',
                    isActive ? themeClasses.itemActive : themeClasses.itemBg
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    {/* Icon chỉ báo chương Active đang đọc hoặc BookOpen icon */}
                    {isActive ? (
                      <CheckCircle2
                        className={cn('w-4 h-4 shrink-0 animate-pulse', themeClasses.activeIcon)}
                      />
                    ) : (
                      <BookOpen className="w-4 h-4 shrink-0 opacity-40 group-hover:opacity-70 transition-opacity" />
                    )}

                    <span className="truncate leading-snug">{formattedTitle}</span>
                  </div>

                  {/* Thời gian đọc ước tính (nếu có) */}
                  {chapter.readingTime && chapter.readingTime > 0 ? (
                    <span
                      className={cn(
                        'flex items-center gap-1 text-[11px] shrink-0 font-normal opacity-80',
                        themeClasses.mutedText
                      )}
                    >
                      <Clock className="w-3 h-3 opacity-60" />
                      {chapter.readingTime}p
                    </span>
                  ) : null}
                </Link>
              );
            })
          ) : (
            /* TRẠNG THÁI RỖNG (EMPTY STATE) KHI KHÔNG TÌM THẤY KẾT QUẢ */
            <div className="py-12 px-4 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold">Không tìm thấy chương nào</p>
                <p className={cn('text-xs', themeClasses.mutedText)}>
                  Thử tìm kiếm với từ khóa hoặc số thứ tự chương khác.
                </p>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
