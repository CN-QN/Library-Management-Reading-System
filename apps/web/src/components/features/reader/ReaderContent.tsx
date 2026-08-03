'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Clock, CheckCircle, Sparkles, MessageSquarePlus, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FullChapterDetail, ReaderTheme, ReaderFontSize, ReaderLineHeight } from '@/types/Reading';

/**
 * Interface thuộc tính đầu vào cho component ReaderContent.
 */
export interface ReaderContentProps {
  /** Tiêu đề của cuốn sách */
  bookTitle: string;
  /** Chuỗi slug cuốn sách (dùng để tạo liên kết về trang chi tiết sách hoặc trang đánh giá) */
  bookSlug: string;
  /** Dữ liệu chi tiết của chương đang đọc (bao gồm các đoạn văn, mở đầu, kết luận) */
  chapter: FullChapterDetail;
  /** Chủ đề màu nền hiển thị ('light' | 'sepia' | 'dark') */
  theme: ReaderTheme;
  /** Cỡ chữ hiển thị nội dung ('sm' | 'base' | 'lg' | 'xl' | '2xl') */
  fontSize: ReaderFontSize;
  /** Khoảng cách giãn dòng ('normal' | 'relaxed' | 'loose') */
  lineHeight: ReaderLineHeight;
  /** ID của chương trước (nếu có) */
  prevChapterId?: string | null;
  /** ID của chương kế tiếp (nếu có) */
  nextChapterId?: string | null;
  /** Số thứ tự của chương tiếp theo (nếu có) */
  nextChapterNumber?: number | null;
  /** Cờ đánh dấu đây có phải chương cuối cùng của cuốn sách hay không */
  isLastChapter: boolean;
  /** Class CSS tùy biến bổ sung từ bên ngoài (nếu có) */
  className?: string;
}

/**
 * Trả về class CSS điều chỉnh kích thước font chữ tương ứng với tùy chọn `fontSize`.
 *
 * TẠI SAO CẦN HELPER NÀY:
 * - Áp dụng phản hồi linh hoạt (responsive size) giúp chữ hiển thị chuẩn xác trên mobile lẫn desktop.
 * - Cho phép người đọc tăng/giảm cỡ chữ tùy thích để phù hợp với thị lực.
 */
function getFontSizeClasses(fontSize: ReaderFontSize = 'base'): string {
  switch (fontSize) {
    case 'sm':
      return 'text-sm sm:text-base';
    case 'lg':
      return 'text-lg sm:text-xl';
    case 'xl':
      return 'text-xl sm:text-2xl';
    case '2xl':
      return 'text-2xl sm:text-3xl';
    case 'base':
    default:
      return 'text-base sm:text-lg';
  }
}

/**
 * Trả về class CSS điều chỉnh chiều cao dòng (line height) tương ứng với tùy chọn `lineHeight`.
 *
 * TẠI SAO CẦN HELPER NÀY:
 * - Đảm bảo khoảng cách giữa các dòng chữ không bị dính vào nhau gây mỏi mắt khi đọc lâu.
 * - 'normal': Giãn 1.6 (chật), 'relaxed': Giãn 1.9 (vừa - chuẩn đọc văn học), 'loose': Giãn 2.3 (thoáng).
 */
function getLineHeightClasses(lineHeight: ReaderLineHeight = 'relaxed'): string {
  switch (lineHeight) {
    case 'normal':
      return 'leading-[1.6]';
    case 'loose':
      return 'leading-[2.3]';
    case 'relaxed':
    default:
      return 'leading-[1.9]';
  }
}

/**
 * Trả về bộ class CSS hỗ trợ màu sắc chữ, màu nền card, đường kẻ và viền highlight theo theme.
 *
 * TẠI SAO CẦN HELPER NÀY:
 * - Đồng bộ tuyệt đối màu văn bản, màu selection (bôi đen chữ), khung quote và nút chuyển chương
 *   với 3 chủ đề đọc chính: Sáng (light), Sepia (đọc ban đêm nhẹ dịu) và Tối (dark).
 */
