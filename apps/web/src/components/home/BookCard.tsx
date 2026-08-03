import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Book } from '@/types/Book';
import { Badge } from '@/components/ui/badge';

interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
  const detailHref = `/books/${encodeURIComponent(book.slug || book.id)}`;

  return (
    <Link href={detailHref} className="group h-full block">
      <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-md border-muted/60 bg-card hover:-translate-y-1">
        <CardContent className="p-0 flex flex-col h-full">
          <div className="relative aspect-[2/3] w-full bg-muted overflow-hidden">
            {book.coverImage ? (
              <Image
                src={book.coverImage}
                alt={book.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full text-muted-foreground bg-secondary/50">
                <span className="text-sm font-medium">No Cover</span>
              </div>
            )}
            
            {book.status && (
              <div className="absolute top-2 right-2">
                <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-xs font-semibold shadow-sm">
                  {book.status}
                </Badge>
              </div>
            )}
          </div>
          
          <div className="p-4 flex flex-col flex-1 gap-1">
            <h3 className="font-semibold text-base line-clamp-2 leading-tight group-hover:text-primary transition-colors">
              {book.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-auto">
              {book.author}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
