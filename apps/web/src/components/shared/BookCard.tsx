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

  return (
    <Link href={detailHref} className={cn("group h-full block select-none", className)}>
      <Card className="h-full flex flex-col overflow-hidden transition-all duration-300 hover:shadow-md border-muted/60 bg-card hover:-translate-y-1 select-none">
        <CardContent className="p-0 flex flex-col flex-1 h-full">
          {/* Ảnh bìa */}
          <div className="relative aspect-[2/3] w-full bg-muted overflow-hidden flex shrink-0">
            {book.coverImage ? (
              <Image 
                src={book.coverImage} 
                alt={`Bìa sách ${book.title}`} 
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full text-muted-foreground bg-secondary/50">
                <BookOpen className="w-12 h-12 text-muted-foreground/30 mb-2 absolute" />
                <span className="text-sm font-medium z-10">No Cover</span>
              </div>
            )}
            
            {/* Status Badge */}
            {book.status && (
              <div className="absolute top-2 right-2 z-10">
                <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-xs font-semibold shadow-sm px-2 py-0.5">
                  {book.status}
                </Badge>
              </div>
            )}
          </div>
          
          {/* Thông tin */}
          <div className="p-4 flex flex-col flex-1 gap-1">
            <h3 className="font-semibold text-base line-clamp-2 leading-tight group-hover:text-primary transition-colors" title={book.title}>
              {book.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{book.author}</p>
            
            <div className="mt-auto pt-4 flex flex-col gap-3">
              <StarRating rating={book.rating || 0} />
              
              {/* Nút hành động */}
              <div className={cn(
                buttonVariants({ variant: "secondary", size: "sm" }), 
                "w-full h-8 px-3 transition-colors group-hover:bg-primary group-hover:text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground flex items-center justify-center gap-1.5"
              )}>
                <BookOpen className="w-4 h-4" />
                <span className="font-medium">Đọc ngay</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