function getContentThemeClasses(theme: ReaderTheme = 'light') {
  switch (theme) {
    case 'sepia':
      return {
        container: 'text-[#5f4b32] selection:bg-[#d6ba90]/40 selection:text-[#322517]',
        mutedText: 'text-[#8a755d]',
        chapterBadge: 'bg-[#ebdcb9] text-[#78350f] border border-[#d8c79d]',
        quoteBorder: 'border-[#b45309]/50 bg-[#ebdcb9]/40 text-[#433422]',
        conclusionBg: 'bg-[#ebdcb9]/50 border-[#d8c79d] text-[#433422]',
        divider: 'border-[#e2d5b7]',
        cardCongratsBg: 'bg-[#ebdcb9]/60 border-[#d8c79d]',
        dropCap: 'first-letter:text-[#78350f]',
        nextBtn:
          'bg-[#78350f] hover:bg-[#602a0c] active:bg-[#451e08] text-[#fffbeb] shadow-md hover:shadow-lg shadow-[#78350f]/20',
        actionBtnSecondary:
          'bg-[#ebdcb9] hover:bg-[#e2d2aa] active:bg-[#d8c79d] text-[#433422] border border-[#d8c79d]',
      };
    case 'dark':
      return {
        container: 'text-[#e4e4e7] selection:bg-amber-500/30 selection:text-amber-200',
        mutedText: 'text-stone-400',
        chapterBadge: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
        quoteBorder: 'border-amber-500/60 bg-amber-500/10 text-stone-200',
        conclusionBg: 'bg-stone-900/60 border-stone-800 text-stone-200',
        divider: 'border-stone-800',
        cardCongratsBg: 'bg-stone-900/80 border-stone-800',
        dropCap: 'first-letter:text-amber-400',
        nextBtn:
          'bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-stone-950 font-bold shadow-md hover:shadow-amber-500/20',
        actionBtnSecondary:
          'bg-stone-900 hover:bg-stone-800 active:bg-stone-800/80 text-stone-200 border border-stone-800',
      };
    case 'light':
    default:
      return {
        container: 'text-[#1e293b] selection:bg-amber-200/70 selection:text-amber-900',
        mutedText: 'text-slate-500',
        chapterBadge: 'bg-amber-100 text-amber-800 border border-amber-200/80',
        quoteBorder: 'border-amber-500 bg-amber-500/5 text-slate-700',
        conclusionBg: 'bg-stone-50 border-stone-200 text-slate-800',
        divider: 'border-stone-200',
        cardCongratsBg: 'bg-stone-50 border-stone-200/90',
        dropCap: 'first-letter:text-amber-600',
        nextBtn:
          'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white shadow-md hover:shadow-lg shadow-amber-600/20',
        actionBtnSecondary:
          'bg-stone-100 hover:bg-stone-200/80 active:bg-stone-200 text-stone-800 border border-stone-200',
      };
  }
}

/**
 * ReaderContent - Component hiển thị nội dung chính của chương sách.
 *
 * TẠI SAO CẦN COMPONENT NÀY:
 * - Trình bày văn bản chương sách với trải nghiệm thị giác cao cấp (drop-cap chữ cái đầu, khoảng cách dòng tùy chỉnh).
 * - Hiển thị phần Dẫn nhập (Introduction) và Kết luận (Conclusion) nếu chương sách có dữ liệu này.
 * - Cung cấp bộ nút điều hướng cuối chương: "Đọc chương tiếp theo" hoặc Card "Chúc mừng hoàn thành cuốn sách".
 *
 * @param props - Chi tiết thuộc tính thông tin chương sách, theme, fontSize và lineHeight
 */
