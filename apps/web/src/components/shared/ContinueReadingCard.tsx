'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { BookOpen, Clock, ArrowRight, BookMarked, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { deleteReadingProgress } from '@/lib/api/profile';
import type { InProgressBook } from '@/types/Profile';

export interface ContinueReadingCardProps {
  item: InProgressBook;
  className?: string;
  onDeleteProgress?: (bookId: string) => void;
}

/**
 * Component hiển thị thẻ sách "Tiếp tục đọc" dùng chung cho Trang chủ và trang Hồ sơ độc giả (/profile).
 */
export function ContinueReadingCard({ item, className, onDeleteProgress }: ContinueReadingCardProps) {
  const [isDeleted, setIsDeleted] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  if (isDeleted) {
    return null;
  }

  // Xây dựng đường dẫn URL đọc sách kèm query parameters chapterId và scrollPosition
  const queryParams = [
    item.chapterId ? `chapterId=${encodeURIComponent(item.chapterId)}` : '',
    item.scrollPosition > 0 ? `position=${item.scrollPosition}` : '',
  ].filter(Boolean).join('&');
  const readLink = `/books/${item.bookSlug}/read${queryParams ? `?${queryParams}` : ''}`;

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDeleting(true);
    setIsDeleted(true); // Optimistic UI: Ẩn card ngay lập tức

    if (onDeleteProgress) {
      onDeleteProgress(item.bookId);
    }

    const success = await deleteReadingProgress(item.bookId);
    if (!success) {
      // Revert lại nếu gọi API xóa bị thất bại
      setIsDeleted(false);
      setIsDeleting(false);
    } else {
      router.refresh();
    }
  };

  return (
    <Card
      className={cn(
        'group relative border-border/60 bg-card/80 hover:bg-card/100 transition-all shadow-sm hover:shadow-md overflow-hidden flex flex-col justify-between',
        className
      )}
    >
      {/* Nút xóa tiến trình đọc */}
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="absolute top-2 right-2 p-1.5 z-10 rounded-full bg-background/80 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
        title="Xóa tiến trình đọc"
        aria-label="Xóa tiến trình đọc"
      >
        <X className="h-4 w-4" />
      </button>

      <CardContent className="p-4 flex flex-col justify-between h-full space-y-4">
        <div className="flex gap-3.5">
          {/* Bìa sách có ảnh hoặc fallback giao diện Warm Sepia */}
          <div className="relative h-28 w-20 shrink-0 rounded-md overflow-hidden bg-muted/60 border border-border/50 shadow-inner flex items-center justify-center">
            {item.bookCoverImage ? (
              <Image
                src={item.bookCoverImage}
                alt={item.bookTitle}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="80px"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-amber-500/20 to-primary/20 flex flex-col items-center justify-center p-1 text-center">
                <BookOpen className="h-6 w-6 text-primary/60 mb-1" />
                <span className="text-[10px] font-bold text-primary/80 line-clamp-2 leading-tight">
                  {item.bookTitle}
                </span>
              </div>
            )}
          </div>

          {/* Thông tin chi tiết cuốn sách */}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <Link
                href={`/books/${item.bookSlug}`}
                className="text-sm font-semibold text-foreground line-clamp-2 hover:text-primary transition-colors leading-snug"
              >
                {item.bookTitle}
              </Link>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {item.authorName || 'Nhiều tác giả'}
              </p>
            </div>

            <div className="space-y-1 mt-2">
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <BookMarked className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="truncate font-medium text-foreground/90">
                  {item.chapterTitle || `Chương ${item.chapterNumber || 1}`}
                </span>
              </div>

              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3 shrink-0" />
                <span>Đọc gần nhất: {formatRelativeTime(item.lastReadAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Thanh tiến độ phần trăm hoàn thành */}
        <div className="space-y-1.5 pt-1 border-t border-border/40">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Tiến độ hoàn thành</span>
            <span className="font-bold text-primary">{item.percentage}%</span>
          </div>
          <Progress value={item.percentage} className="h-1.5 bg-muted" />
        </div>

        {/* Nút thao tác chuyển trực tiếp đến trang đọc */}
        <Link
          href={readLink}
          className={cn(
            buttonVariants({ size: 'sm' }),
            'w-full gap-1.5 cursor-pointer shadow-sm'
          )}
        >
          <BookOpen className="h-4 w-4" />
          <span>Tiếp tục đọc</span>
          <ArrowRight className="h-3.5 w-3.5 ml-auto" />
        </Link>
      </CardContent>
    </Card>
  );
}

/**
 * Định dạng thời gian tương đối theo tiếng Việt từ chuỗi thời gian ISO 8601.
 */
function formatRelativeTime(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Vừa xong';
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} ngày trước`;
    return new Date(isoString).toLocaleDateString('vi-VN');
  } catch {
    return 'Gần đây';
  }
}
