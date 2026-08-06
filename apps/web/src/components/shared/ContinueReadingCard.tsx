'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, X } from 'lucide-react';
import { ReadingProgress } from '@/types/ReadingProgress';
import { cn } from '@/lib/utils';
import { deleteReadingProgress } from '@/lib/api/profile';

export interface ContinueReadingCardProps {
  item: ReadingProgress;
  className?: string;
  onDelete?: (bookId: string) => void;
}

/**
 * Component hiển thị thẻ sách "Tiếp tục đọc" kèm theo thanh tiến trình và nút xóa.
 */
export function ContinueReadingCard({ item, className, onDelete }: ContinueReadingCardProps) {
  const [isDeleted, setIsDeleted] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  if (isDeleted) {
    return null;
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDeleting(true);
    setIsDeleted(true); // Optimistic UI: Ẩn card ngay lập tức

    const success = await deleteReadingProgress(item.bookId);
    if (!success) {
      // Revert lại nếu gọi API xóa bị thất bại
      setIsDeleted(false);
      setIsDeleting(false);
    } else {
      if (onDelete) {
        onDelete(item.bookId);
      }
      router.refresh();
    }
  };

  return (
    <div className={cn("group relative h-full", className)}>
      {/* Nút xóa tiến trình đọc */}
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="absolute top-2 right-2 p-1.5 z-20 rounded-full bg-background/80 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow-sm"
        title="Xóa tiến trình đọc"
        aria-label="Xóa tiến trình đọc"
      >
        <X className="h-4 w-4" />
      </button>

      <Link href={`/books/${item.book.slug || item.book.id || item.bookId}/read`} className="block h-full">
        <Card className="overflow-hidden hover:shadow-md transition-all border-muted/60 bg-card hover:-translate-y-1 h-full">
          <CardContent className="p-0 flex items-center h-32">
            {/* Cover */}
            <div className="relative h-full w-24 shrink-0 bg-muted flex items-center justify-center">
              {item.book.coverImage ? (
                <Image
                  src={item.book.coverImage}
                  alt={item.book.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="96px"
                />
              ) : (
                <BookOpen className="w-8 h-8 text-muted-foreground/30" />
              )}
            </div>
            
            {/* Info & Progress */}
            <div className="flex flex-col flex-1 p-4 h-full justify-between overflow-hidden">
              <div>
                <h3 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors" title={item.book.title}>
                  {item.book.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1" title={item.currentChapterTitle}>
                  {item.currentChapterTitle || 'Đang đọc'}
                </p>
              </div>
              
              <div className="mt-auto space-y-2">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-muted-foreground">{item.progressPercentage}% đã đọc</span>
                </div>
                <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary h-full rounded-full transition-all duration-500 ease-in-out" 
                    style={{ width: `${item.progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
