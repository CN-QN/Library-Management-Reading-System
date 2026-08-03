'use client';

import React from 'react';
import { Sun, BookOpen, Moon, RotateCcw, Minus, Plus, Type, AlignJustify } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import type { ReaderTheme, ReaderFontSize, ReaderLineHeight } from '@/types/Reading';

/**
 * Props định nghĩa cho component ReaderSettingsModal.
 */
export interface ReaderSettingsModalProps {
  /** Cờ bật/tắt trạng thái mở modal cài đặt */
  isOpen: boolean;
  /** Callback được gọi khi đóng modal */
  onClose: () => void;
  /** Chủ đề màu nền đọc sách hiện tại ('light' | 'sepia' | 'dark') */
  theme: ReaderTheme;
  /** Cỡ chữ hiển thị nội dung ('sm' | 'base' | 'lg' | 'xl' | '2xl') */
  fontSize: ReaderFontSize;
  /** Khoảng cách giãn dòng ('normal' | 'relaxed' | 'loose') */
  lineHeight: ReaderLineHeight;
  /** Hàm cập nhật chủ đề màu nền */
  setTheme: (theme: ReaderTheme) => void;
  /** Hàm cập nhật cỡ chữ đọc sách */
  setFontSize: (size: ReaderFontSize) => void;
  /** Hàm cập nhật giãn dòng văn bản */
  setLineHeight: (lineHeight: ReaderLineHeight) => void;
  /** Hàm khôi phục toàn bộ cài đặt về trạng thái mặc định ban đầu */
  resetSettings: () => void;
}

/**
 * Danh sách cấu hình cỡ chữ đọc sách kèm thông số pixel và nhãn hiển thị trực quan.
 */
const FONT_SIZE_OPTIONS: { key: ReaderFontSize; px: number; label: string }[] = [
  { key: 'sm', px: 14, label: '14px' },
  { key: 'base', px: 16, label: '16px' },
  { key: 'lg', px: 18, label: '18px' },
  { key: 'xl', px: 20, label: '20px' },
  { key: '2xl', px: 24, label: '24px' },
];

/**
 * Danh sách cấu hình khoảng cách giãn dòng văn bản.
 */
const LINE_HEIGHT_OPTIONS: { key: ReaderLineHeight; label: string; ratio: string }[] = [
  { key: 'normal', label: 'Chật', ratio: '1.5' },
  { key: 'relaxed', label: 'Vừa', ratio: '1.8' },
  { key: 'loose', label: 'Thoáng', ratio: '2.2' },
];

/**
 * Trả về màu nền và style phù hợp theo chủ đề đọc hiện tại cho SheetContent.
 *
 * TẠI SAO CẦN HELPER NÀY:
 * - Giúp SheetContent của modal Cài đặt hòa hợp thị giác tuyệt đối với theme đọc sách hiện tại.
 * - Tránh hiện tượng tương phản gắt mắt khi mở cài đặt trong đêm (VD: đang đọc dark mode mà modal mở ra nền trắng).
 *
 * @param theme - Chủ đề màu đọc hiện tại ('light' | 'sepia' | 'dark')
 */
function getModalThemeClasses(theme: ReaderTheme = 'light') {
  switch (theme) {
    case 'sepia':
      return {
        content: 'bg-[#f4ecd8] text-[#433422] border-[#e2d5b7]',
        mutedText: 'text-[#7c6950]',
        cardBg: 'bg-[#ebdcb9]/60 hover:bg-[#ebdcb9] border-[#d8c79d]',
        cardActive: 'bg-[#ebdcb9] border-amber-600 ring-2 ring-amber-600/60 text-[#322517]',
        sectionBg: 'bg-[#ebdcb9]/40 border-[#e2d5b7]',
        buttonStep:
          'bg-[#ebdcb9] hover:bg-[#e2d2aa] active:bg-[#d8c79d] border-[#d8c79d] text-[#433422] disabled:opacity-40',
        resetBtn:
          'bg-[#ebdcb9]/80 hover:bg-[#e2d2aa] text-[#433422] border-[#d8c79d] active:bg-[#d8c79d]',
      };
    case 'dark':
      return {
        content: 'bg-stone-950 text-stone-100 border-stone-800',
        mutedText: 'text-stone-400',
        cardBg: 'bg-stone-900/60 hover:bg-stone-900 border-stone-800',
        cardActive: 'bg-stone-900 border-amber-500 ring-2 ring-amber-500/60 text-stone-50',
        sectionBg: 'bg-stone-900/40 border-stone-800/80',
        buttonStep:
          'bg-stone-900 hover:bg-stone-800 active:bg-stone-800/80 border-stone-800 text-stone-200 disabled:opacity-40',
        resetBtn:
          'bg-stone-900/80 hover:bg-stone-800 text-stone-200 border-stone-800 active:bg-stone-800/80',
      };
    case 'light':
    default:
      return {
        content: 'bg-white text-stone-900 border-stone-200',
        mutedText: 'text-stone-500',
        cardBg: 'bg-stone-50 hover:bg-stone-100/80 border-stone-200',
        cardActive: 'bg-stone-50 border-amber-500 ring-2 ring-amber-500/60 text-stone-950',
        sectionBg: 'bg-stone-50/60 border-stone-200/80',
        buttonStep:
          'bg-stone-100 hover:bg-stone-200/70 active:bg-stone-200 border-stone-200 text-stone-800 disabled:opacity-40',
        resetBtn:
          'bg-stone-100/80 hover:bg-stone-200/70 text-stone-800 border-stone-200 active:bg-stone-200',
      };
  }
}

