'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BOOK_DETAIL_COPY } from '@/components/reader/book-detail/BookDetailCopy';

interface BookDetailErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Client Error Boundary cho trang chi tiết sách /books/[slug].
 * Bắt các ngoại lệ cấp trang và cho phép người dùng khôi phục bằng nút reset.
 */
export default function BookDetailError({ error, reset }: BookDetailErrorProps) {
  useEffect(() => {
    // Ghi nhận thông tin lỗi ra console để hỗ trợ debug ở môi trường dev
    console.error('Lỗi xảy ra tại trang chi tiết sách:', error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-20 max-w-lg text-center space-y-6">
      <div className="flex justify-center">
        <div className="p-4 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
          <AlertCircle className="w-12 h-12" />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold sm:text-2xl">{BOOK_DETAIL_COPY.errorTitle}</h2>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          {error.message || BOOK_DETAIL_COPY.errorDescription}
        </p>
      </div>

      <div className="pt-2 flex justify-center gap-4">
        <Button onClick={() => reset()} variant="default" size="default">
          <RefreshCw className="w-4 h-4 mr-2" />
          {BOOK_DETAIL_COPY.retryButton}
        </Button>
      </div>
    </div>
  );
}