export function ReaderContent({
  bookTitle,
  bookSlug,
  chapter,
  theme = 'light',
  fontSize = 'base',
  lineHeight = 'relaxed',
  nextChapterId,
  nextChapterNumber,
  isLastChapter,
  className,
}: ReaderContentProps) {
  const themeClasses = getContentThemeClasses(theme);
  const fontSizeClass = getFontSizeClasses(fontSize);
  const lineHeightClass = getLineHeightClasses(lineHeight);

  // Danh sách đoạn văn trong chương
  const paragraphs = chapter.content?.paragraphs || [];

  return (
    <article
      className={cn(
        'max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-10 sm:py-14 font-sans transition-colors duration-200',
        themeClasses.container,
        className
      )}
    >
      {/* 1. CHAPTER HEADER: TIÊU ĐỀ & THÔNG TIN CHƯƠNG */}
      <header className="text-center mb-10 sm:mb-14 space-y-3.5">
        {/* Tag nhỏ chỉ số chương */}
        <div>
          <span
            className={cn(
              'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider',
              themeClasses.chapterBadge
            )}
          >
            Chương {chapter.number}
          </span>
        </div>

        {/* Tiêu đề chương lớn */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
          {chapter.title}
        </h1>

        {/* Tên sách & Thời gian đọc ước tính */}
        <div
          className={cn(
            'flex items-center justify-center gap-3 text-xs sm:text-sm font-medium pt-1',
            themeClasses.mutedText
          )}
        >
          <span className="flex items-center gap-1.5 truncate max-w-[200px] sm:max-w-xs" title={bookTitle}>
            <BookOpen className="w-3.5 h-3.5 shrink-0 opacity-70" />
            <span className="truncate">{bookTitle}</span>
          </span>
          <span className="opacity-40">•</span>
          <span className="flex items-center gap-1.5 shrink-0">
            <Clock className="w-3.5 h-3.5 shrink-0 opacity-70" />
            <span>~{chapter.readingTime || Math.max(1, Math.ceil(chapter.wordCount / 200))} phút đọc</span>
          </span>
        </div>

        {/* Đường kẻ chia section trang nhã */}
        <div className="pt-4 flex items-center justify-center gap-3">
          <div className={cn('h-px w-16 sm:w-24', themeClasses.divider, 'bg-current opacity-20')} />
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 opacity-60" />
          <div className={cn('h-px w-16 sm:w-24', themeClasses.divider, 'bg-current opacity-20')} />
        </div>
      </header>

      {/* 2. INTRODUCTION (NẾU CÓ): KHUNG QUOTE/DẪN NHẬP NỔI BẬT */}
      {chapter.content?.introduction && (
        <blockquote
          className={cn(
            'mb-8 sm:mb-10 p-4 sm:p-6 rounded-r-2xl border-l-4 italic shadow-2xs font-serif',
            fontSizeClass,
            lineHeightClass,
            themeClasses.quoteBorder
          )}
        >
          <div className="flex items-start gap-2">
            <Sparkles className="w-5 h-5 shrink-0 text-amber-500 mt-1 not-italic opacity-80" />
            <div>{chapter.content.introduction}</div>
          </div>
        </blockquote>
      )}

      {/* 3. PARAGRAPHS: DANH SÁCH CÁC ĐOẠN VĂN BẢN (CÓ DROP-CAP CHO ĐOẠN ĐẦU TIÊN) */}
      <section className="space-y-6 sm:space-y-8">
        {paragraphs.map((paragraph, index) => {
          const isFirstParagraph = index === 0;

          return (
            <p
              key={paragraph.id || `para-${index}`}
              className={cn(
                'text-justify sm:text-left transition-all duration-150',
                fontSizeClass,
                lineHeightClass,
                // Chữ cái đầu tiên của đoạn văn thứ nhất có Drop-Cap thanh lịch
                isFirstParagraph && [
                  'first-letter:float-left',
                  'first-letter:text-4xl sm:first-letter:text-5xl',
                  'first-letter:font-bold',
                  'first-letter:mr-3',
                  'first-letter:leading-none',
                  'first-letter:mt-1',
                  themeClasses.dropCap,
                ]
              )}
            >
              {paragraph.text}
            </p>
          );
        })}
      </section>

      {/* 4. CONCLUSION (NẾU CÓ): KHUNG KẾT CHƯƠNG / TÓM LƯỢC */}
      {chapter.content?.conclusion && (
        <aside
          className={cn(
            'mt-10 sm:mt-12 p-5 sm:p-6 rounded-2xl border shadow-2xs space-y-2',
            fontSizeClass,
            lineHeightClass,
            themeClasses.conclusionBg
          )}
        >
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
            <BookOpen className="w-4 h-4" />
            Tóm tắt kết chương
          </div>
          <p className="italic opacity-90">{chapter.content.conclusion}</p>
        </aside>
      )}

      {/* 5. CHAPTER END ACTION: ĐIỀU HƯỚNG CUỐI CHƯƠNG */}
      <div className="mt-14 sm:mt-20 pt-8 border-t border-stone-200/40 dark:border-stone-800/40">
        {!isLastChapter && nextChapterId ? (
          /* TRƯỜNG HỢP A: CÓ CHƯƠNG TIẾP THEO -> NÚT ĐỌC CHƯƠNG TIẾP THEO LỚN */
          <div className="flex flex-col items-center justify-center space-y-3">
            <p className={cn('text-xs font-semibold uppercase tracking-wider', themeClasses.mutedText)}>
              Bạn đã xem hết chương {chapter.number}
            </p>
            <Link
              href={`/books/${bookSlug}/read?chapterId=${nextChapterId}`}
              className={cn(
                'group inline-flex items-center justify-center gap-3 px-6 sm:px-8 py-3.5 rounded-2xl text-sm sm:text-base font-bold transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0',
                themeClasses.nextBtn
              )}
            >
              <span>
                Đọc chương tiếp theo {nextChapterNumber ? `(Chương ${nextChapterNumber})` : ''}
              </span>
              <ArrowRight className="w-5 h-5 shrink-0 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        ) : (
          /* TRƯỜNG HỢP B: LÀ CHƯƠNG CUỐI CÙNG -> CARD CHÚC MỪNG VÀ 2 NÚT HÀNH ĐỘNG */
          <div
            className={cn(
              'p-6 sm:p-8 rounded-3xl border text-center space-y-6 shadow-sm',
              themeClasses.cardCongratsBg
            )}
          >
            <div className="w-14 h-14 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center shadow-2xs">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
                🎉 Chúc mừng bạn đã hoàn thành cuốn sách!
              </h3>
              <p className={cn('text-xs sm:text-sm leading-relaxed', themeClasses.mutedText)}>
                Bạn đã đọc xong toàn bộ các chương của cuốn sách{' '}
                <strong className="font-semibold text-current">"{bookTitle}"</strong>. Hãy chia sẻ cảm xúc và đánh giá cuốn sách này nhé!
              </p>
            </div>

            {/* 2 Nút điều hướng cho chương cuối */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              {/* Nút 1: Quay về trang sách */}
              <Link
                href={`/books/${bookSlug}`}
                className={cn(
                  'w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer',
                  themeClasses.actionBtnSecondary
                )}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay về trang sách</span>
              </Link>

              {/* Nút 2: Viết đánh giá & Nhận xét */}
              <Link
                href={`/books/${bookSlug}#reviews`}
                className={cn(
                  'w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer',
                  themeClasses.nextBtn
                )}
              >
                <MessageSquarePlus className="w-4 h-4" />
                <span>Viết đánh giá & Nhận xét</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
