'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, Clock, Download, RefreshCw, AlertCircle, FileText } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import type { ChapterSummary, BookFile } from '@/types/BookDetail';
import { BOOK_DETAIL_COPY } from './BookDetailCopy';
import { cn } from '@/lib/utils';

export interface ChapterListProps {
  /** Slug của cuốn sách hiện tại */
  bookSlug: string;
  /** Danh sách các chương đã sắp xếp theo thứ tự */
  chapters: ChapterSummary[];
  /** Thông điệp lỗi xảy ra khi lấy danh sách chương (nếu có, dạng chuỗi có thể serialize sang Client) */
  error: string | null;
  /** Tệp nội dung sách (PDF, EPUB) nếu có */
  contentFile: BookFile | null;
}

/**
 * ChapterList - Hiển thị danh sách các chương của cuốn sách và liên kết đọc/tải tệp.
 *
 * Mọi liên kết đọc chương đều tuân thủ hợp đồng URL của Issue #44:
 * `/books/{slug}/read?chapter={chapterNumber}&position=0`
 */
export function ChapterList({ bookSlug, chapters, error, contentFile }: ChapterListProps) {
  const router = useRouter();

  return (
    <section className="space-y-6 pt-6 border-t" aria-labelledby="chapters-heading">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 id="chapters-heading" className="text-xl font-bold tracking-tight">
            {BOOK_DETAIL_COPY.chaptersHeading}
          </h2>
          {chapters.length > 0 && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {chapters.length} {BOOK_DETAIL_COPY.chaptersCountLabel}
            </p>
          )}
        </div>

        {/* Nút tải tệp sách (PDF/EPUB) nếu có */}
        {contentFile?.fileUrl ? (
          <a
            href={contentFile.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            download={contentFile.fileName}
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            <Download className="w-4 h-4 mr-2" />
            {BOOK_DETAIL_COPY.downloadFile}
          </a>
        ) : (
          <span className="text-xs text-muted-foreground flex items-center gap-1.5 px-3 py-1.5 rounded-md border bg-muted/30">
            <FileText className="w-3.5 h-3.5" />
            {BOOK_DETAIL_COPY.downloadUnavailable}
          </span>
        )}
      </div>

      {/* Trường hợp xảy ra lỗi khi tải chương */}
      {error ? (
        <div className="p-6 rounded-lg border border-destructive/20 bg-destructive/5 space-y-4 text-center">
          <div className="flex justify-center text-destructive">
            <AlertCircle className="w-8 h-8" />
          </div>
          <p className="text-sm font-medium text-destructive">
            {error || BOOK_DETAIL_COPY.chaptersError}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.refresh()}
            className="mx-auto"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-2" />
            {BOOK_DETAIL_COPY.retryButton}
          </Button>
        </div>
      ) : chapters.length === 0 ? (
        /* Trường hợp sách chưa có chương */
        <div className="p-8 rounded-lg border border-dashed text-center bg-muted/20 space-y-2">
          <BookOpen className="w-10 h-10 text-muted-foreground/40 mx-auto" />
          <p className="text-sm font-medium text-muted-foreground">
            {BOOK_DETAIL_COPY.noChaptersAvailable}
          </p>
        </div>
      ) : (
        /* Hiển thị danh sách chương */
        <div className="grid gap-3">
          {chapters.map((chapter) => {
            // Xây dựng URL đọc chương theo đúng hợp đồng Issue #44
            const readChapterHref = `/books/${encodeURIComponent(
              bookSlug
            )}/read?chapter=${chapter.number}&position=0`;

            return (
              <div
                key={chapter.id || chapter.number}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/40 transition-colors gap-3"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary shrink-0">
                      {BOOK_DETAIL_COPY.chapterLabel} {chapter.number}
                    </span>
                    <h3 className="font-semibold text-base line-clamp-1">{chapter.title}</h3>
                  </div>
                  {chapter.summary && (
                    <p className="text-xs text-muted-foreground line-clamp-2 pl-0.5">
                      {chapter.summary}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                    {chapter.readingTime > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {chapter.readingTime} {BOOK_DETAIL_COPY.readingTimeLabel}
                      </span>
                    )}
                    {chapter.wordCount > 0 && (
                      <span>
                        {chapter.wordCount.toLocaleString('vi-VN')} {BOOK_DETAIL_COPY.wordCountLabel}
                      </span>
                    )}
                  </div>
                </div>

                <Link
                  href={readChapterHref}
                  className={cn(
                    buttonVariants({ variant: 'secondary', size: 'sm' }),
                    'shrink-0 self-start sm:self-center'
                  )}
                >
                  <BookOpen className="w-4 h-4 mr-1.5" />
                  {BOOK_DETAIL_COPY.startReading}
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
