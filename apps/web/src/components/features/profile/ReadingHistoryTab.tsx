'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2, History, RotateCcw, Clock, BookMarked } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ProfileEmptyState } from './ProfileEmptyState';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import type { ReadingHistoryItem } from '@/types/Profile';

/**
 * Interface định nghĩa Props cho component ReadingHistoryTab.
 */
export interface ReadingHistoryTabProps {
  /** Danh sách các cuốn sách đã hoàn thành 100% của độc giả */
  items: ReadingHistoryItem[];
  /** Trang hiện tại của bộ điều khiển phân trang (mặc định là 1) */
  currentPage?: number;
  /** Callback được gọi khi độc giả chuyển đổi trang phân trang */
  onPageChange?: (page: number) => void;
  /** Cờ hiệu trạng thái đang truy vấn dữ liệu từ backend */
  isLoading?: boolean;
}

/** Số lượng item lịch sử đọc tối đa trên một trang */
const ITEMS_PER_PAGE = 6;

/**
 * Component ReadingHistoryTab - Tab hiển thị danh sách các cuốn sách đã đọc hoàn thành.
 *
 * Dùng tại: Trang Hồ sơ cá nhân độc giả (/profile), tab "Lịch sử đã đọc".
 * Tác dụng: Thống kê các thành tựu sách đã đọc xong, hỗ trợ phân trang Client-side
 * và cung cấp nút Đọc lại cho độc giả.
 *
 * @param props - ReadingHistoryTabProps
 */
export function ReadingHistoryTab({
  items,
  currentPage = 1,
  onPageChange,
  isLoading,
}: ReadingHistoryTabProps) {
  // Trả về giao diện empty state khi không tải và không có cuốn sách nào trong lịch sử
  if (!isLoading && items.length === 0) {
    return (
      <ProfileEmptyState
        icon={<History className="h-8 w-8 text-amber-600 dark:text-amber-400" />}
        title="Chưa có sách nào hoàn thành"
        description="Hãy duy trì thói quen đọc sách mỗi ngày để tích lũy kiến thức và hoàn thành những cuốn sách đầu tiên nhé!"
        actionText="Bắt đầu đọc sách"
        actionHref="/books"
      />
    );
  }

  // Tính toán số trang và vị trí cắt mảng cho trang hiện tại
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const displayItems = items.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayItems.map((item) => (
          <Card
            key={item.id}
            className="border-border/60 bg-card/80 hover:bg-card/100 transition-all shadow-sm flex flex-col justify-between p-4"
          >
            <div className="flex gap-3.5">
              {/* Bìa sách hoặc khung biểu tượng hoàn thành khi không có ảnh */}
              <div className="relative h-24 w-16 shrink-0 rounded-md overflow-hidden bg-muted/60 border border-border/50 flex items-center justify-center">
                {item.bookCoverImage ? (
                  <Image src={item.bookCoverImage} alt={item.bookTitle} fill className="object-cover" sizes="64px" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-emerald-500/20 to-primary/20 flex items-center justify-center p-1 text-center">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                )}
              </div>

              {/* Thông tin hoàn thành cuốn sách */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-semibold py-0">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Hoàn thành 100%
                    </Badge>
                  </div>
                  <Link
                    href={`/books/${item.bookSlug}`}
                    className="text-sm font-semibold text-foreground line-clamp-1 hover:text-primary transition-colors"
                  >
                    {item.bookTitle}
                  </Link>
                  <p className="text-xs text-muted-foreground truncate">{item.authorName}</p>
                </div>

                <div className="flex items-center gap-4 text-[11px] text-muted-foreground mt-2">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Hoàn tất: {new Date(item.completedAt).toLocaleDateString('vi-VN')}
                  </span>
                  <span className="flex items-center gap-1">
                    <BookMarked className="h-3 w-3" />
                    {item.totalChaptersRead} chương
                  </span>
                </div>
              </div>
            </div>

            {/* Footer card chứa tổng thời gian đọc và nút Đọc lại */}
            <div className="pt-3 mt-3 border-t border-border/40 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Thời gian đọc: ~{item.totalReadingTimeMinutes || 25} phút
              </span>
              <Link
                href={`/books/${item.bookSlug}/read`}
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'sm' }),
                  'h-7 text-xs gap-1 cursor-pointer'
                )}
              >
                <RotateCcw className="h-3 w-3" />
                <span>Đọc lại</span>
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {/* Điều khiển phân trang khi danh sách có nhiều hơn 1 trang */}
      {totalPages > 1 && onPageChange && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <PaginationItem key={p}>
                <PaginationLink isActive={p === currentPage} onClick={() => onPageChange(p)}>
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
                className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
