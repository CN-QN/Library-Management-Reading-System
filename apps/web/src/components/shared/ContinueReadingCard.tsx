import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import { ReadingProgress } from '@/types/ReadingProgress';
import { cn } from '@/lib/utils';

export interface ContinueReadingCardProps {
  item: ReadingProgress;
  className?: string;
}

/**
 * Component hiển thị thẻ sách "Tiếp tục đọc" kèm theo thanh tiến trình.
 */
export function ContinueReadingCard({ item, className }: ContinueReadingCardProps) {
  return (
    <Link href={`/books/${item.book.slug || item.book.id || item.bookId}/read`} className={cn("group block h-full", className)}>
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
  );
}
