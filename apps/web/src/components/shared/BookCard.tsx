import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen } from 'lucide-react';
import { StarRating } from './StarRating';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Book } from '@/types';

export interface BookCardProps {
  book: Book;
  className?: string;
}

/**
 * Component hiển thị thông tin sách dạng thẻ (Card).
 * Sử dụng chung cho toàn bộ dự án.
 */
export function BookCard({ book, className }: BookCardProps) {
  const detailHref = `/books/${encodeURIComponent(book.slug || book.id)}`;
  const isPremium = ['PREMIUM', 'PAID'].includes((book.accessType || 'FREE').toUpperCase());
  const actionHref = isPremium ? detailHref : `${detailHref}/read`;

  return (
    <div className={cn("group h-full block select-none", className)}>
      <Card className="h-full flex flex-col overflow-hidden transition-all duration-300 hover:shadow-md border-muted/60 bg-card hover:-translate-y-1 select-none">
        <CardContent className="p-0 flex flex-col flex-1 h-full">
          {/* Ảnh bìa cao cấp với hiệu ứng Ambient Backdrop Glow */}
          <Link href={detailHref} className="relative aspect-[2/3] w-full bg-slate-100 dark:bg-slate-900/60 overflow-hidden flex shrink-0 group/cover">
            {book.coverImage ? (
              <>
                {/* Lớp nền mờ Ambient Glow */}
                <Image 
                  src={book.coverImage} 
                  alt="" 
                  fill
                  aria-hidden="true"
                  className="object-cover scale-125 blur-xl opacity-40 dark:opacity-30 pointer-events-none"
                />
                {/* Ảnh bìa chính floating drop-shadow */}
                <div className="relative w-full h-full p-2.5 flex items-center justify-center z-10">
                  <Image 
                    src={book.coverImage} 
                    alt={`Bìa sách ${book.title}`} 
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                    className="object-contain p-2 drop-shadow-[0_8px_16px_rgba(0,0,0,0.22)] transition-transform duration-500 group-hover/cover:scale-105"
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center w-full h-full text-muted-foreground bg-gradient-to-br from-amber-500/10 via-primary/5 to-secondary/30 p-4 text-center">
                <BookOpen className="w-10 h-10 text-primary/40 mb-2" />
                <span className="text-xs font-bold text-muted-foreground line-clamp-2">{book.title}</span>
              </div>
            )}
            
            {/* Status Badge */}
            {book.status && (
              <div className="absolute top-2.5 right-2.5 z-20">
                <Badge variant="secondary" className="bg-background/85 backdrop-blur-md text-[11px] font-semibold shadow-sm px-2 py-0.5 border border-border/40">
                  {book.status}
                </Badge>
              </div>
            )}
          </Link>
          
          {/* Thông tin */}
          <div className="p-4 flex flex-col flex-1 gap-1">
            <Link href={detailHref} className="font-semibold text-base line-clamp-2 leading-tight group-hover:text-primary transition-colors" title={book.title}>
              {book.title}
            </Link>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{book.author}</p>
            
            <div className="mt-auto pt-4 flex flex-col gap-3">
              <StarRating rating={book.rating || 0} />
              
              {/* Nút hành động */}
              <Link href={actionHref} className={cn(
                buttonVariants({ variant: "secondary", size: "sm" }), 
                "w-full h-8 px-3 transition-colors group-hover:bg-primary group-hover:text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground flex items-center justify-center gap-1.5"
              )}>
                <BookOpen className="w-4 h-4" />
                <span className="font-medium">{isPremium ? 'Mua để đọc' : 'Đọc ngay'}</span>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