/**
 * ReaderSettingsModal - Component tùy chỉnh cài đặt giao diện đọc sách.
 *
 * Mở dạng Sheet từ cạnh phải màn hình (`side="right"`).
 * Cho phép tùy chỉnh 3 thông số chính:
 * 1. Chủ đề giao diện (Sáng, Sepia, Tối)
 * 2. Cỡ chữ văn bản (Nút điều chỉnh A-/A+ nhanh và 5 mức chọn trực tiếp 14px -> 24px)
 * 3. Khoảng cách giãn dòng (Chật 1.5, Vừa 1.8, Thoáng 2.2)
 * Kèm nút "Đặt lại mặc định" để khôi phục cấu hình ban đầu.
 *
 * @param props - Chi tiết thuộc tính điều khiển và handler cho cài đặt
 */
export function ReaderSettingsModal({
  isOpen,
  onClose,
  theme = 'light',
  fontSize = 'base',
  lineHeight = 'relaxed',
  setTheme,
  setFontSize,
  setLineHeight,
  resetSettings,
}: ReaderSettingsModalProps) {
  const themeClasses = getModalThemeClasses(theme);

  // Tìm index của cỡ chữ hiện tại để hỗ trợ bấm nút A- / A+ điều chỉnh nhanh
  const currentFontSizeIndex = FONT_SIZE_OPTIONS.findIndex((opt) => opt.key === fontSize);

  /**
   * Giảm 1 nấc cỡ chữ (nếu chưa đạt mức tối thiểu 'sm').
   */
  const handleDecreaseFontSize = () => {
    if (currentFontSizeIndex > 0) {
      setFontSize(FONT_SIZE_OPTIONS[currentFontSizeIndex - 1].key);
    }
  };

  /**
   * Tăng 1 nấc cỡ chữ (nếu chưa đạt mức tối đa '2xl').
   */
  const handleIncreaseFontSize = () => {
    if (currentFontSizeIndex < FONT_SIZE_OPTIONS.length - 1) {
      setFontSize(FONT_SIZE_OPTIONS[currentFontSizeIndex + 1].key);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className={cn(
          'w-full sm:max-w-md overflow-y-auto p-5 sm:p-6 transition-colors duration-200 font-sans',
          themeClasses.content
        )}
      >
        <SheetHeader className="p-0 pr-8 mb-6 text-left border-b border-stone-200/40 dark:border-stone-800/40 pb-4">
          <SheetTitle className="text-lg font-bold flex items-center gap-2">
            <Type className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            Tùy chỉnh giao diện đọc
          </SheetTitle>
          <SheetDescription className={cn('text-xs sm:text-sm mt-1', themeClasses.mutedText)}>
            Điều chỉnh màu nền, cỡ chữ và khoảng cách dòng để có trải nghiệm đọc thoải mái nhất.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* SECTION 1: GIAO DIỆN ĐỌC (CHỦ ĐỀ MÀU NỀN) */}
          <section className="space-y-2.5">
            <label className="text-xs font-semibold uppercase tracking-wider block opacity-80">
              Chủ đề màu nền
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {/* Card 1: Giao diện Sáng (Light) */}
              <button
                type="button"
                onClick={() => setTheme('light')}
                aria-label="Chọn chủ đề Sáng"
                className={cn(
                  'flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer group',
                  theme === 'light' ? themeClasses.cardActive : themeClasses.cardBg
                )}
              >
                <div className="w-8 h-8 rounded-full bg-white border border-stone-300 flex items-center justify-center shadow-2xs mb-2 group-hover:scale-105 transition-transform">
                  <Sun className="w-4 h-4 text-amber-500" />
                </div>
                <span className="text-xs font-medium">Sáng</span>
              </button>

              {/* Card 2: Giao diện Sepia (Sepia) */}
              <button
                type="button"
                onClick={() => setTheme('sepia')}
                aria-label="Chọn chủ đề Sepia"
                className={cn(
                  'flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer group',
                  theme === 'sepia' ? themeClasses.cardActive : themeClasses.cardBg
                )}
              >
                <div className="w-8 h-8 rounded-full bg-[#f4ecd8] border border-[#e2d5b7] flex items-center justify-center shadow-2xs mb-2 group-hover:scale-105 transition-transform">
                  <BookOpen className="w-4 h-4 text-amber-700" />
                </div>
                <span className="text-xs font-medium">Sepia</span>
              </button>

              {/* Card 3: Giao diện Tối (Dark) */}
              <button
                type="button"
                onClick={() => setTheme('dark')}
                aria-label="Chọn chủ đề Tối"
                className={cn(
                  'flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer group',
                  theme === 'dark' ? themeClasses.cardActive : themeClasses.cardBg
                )}
              >
                <div className="w-8 h-8 rounded-full bg-stone-950 border border-stone-800 flex items-center justify-center shadow-2xs mb-2 group-hover:scale-105 transition-transform">
                  <Moon className="w-4 h-4 text-amber-400" />
                </div>
                <span className="text-xs font-medium">Tối</span>
              </button>
            </div>
          </section>

          {/* SECTION 2: CỠ CHỮ ĐỌC SÁCH */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider block opacity-80">
                Cỡ chữ nội dung
              </label>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                {FONT_SIZE_OPTIONS[currentFontSizeIndex >= 0 ? currentFontSizeIndex : 1]?.label || '16px'}
              </span>
            </div>

            {/* Nút điều chỉnh nhanh A- / A+ */}
            <div
              className={cn(
                'flex items-center justify-between p-2.5 rounded-xl border',
                themeClasses.sectionBg
              )}
            >
              <button
                type="button"
                onClick={handleDecreaseFontSize}
                disabled={currentFontSizeIndex <= 0}
                aria-label="Giảm kích thước chữ"
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer',
                  themeClasses.buttonStep
                )}
              >
                <Minus className="w-3.5 h-3.5" />
                <span>A- (Nhỏ)</span>
              </button>

              <span className={cn('text-xs font-medium px-2 text-center', themeClasses.mutedText)}>
                Tùy chỉnh nhanh
              </span>

              <button
                type="button"
                onClick={handleIncreaseFontSize}
                disabled={currentFontSizeIndex >= FONT_SIZE_OPTIONS.length - 1}
                aria-label="Tăng kích thước chữ"
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer',
                  themeClasses.buttonStep
                )}
              >
                <span>A+ (Lớn)</span>
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 5 Nút chọn cỡ chữ trực tiếp (14px, 16px, 18px, 20px, 24px) */}
            <div className="grid grid-cols-5 gap-1.5">
              {FONT_SIZE_OPTIONS.map((opt) => {
                const isActive = fontSize === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setFontSize(opt.key)}
                    aria-label={`Chọn cỡ chữ ${opt.label}`}
                    className={cn(
                      'flex flex-col items-center justify-center py-2.5 rounded-lg border text-center transition-all cursor-pointer',
                      isActive ? themeClasses.cardActive : themeClasses.cardBg
                    )}
                  >
                    <span
                      className={cn(
                        'font-bold leading-none mb-1',
                        opt.key === 'sm' && 'text-xs',
                        opt.key === 'base' && 'text-sm',
                        opt.key === 'lg' && 'text-base',
                        opt.key === 'xl' && 'text-lg',
                        opt.key === '2xl' && 'text-xl'
                      )}
                    >
                      A
                    </span>
                    <span className="text-[10px] opacity-75">{opt.px}px</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* SECTION 3: GIÃN DÒNG VĂN BẢN */}
          <section className="space-y-2.5">
            <label className="text-xs font-semibold uppercase tracking-wider block opacity-80 flex items-center gap-1.5">
              <AlignJustify className="w-3.5 h-3.5 text-amber-500" />
              Khoảng cách dòng
            </label>

            <div className="grid grid-cols-3 gap-2">
              {LINE_HEIGHT_OPTIONS.map((opt) => {
                const isActive = lineHeight === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setLineHeight(opt.key)}
                    aria-label={`Chọn giãn dòng ${opt.label}`}
                    className={cn(
                      'flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border transition-all cursor-pointer',
                      isActive ? themeClasses.cardActive : themeClasses.cardBg
                    )}
                  >
                    <span className="text-xs font-semibold">{opt.label}</span>
                    <span className={cn('text-[10px] mt-0.5', themeClasses.mutedText)}>
                      ({opt.ratio})
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* SECTION 4: NÚT ĐẶT LẠI MẶC ĐỊNH */}
          <section className="pt-4 border-t border-stone-200/40 dark:border-stone-800/40">
            <button
              type="button"
              onClick={resetSettings}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-2xs',
                themeClasses.resetBtn
              )}
            >
              <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Đặt lại cấu hình mặc định</span>
            </button>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
