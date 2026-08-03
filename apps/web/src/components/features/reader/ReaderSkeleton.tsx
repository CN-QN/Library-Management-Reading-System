'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import type { ReaderTheme } from '@/types/Reading';

/**
 * Props cho component ReaderSkeleton.
 */
export interface ReaderSkeletonProps {
  /** Chủ đề màu nền đọc sách (mặc định 'light') */
  theme?: ReaderTheme;
  /** Class CSS mở rộng tùy chọn */
  className?: string;
}

/**
 * Trả về màu nền cho container chính của ReaderSkeleton theo theme.
 *
 * TẠI SAO CẦN HELPER NÀY:
 * - Đảm bảo hiệu ứng skeleton loading mượt mà không bị lệch màu nền so với theme người dùng đã chọn.
 *
 * @param theme - Chủ đề màu nền đọc sách hiện tại
 */
function getSkeletonThemeClasses(theme: ReaderTheme = 'light') {
  switch (theme) {
    case 'sepia':
      return {
        container: 'bg-[#fbf0d9] text-[#5f4b32]',
        skeletonBg: 'bg-[#ebdcb9]/70',
        headerBg: 'bg-[#f4ecd8] border-[#e2d5b7]',
      };
    case 'dark':
      return {
        container: 'bg-[#121212] text-[#e4e4e7]',
        skeletonBg: 'bg-stone-800/60',
        headerBg: 'bg-stone-950 border-stone-800',
      };
    case 'light':
    default:
      return {
        container: 'bg-white text-stone-900',
        skeletonBg: 'bg-stone-200/70',
        headerBg: 'bg-stone-50 border-stone-200',
      };
  }
}

/**
 * ReaderSkeleton - Component hiển thị khung hình chờ (Loading Skeleton) cho giao diện đọc sách.
 *
 * TẠI SAO CẦN COMPONENT NÀY:
 * - Tối ưu trải nghiệm người dùng (UX) khi đang tải dữ liệu chương sách từ Backend API.
 * - Tránh hiện tượng nhảy bố cục (Layout Shift) bằng cách mô phỏng chính xác cấu trúc Header, Nội dung văn bản và Footer.
 *
 * @param props - Chi tiết thuộc tính cấu hình theme và className
 */
