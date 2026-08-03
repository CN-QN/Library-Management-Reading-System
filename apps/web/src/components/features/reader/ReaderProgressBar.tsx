'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { ReaderTheme } from '@/types/Reading';

/**
 * Props cho component ReaderProgressBar.
 */
export interface ReaderProgressBarProps {
  /**
   * Phần trăm tiến độ đọc sách (giá trị số từ 0 đến 100).
   * Ví dụ: 45.5 tương ứng 46% tiến độ.
   */
  percentage: number;
  /**
   * Chủ đề giao diện đọc sách hiện tại (light, sepia, dark).
   * Mặc định là 'light'.
   */
  theme?: ReaderTheme;
  /**
   * Class CSS tùy biến bổ sung từ bên ngoài (nếu có).
   */
  className?: string;
}

/**
 * Trả về các class CSS cấu hình màu sắc thanh tiến trình tương thích với theme được chọn.
 *
 * TẠI SAO CẦN HELPER NÀY:
 * - Giúp duy trì sự đồng bộ thị giác với 3 chủ đề đọc sách (light, sepia, dark).
 * - Sử dụng màu accent amber/gold làm tone màu chủ đạo để tôn lên trải nghiệm đọc sách cao cấp.
 *
 * @param theme - Chủ đề màu nền đọc sách hiện tại
 */
function getProgressBarThemeClasses(theme: ReaderTheme = 'light') {
  switch (theme) {
    case 'sepia':
      return {
        track: 'bg-[#e2d5b7]/50',
        bar: 'bg-[#92400e] shadow-[0_0_8px_rgba(146,64,14,0.4)]',
        badge: 'bg-[#78350f] text-[#fffbeb] border border-[#b45309]/30',
      };
    case 'dark':
      return {
        track: 'bg-stone-800/80',
        bar: 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]',
        badge: 'bg-amber-500 text-stone-950 border border-amber-400/40 font-semibold',
      };
    case 'light':
    default:
      return {
        track: 'bg-amber-100/70',
        bar: 'bg-amber-600 shadow-[0_0_8px_rgba(217,119,6,0.4)]',
        badge: 'bg-amber-600 text-white border border-amber-500/30',
      };
  }
}

/**
 * ReaderProgressBar - Thanh tiến trình thể hiện vị trí đọc sách theo tỷ lệ phần trăm.
 *
 * Vị trí: Cố định trên cùng màn hình (fixed top-0 left-0 right-0 z-50).
 *
 * TẠI SAO CẦN COMPONENT NÀY:
 * - Cung cấp phản hồi thị giác tức thì giúp độc giả nắm bắt tiến độ đọc cuốn sách hoặc chương hiện tại.
 * - Sử dụng CSS transition mượt mà (150ms ease-out) tránh hiện tượng giật giật khi cuộn trang liên tục.
 * - Tự động giới hạn (clamp) trong khoảng 0% - 100% để đảm bảo không bị tràn giao diện.
 *
 * @param percentage - Phần trăm tiến độ đọc (0 - 100)
 * @param theme - Chủ đề đọc sách hiện tại (light, sepia, dark)
 * @param className - Class CSS mở rộng tùy chọn
 */
export function ReaderProgressBar({
  percentage,
  theme = 'light',
  className,
}: ReaderProgressBarProps) {
  // Giới hạn giá trị percentage trong khoảng [0, 100] để tránh lỗi đè layout
  const clampedPercentage = Math.min(100, Math.max(0, isNaN(percentage) ? 0 : percentage));
  
  // Làm tròn số nguyên để hiển thị trên Badge trực quan hơn
  const displayPercentage = Math.round(clampedPercentage);

  // Lấy bộ class màu sắc theo theme hiện tại
  const themeClasses = getProgressBarThemeClasses(theme);

  return (
    <div
      role="progressbar"
      aria-valuenow={displayPercentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Tiến độ đọc sách: ${displayPercentage}%`}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 h-1.5 w-full pointer-events-none select-none overflow-visible',
        themeClasses.track,
        className
      )}
    >
      {/* Thanh tiến trình màu chủ đạo co giãn theo percentage */}
      <div
        className={cn(
          'h-full rounded-r-full transition-[width] duration-150 ease-out',
          themeClasses.bar
        )}
        style={{ width: `${clampedPercentage}%` }}
      />

      {/* Tooltip / Badge hiển thị % chạy theo vị trí thanh tiến trình */}
      {/* Giới hạn vị trí left từ 4% đến 96% để badge không bị lấn ra ngoài 2 mép màn hình */}
      <div
        className="absolute top-2 transition-[left] duration-150 ease-out -translate-x-1/2 pointer-events-none"
        style={{ left: `${Math.min(96, Math.max(4, clampedPercentage))}%` }}
      >
        <div
          className={cn(
            'px-2 py-0.5 text-[10px] font-bold rounded-full shadow-sm tracking-tight whitespace-nowrap backdrop-blur-sm transition-colors duration-200',
            themeClasses.badge
          )}
        >
          {displayPercentage}%
        </div>
      </div>
    </div>
  );
}
