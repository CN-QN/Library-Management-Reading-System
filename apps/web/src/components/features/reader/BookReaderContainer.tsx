'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { BookDetail } from '@/types/BookDetail';
import type { FullChapterDetail, Chapter, ReadingProgress, ReaderTheme } from '@/types/Reading';
import { useReaderSettings } from '@/hooks/useReaderSettings';
import { useReadingProgress } from '@/hooks/useReadingProgress';
import { useReadingSession } from '@/hooks/useReadingSession';
import { ReaderHeader } from './ReaderHeader';
import { ReaderContent } from './ReaderContent';
import { ReaderFooter } from './ReaderFooter';
import { ReaderProgressBar } from './ReaderProgressBar';
import { ReaderSettingsModal } from './ReaderSettingsModal';
import { ReaderTableOfContents } from './ReaderTableOfContents';
import { ReaderSkeleton } from './ReaderSkeleton';

/**
 * Props cho component BookReaderContainer.
 */
export interface BookReaderContainerProps {
  /** Thông tin cuốn sách đang đọc */
  book: BookDetail;
  /** Dữ liệu chương sách đầy đủ hiện tại */
  currentChapter: FullChapterDetail;
  /** Danh sách tất cả các chương của cuốn sách */
  chapters: Chapter[];
  /** Tiến độ đọc ban đầu khôi phục từ Server/DB (nếu có) */
  initialProgress?: ReadingProgress | null;
  /** Class CSS tùy biến bổ sung (nếu có) */
  className?: string;
}

/**
 * Trả về class CSS cấu hình màu nền và màu chữ chính cho Container đọc sách theo theme.
 *
 * TẠI SAO CẦN HELPER NÀY:
 * - Đảm bảo toàn bộ khung màn hình trang đọc sách đồng bộ màu sắc với 3 chủ đề: Light (trắng), Sepia (vàng kem), Dark (tối).
 *
 * @param theme - Chủ đề màu nền đọc sách hiện tại
 */
function getContainerThemeClasses(theme: ReaderTheme = 'light') {
  switch (theme) {
    case 'sepia':
      return 'bg-[#fbf0d9] text-[#5f4b32] selection:bg-[#d6ba90]/40 selection:text-[#322517]';
    case 'dark':
      return 'bg-[#121212] text-[#e4e4e7] selection:bg-amber-500/30 selection:text-amber-200';
    case 'light':
    default:
      return 'bg-white text-stone-900 selection:bg-amber-200/70 selection:text-amber-900';
  }
}

/**
 * BookReaderContainer - Component container quản lý toàn bộ trải nghiệm đọc sách (Reader Portal).
 *
 * TẠI SAO CẦN COMPONENT NÀY:
 * 1. Tích hợp 3 Custom Hooks quan trọng:
 *    - `useReaderSettings`: Đồng bộ cài đặt theme, fontSize, lineHeight với localStorage.
 *    - `useReadingProgress`: Theo dõi phần trăm cuộn trang, tự động debounce lưu tiến độ đọc lên API & beacon khi thoát.
 *    - `useReadingSession`: Theo dõi thời gian thực tế người dùng đọc sách (Heartbeat API 30s).
 * 2. Xử lý Phím tắt (Keyboard Navigation):
 *    - Esc: Đóng các modal/drawer đang mở (Mục lục, Cài đặt).
 *    - ArrowLeft / PageUp: Chuyển sang chương trước.
 *    - ArrowRight / PageDown: Chuyển sang chương tiếp theo.
 * 3. Khôi phục vị trí đọc (Scroll Restoration): Tự động cuộn mượt về vị trí đọc dở trước đó khi tải xong trang.
 * 4. Phối hợp kết hợp tất cả các sub-components (`ReaderHeader`, `ReaderContent`, `ReaderFooter`, `ReaderProgressBar`, `ReaderSettingsModal`, `ReaderTableOfContents`).
 *
 * @param props - Chi tiết thuộc tính thông tin sách, chương hiện tại, danh sách chương và tiến độ ban đầu
 */
