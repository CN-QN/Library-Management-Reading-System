import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen } from 'lucide-react';
import { StarRating } from './StarRating';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface BookCardProps {
  id: string;
  title: string;
  author: string;
  coverImage?: string;
  rating?: number;
  className?: string;
}

export function BookCard({ id, title, author, coverImage, rating = 0, className }: BookCardProps) {
  return (
    <div className={cn("group rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md overflow-hidden flex flex-col", className)}>
      <Link href={`/books/${id}`} className="block relative aspect-[2/3] w-full overflow-hidden bg-muted flex items-center justify-center">
        {coverImage ? (
          <Image 
            src={coverImage} 
            alt={`Bìa sách ${title}`} 
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <BookOpen className="w-12 h-12 text-muted-foreground/30" />
        )}
      </Link>
      <div className="p-4 flex flex-col flex-1 gap-2">
        <div>
          <Link href={`/books/${id}`} className="hover:underline line-clamp-1 font-semibold" title={title}>
            {title}
          </Link>
          <p className="text-sm text-muted-foreground line-clamp-1">{author}</p>
        </div>
        
        <div className="mt-auto pt-2 flex items-center justify-between">
          <StarRating rating={rating} />
          <Link href={`/books/${id}`} className={buttonVariants({ variant: "secondary", size: "sm", className: "h-8 text-xs px-3" })}>
            Chi tiết
          </Link>
        </div>
      </div>
    </div>
  );
}
