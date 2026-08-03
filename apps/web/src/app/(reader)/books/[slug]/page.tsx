import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, ArrowLeft, Eye, Star, Calendar, Globe, BookMarked, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/shared/StarRating';
import { BookHeroActions } from '@/components/reader/book-detail/BookHeroActions';
import { ChapterList } from '@/components/reader/book-detail/ChapterList';
import { BookRecommendations } from '@/components/reader/book-detail/BookRecommendations';
import { ReviewsSection } from '@/components/reader/book-detail/ReviewsSection';
import { BOOK_DETAIL_COPY } from '@/components/reader/book-detail/BookDetailCopy';
import {
  getBookBySlug,
  getChapters,
  getBookCover,
  getBookContent,
  getReadingProgress,
  getRecommendations,
  BookNotFoundError,
} from '@/lib/api/book-detail';
import type {
  BookDetail,
  ChapterSummary,
  BookFile,
  ReadingProgressDetail,
  BookRecommendation,
} from '@/types/BookDetail';

interface BookDetailPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Tạo Dynamic Metadata cho trang chi tiết sách theo chuẩn Next.js Server Component.
 */
export async function generateMetadata({ params }: BookDetailPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug?.trim();

  if (!slug) {
    return { title: `Sách không tồn tại${BOOK_DETAIL_COPY.pageTitleSuffix}` };
  }

  try {
    const book = await getBookBySlug(slug);
    const cover = await getBookCover(book.id).catch(() => null);

    const title = `${book.title}${BOOK_DETAIL_COPY.pageTitleSuffix}`;
    const description = book.summary || `${book.title} - Tác giả: ${book.authorNames.join(', ') || BOOK_DETAIL_COPY.missingAuthor}`;
    const images = cover?.fileUrl ? [cover.fileUrl] : [];

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images,
      },
    };
  } catch {
    return { title: `Chi tiết sách${BOOK_DETAIL_COPY.pageTitleSuffix}` };
  }
}

/**
 * Server Component Route /books/[slug] - Trang Chi Tiết Sách (Reader Portal).
 *
 * Thực hiện fetch bắt buộc thông tin sách trước. Các phần mở rộng (chương, tiến độ, gợi ý, bìa, file)
 * được tải song song bằng Promise.allSettled để tránh trường hợp một dịch vụ lỗi gây hỏng toàn bộ trang.
 */