export function BookReaderContainer({
  book,
  currentChapter,
  chapters = [],
  initialProgress,
  className,
}: BookReaderContainerProps) {
  const router = useRouter();

  // State điều khiển mở/đóng Drawer Mục lục và Modal Cài đặt
  const [isTOCOpen, setIsTOCOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // 1. Hook quản lý Cài đặt giao diện người dùng
  const { settings, isLoaded, setTheme, setFontSize, setLineHeight, resetSettings } =
    useReaderSettings();

  const theme = settings.theme;
  const fontSize = settings.fontSize;
  const lineHeight = settings.lineHeight;

  // XÁC ĐỊNH SỐ LƯỢNG CHƯƠNG ĐỂ TÍNH TIẾN ĐỘ SÁCH
  const totalChapters = chapters.length > 0 ? chapters.length : book.totalChapters;

  // 2. Hook quản lý Tiến độ đọc & Tự động lưu scroll position
  const { scrollPercentage, restoreScroll, saveNow } = useReadingProgress({
    bookId: book.id,
    chapterId: currentChapter.id,
    chapterNumber: currentChapter.number,
    totalChapters,
    initialProgress,
  });

  // 3. Hook quản lý Phiên đọc sách (Reading Session Tracking)
  useReadingSession({
    bookId: book.id,
    chapterId: currentChapter.id,
    enabled: true,
  });

  // XÁC ĐỊNH CHƯƠNG TRƯỚC VÀ CHƯƠNG SAU TỪ DANH SÁCH CHƯƠNG
  const currentIndex = chapters.findIndex((ch) => ch.id === currentChapter.id);
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter =
    currentIndex >= 0 && currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

  const prevChapterId = prevChapter?.id || null;
  const nextChapterId = nextChapter?.id || null;
  const prevChapterNumber = prevChapter?.number || null;
  const nextChapterNumber = nextChapter?.number || null;
  const isLastChapter = currentIndex === chapters.length - 1 || !nextChapterId;

  // EFFECT 1: TỰ ĐỘNG KHÔI PHỤC VỊ TRÍ CUỘN TRANG VỀ CHỖ CŨ SAU KHI TIẾN HÀNH MOUNT
  useEffect(() => {
    if (isLoaded) {
      restoreScroll();
    }
  }, [isLoaded, restoreScroll, currentChapter.id]);

  // EFFECT 2: XỬ LÝ PHÍM TẮT BÀN PHÍM (KEYBOARD NAVIGATION)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Bỏ qua phím tắt nếu người dùng đang nhập dữ liệu trong input hoặc textarea
      const activeEl = document.activeElement;
      const isEditingInput =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          (activeEl as HTMLElement).isContentEditable);

      if (isEditingInput) return;

      if (e.key === 'Escape') {
        if (isTOCOpen) setIsTOCOpen(false);
        if (isSettingsOpen) setIsSettingsOpen(false);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        if (prevChapterId) {
          saveNow();
          router.push(`/books/${book.slug}/read?chapterId=${prevChapterId}`);
        }
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        if (nextChapterId) {
          saveNow();
          router.push(`/books/${book.slug}/read?chapterId=${nextChapterId}`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isTOCOpen, isSettingsOpen, prevChapterId, nextChapterId, book.slug, router, saveNow]);

  // NẾU CHƯA TẢI XONG CẤU HÌNH TỪ LOCALSTORAGE (TRÁNH LỖI HYDRATION) -> HIỂN THỊ SKELETON LOADING
  if (!isLoaded) {
    return <ReaderSkeleton theme={theme} />;
  }

  return (
    <div
      className={cn(
        'min-h-screen flex flex-col font-sans transition-colors duration-200 pt-14 pb-14 relative',
        getContainerThemeClasses(theme),
        className
      )}
    >
      {/* 1. THANH TIẾN TRÌNH ĐỌC (TOP PROGRESS BAR) */}
      <ReaderProgressBar percentage={scrollPercentage} theme={theme} />

      {/* 2. THANH HEADER ĐIỀU HƯỚNG TRÊN CÙNG (FIXED TOP) */}
      <ReaderHeader
        bookTitle={book.title}
        bookSlug={book.slug}
        chapterTitle={currentChapter.title}
        chapterNumber={currentChapter.number}
        theme={theme}
        onOpenTOC={() => setIsTOCOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* 3. NỘI DUNG CHÍNH CỦA CHƯƠNG SÁCH (MAIN READER CONTENT) */}
      <main className="flex-1">
        <ReaderContent
          bookTitle={book.title}
          bookSlug={book.slug}
          chapter={currentChapter}
          theme={theme}
          fontSize={fontSize}
          lineHeight={lineHeight}
          prevChapterId={prevChapterId}
          nextChapterId={nextChapterId}
          nextChapterNumber={nextChapterNumber}
          isLastChapter={isLastChapter}
        />
      </main>

      {/* 4. THANH FOOTER ĐIỀU HƯỚNG DƯỚI CÙNG (FIXED BOTTOM) */}
      <ReaderFooter
        bookSlug={book.slug}
        prevChapterId={prevChapterId}
        nextChapterId={nextChapterId}
        prevChapterNumber={prevChapterNumber}
        nextChapterNumber={nextChapterNumber}
        currentChapterNumber={currentChapter.number}
        totalChapters={chapters.length > 0 ? chapters.length : book.totalChapters}
        percentage={scrollPercentage}
        readingTime={currentChapter.readingTime}
        theme={theme}
        onOpenTOC={() => setIsTOCOpen(true)}
      />

      {/* 5. MODAL TÙY CHỈNH CÀI ĐẶT GIAO DIỆN ĐỌC */}
      <ReaderSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        fontSize={fontSize}
        lineHeight={lineHeight}
        setTheme={setTheme}
        setFontSize={setFontSize}
        setLineHeight={setLineHeight}
        resetSettings={resetSettings}
      />

      {/* 6. DRAWER MỤC LỤC TOÀN BỘ CÁC CHƯƠNG SÁCH */}
      <ReaderTableOfContents
        isOpen={isTOCOpen}
        onClose={() => setIsTOCOpen(false)}
        bookTitle={book.title}
        bookSlug={book.slug}
        chapters={chapters}
        currentChapterId={currentChapter.id}
        theme={theme}
      />
    </div>
  );
}