export function ReaderSkeleton({ theme = 'light', className }: ReaderSkeletonProps) {
  const themeClasses = getSkeletonThemeClasses(theme);

  return (
    <div
      className={cn(
        'min-h-screen flex flex-col font-sans transition-colors duration-200 select-none overflow-hidden',
        themeClasses.container,
        className
      )}
    >
      {/* 1. SKELETON HEADER (CỐ ĐỊNH PHÍA TRÊN) */}
      <div
        className={cn(
          'fixed top-0 left-0 right-0 z-40 h-14 border-b px-4 flex items-center justify-between gap-4 backdrop-blur-md',
          themeClasses.headerBg
        )}
      >
        <Skeleton className={cn('h-8 w-24 rounded-lg', themeClasses.skeletonBg)} />
        <div className="flex-1 max-w-md mx-auto flex flex-col items-center gap-1.5">
          <Skeleton className={cn('h-3 w-32 rounded', themeClasses.skeletonBg)} />
          <Skeleton className={cn('h-4 w-48 rounded', themeClasses.skeletonBg)} />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className={cn('h-8 w-20 rounded-lg', themeClasses.skeletonBg)} />
          <Skeleton className={cn('h-8 w-24 rounded-lg', themeClasses.skeletonBg)} />
        </div>
      </div>

      {/* 2. SKELETON CONTENT (NỘI DUNG CHƯƠNG Đang TẢI) */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 md:px-8 pt-24 pb-20 space-y-10">
        {/* Header chương Skeleton */}
        <div className="text-center space-y-4 flex flex-col items-center">
          {/* Badge chương */}
          <Skeleton className={cn('h-6 w-28 rounded-full', themeClasses.skeletonBg)} />

          {/* Tiêu đề chương lớn (2 dòng) */}
          <Skeleton className={cn('h-8 w-3/4 sm:w-2/3 rounded-xl', themeClasses.skeletonBg)} />
          <Skeleton className={cn('h-8 w-1/2 rounded-xl', themeClasses.skeletonBg)} />

          {/* Tên sách & Thời gian đọc */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <Skeleton className={cn('h-4 w-36 rounded', themeClasses.skeletonBg)} />
            <Skeleton className={cn('h-4 w-24 rounded', themeClasses.skeletonBg)} />
          </div>

          {/* Đường kẻ phân cách */}
          <div className="pt-4 flex items-center justify-center gap-3 w-full">
            <Skeleton className={cn('h-px w-24', themeClasses.skeletonBg)} />
            <Skeleton className={cn('h-2 w-2 rounded-full', themeClasses.skeletonBg)} />
            <Skeleton className={cn('h-px w-24', themeClasses.skeletonBg)} />
          </div>
        </div>

        {/* Khung Dẫn nhập (Introduction) Skeleton */}
        <div className="p-5 rounded-r-2xl border-l-4 border-amber-500/40 space-y-2">
          <Skeleton className={cn('h-4 w-full rounded', themeClasses.skeletonBg)} />
          <Skeleton className={cn('h-4 w-5/6 rounded', themeClasses.skeletonBg)} />
        </div>

        {/* Các đoạn văn bản (Paragraphs) Skeleton */}
        <div className="space-y-8">
          {/* Đoạn 1 */}
          <div className="space-y-2.5">
            <Skeleton className={cn('h-4 w-full rounded', themeClasses.skeletonBg)} />
            <Skeleton className={cn('h-4 w-[96%] rounded', themeClasses.skeletonBg)} />
            <Skeleton className={cn('h-4 w-[98%] rounded', themeClasses.skeletonBg)} />
            <Skeleton className={cn('h-4 w-[65%] rounded', themeClasses.skeletonBg)} />
          </div>

          {/* Đoạn 2 */}
          <div className="space-y-2.5">
            <Skeleton className={cn('h-4 w-[98%] rounded', themeClasses.skeletonBg)} />
            <Skeleton className={cn('h-4 w-[94%] rounded', themeClasses.skeletonBg)} />
            <Skeleton className={cn('h-4 w-[88%] rounded', themeClasses.skeletonBg)} />
          </div>

          {/* Đoạn 3 */}
          <div className="space-y-2.5">
            <Skeleton className={cn('h-4 w-full rounded', themeClasses.skeletonBg)} />
            <Skeleton className={cn('h-4 w-[92%] rounded', themeClasses.skeletonBg)} />
            <Skeleton className={cn('h-4 w-[95%] rounded', themeClasses.skeletonBg)} />
            <Skeleton className={cn('h-4 w-[70%] rounded', themeClasses.skeletonBg)} />
          </div>

          {/* Đoạn 4 */}
          <div className="space-y-2.5">
            <Skeleton className={cn('h-4 w-[97%] rounded', themeClasses.skeletonBg)} />
            <Skeleton className={cn('h-4 w-[93%] rounded', themeClasses.skeletonBg)} />
            <Skeleton className={cn('h-4 w-[50%] rounded', themeClasses.skeletonBg)} />
          </div>
        </div>

        {/* Nút hành động chuyển chương Skeleton */}
        <div className="pt-10 flex justify-center">
          <Skeleton className={cn('h-12 w-64 rounded-2xl', themeClasses.skeletonBg)} />
        </div>
      </main>

      {/* 3. SKELETON FOOTER (CỐ ĐỊNH PHÍA DƯỚI) */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-40 h-14 border-t px-4 flex items-center justify-between gap-4 backdrop-blur-md',
          themeClasses.headerBg
        )}
      >
        <Skeleton className={cn('h-8 w-28 rounded-lg', themeClasses.skeletonBg)} />
        <Skeleton className={cn('h-6 w-36 rounded-full', themeClasses.skeletonBg)} />
        <Skeleton className={cn('h-8 w-28 rounded-lg', themeClasses.skeletonBg)} />
      </div>
    </div>
  );
}