export default async function BookDetailPage({ params }: BookDetailPageProps) {
  const resolvedParams = await params;
  const rawSlug = resolvedParams.slug;
  const slug = rawSlug ? decodeURIComponent(rawSlug).trim() : '';

  if (!slug) {
    notFound();
  }

  // 1. Fetch thông tin sách bắt buộc
  let book: BookDetail;
  try {
    book = await getBookBySlug(slug);
  } catch (error) {
    if (error instanceof BookNotFoundError) {
      notFound();
    }
    throw error;
  }

  // 2. Fetch song song các phần phụ bằng Promise.allSettled
  const [chaptersRes, coverRes, contentRes, progressRes, recommendationsRes] =
    await Promise.allSettled([
      getChapters(book.id),
      getBookCover(book.id),
      getBookContent(book.id, 'PDF'),
      getReadingProgress(book.id),
      getRecommendations(6),
    ]);

  const chapters: ChapterSummary[] =
    chaptersRes.status === 'fulfilled' ? chaptersRes.value : [];
  const chaptersError: string | null =
    chaptersRes.status === 'rejected'
      ? (chaptersRes.reason as Error)?.message || 'Không thể tải danh sách chương'
      : null;

  const coverFile: BookFile | null =
    coverRes.status === 'fulfilled' ? coverRes.value : null;

  const contentFile: BookFile | null =
    contentRes.status === 'fulfilled' ? contentRes.value : null;

  const progress: ReadingProgressDetail | null =
    progressRes.status === 'fulfilled' ? progressRes.value : null;
  const progressError: string | null =
    progressRes.status === 'rejected'
      ? (progressRes.reason as Error)?.message || 'Không thể tải tiến độ đọc'
      : null;

  const recommendations: BookRecommendation[] =
    recommendationsRes.status === 'fulfilled' ? recommendationsRes.value : [];

  const firstChapter = chapters.length > 0 ? chapters[0] : null;

  // Xác định URL ảnh bìa (ưu tiên từ API cover -> tiếp theo từ thuộc tính book)
  const displayCoverUrl = coverFile?.fileUrl || null;

  const metaItems: { label: string; icon: React.ReactNode; value: React.ReactNode }[] = [
    { label: 'Đánh giá', icon: <Star className="w-3.5 h-3.5 text-amber-500" />, value: <StarRating rating={book.rating || 0} /> },
    { label: 'Lượt xem', icon: <Eye className="w-3.5 h-3.5 text-blue-500" />, value: book.viewCount.toLocaleString('vi-VN') },
    { label: 'Số chương', icon: <BookMarked className="w-3.5 h-3.5 text-purple-500" />, value: book.totalChapters },
    { label: 'Quyền truy cập', icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />, value: book.accessType },
  ];

  const publishItems: { label: string; value: string | number | null; icon?: React.ReactNode }[] = [
    { label: 'Nhà xuất bản', value: book.publisherName },
    { label: 'Năm xuất bản', value: book.publicationYear, icon: <Calendar className="w-3.5 h-3.5" /> },
    { label: 'Ngôn ngữ', value: book.language, icon: <Globe className="w-3.5 h-3.5" /> },
    { label: 'ISBN', value: book.isbn },
  ];

  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl space-y-10">
      {/* Quay lại danh sách sách */}
      <div>
        <Link
          href="/books"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          {BOOK_DETAIL_COPY.backToBooks}
        </Link>
      </div>

      {/* Hero Section: Bìa sách & Thông tin chi tiết */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Khối Ảnh bìa */}
        <div className="md:col-span-4 lg:col-span-3 flex justify-center">
          <div className="relative w-full max-w-[280px] aspect-[2/3] rounded-lg overflow-hidden border bg-muted shadow-md">
            {displayCoverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayCoverUrl}
                alt={`Bìa sách ${book.title}`}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center w-full h-full text-muted-foreground bg-secondary/40 p-4 text-center">
                <BookOpen className="w-16 h-16 text-muted-foreground/30 mb-2" />
                <span className="text-sm font-medium text-muted-foreground/70">No Cover</span>
              </div>
            )}

            {book.status && (
              <div className="absolute top-3 right-3 z-10">
                <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm text-xs font-semibold shadow-sm">
                  {book.status}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Khối Thông tin tiêu đề & Metadata */}
        <div className="md:col-span-8 lg:col-span-9 space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
              {book.title}
            </h1>

            {/* Tác giả */}
            <p className="text-base sm:text-lg text-muted-foreground">
              Tác giả:{' '}
              <span className="font-semibold text-foreground">
                {book.authorNames.length > 0
                  ? book.authorNames.join(', ')
                  : BOOK_DETAIL_COPY.missingAuthor}
              </span>
            </p>

            {/* Danh sách thể loại */}
            <div className="flex flex-wrap gap-2 pt-1">
              {book.categoryNames.length > 0 ? (
                book.categoryNames.map((cat: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="text-xs font-medium">
                    {cat}
                  </Badge>
                ))
              ) : (
                <Badge variant="outline" className="text-xs font-medium text-muted-foreground">
                  {BOOK_DETAIL_COPY.missingCategory}
                </Badge>
              )}
            </div>
          </div>

          {/* Lưới chỉ số metadata - render từ mảng metaItems */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg border bg-card/60 text-sm">
            {metaItems.map((item) => (
              <div key={item.label} className="space-y-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  {item.icon}
                  {item.label}
                </span>
                {typeof item.value === 'string' || typeof item.value === 'number' ? (
                  <p className="font-semibold">{item.value}</p>
                ) : (
                  <div>{item.value}</div>
                )}
              </div>
            ))}
          </div>

          {/* Các thông tin xuất bản bổ sung - render từ mảng publishItems */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-muted-foreground pt-1">
            {publishItems
              .filter((item) => item.value !== null && item.value !== undefined && item.value !== '')
              .map((item) => (
                <div key={item.label} className="flex items-center gap-1">
                  {item.icon}
                  {item.label}: <span className="font-medium text-foreground">{item.value}</span>
                </div>
              ))}
          </div>

          {/* Khối Tóm tắt nội dung */}
          <div className="space-y-2 pt-2 border-t">
            <h2 className="text-base font-semibold">Tóm tắt nội dung</h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {book.summary || BOOK_DETAIL_COPY.missingSummary}
            </p>
          </div>

          {/* Khối Hành động CTA chính & Tiến độ đọc trong Hero */}
          <BookHeroActions
            book={book}
            firstChapter={firstChapter}
            progress={progress}
          />
        </div>
      </div>

      {/* Phần Danh sách chương trở xuống: Trải rộng toàn bộ container max-w-6xl, căn giữa màn hình */}
      {/* Danh sách chương */}
      <ChapterList
        bookSlug={book.slug}
        chapters={chapters}
        error={chaptersError}
        contentFile={contentFile}
      />

      {/* Gợi ý cho bạn */}
      <BookRecommendations
        recommendations={recommendations}
        currentBookId={book.id}
        currentBookSlug={book.slug}
      />

      {/* Khu vực Đánh giá & Bình luận */}
      <ReviewsSection
        bookId={book.id}
      />
    </main>
  );
}
