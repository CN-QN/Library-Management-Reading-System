import Link from 'next/link';
import { BookX, ArrowLeft } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { BOOK_DETAIL_COPY } from '@/components/reader/book-detail/BookDetailCopy';

/**
 * Trang thông báo Không Tìm Thấy Sách (404) cho route /books/[slug].
 * Hiển thị khi slug truyền vào không tồn tại trong cơ sở dữ liệu hệ thống.
 */
export default function BookNotFound() {
  return (
    <div className="container mx-auto px-4 py-24 max-w-xl text-center space-y-6">
      <div className="flex justify-center">
        <div className="p-4 rounded-full bg-muted/50 border text-muted-foreground">
          <BookX className="w-16 h-16 text-muted-foreground/60" />
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {BOOK_DETAIL_COPY.notFoundTitle}
        </h1>
        <p className="text-muted-foreground text-base max-w-md mx-auto">
          {BOOK_DETAIL_COPY.notFoundDescription}
        </p>
      </div>

      <div className="pt-4">
        <Link
          href="/books"
          className={buttonVariants({ variant: 'default', size: 'lg' })}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {BOOK_DETAIL_COPY.backToBooks}
        </Link>
      </div>
    </div>
  );
}
