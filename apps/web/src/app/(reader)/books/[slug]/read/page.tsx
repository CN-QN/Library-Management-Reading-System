import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { getBookBySlug, getChapters, BookNotFoundError } from '@/lib/api/book-detail';
import { getReadingProgress, getChapterDetail } from '@/lib/api/reading';
import { BookReaderContainer } from '@/components/features/reader';
import type { Chapter } from '@/types/Reading';

/**
 * Interface mô tả tham số URL nhận vào cho trang đọc sách (App Router dynamic route).
 * Trong Next.js 15+, params và searchParams là các Promise.
 */
export interface BookReadPageProps {
  /** Dynamic route parameter chứa slug của sách */
  params: Promise<{ slug: string }>;
  /** Query parameters tùy chọn để điều hướng trực tiếp tới chương hoặc vị trí đọc cụ thể */
  searchParams: Promise<{
    chapterId?: string;
    chapter?: string;
    position?: string;
  }>;
}

/**
 * Tạo Dynamic Metadata cho trang đọc sách dựa trên slug và chương hiện tại.
 *
 * TẠI SAO CẦN DYNAMIC METADATA:
 * - Tối ưu SEO và hiển thị tiêu đề tab trình duyệt chính xác (ví dụ: "Chương 1: Khởi đầu - Tên Sách | Đọc sách").
 * - Giúp độc giả dễ dàng nhận biết chương đang đọc khi lưu Bookmark hoặc chia sẻ liên kết.
 *
 * @param props - Tham số route params và searchParams
 * @returns Metadata object cho Next.js
 */
export async function generateMetadata({
  params,
  searchParams,
}: BookReadPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { chapterId, chapter } = await searchParams;

  try {
    const book = await getBookBySlug(slug);
    const [chapters, progress] = await Promise.all([
      getChapters(book.id).catch(() => []),
      getReadingProgress(book.id).catch(() => null),
    ]);

    // Tìm chương đang active để lấy tiêu đề chương
    let activeChapter = null;
    if (chapterId) {
      activeChapter = chapters.find((c) => c.id === chapterId) || null;
    } else if (chapter) {
      const chapterNum = Number(chapter);
      activeChapter = chapters.find((c) => c.number === chapterNum) || null;
    } else if (progress?.chapterId) {
      activeChapter = chapters.find((c) => c.id === progress.chapterId) || null;
    } else if (chapters.length > 0) {
      activeChapter = chapters[0];
    }

    if (activeChapter) {
      return {
        title: `${activeChapter.title} - ${book.title} | Đọc sách`,
        description: `Đọc ${activeChapter.title} của cuốn sách ${book.title} trực tuyến trên Hệ thống Đọc & Quản lý Thư viện.`,
      };
    }

    return {
      title: `${book.title} | Đọc sách`,
      description: `Đọc sách ${book.title} trực tuyến trên Hệ thống Đọc & Quản lý Thư viện.`,
    };
  } catch {
    return {
      title: 'Đọc sách | Thư viện số',
    };
  }
}

/**
 * Trang Đọc sách (Book Reader Page) - Pure Server Component.
 *
 * TẠI SAO LÀ PURE SERVER COMPONENT:
 * 1. Tuân thủ thiết kế kiến trúc Next.js: Thực hiện toàn bộ việc fetch dữ liệu server-side
 *    (thông tin sách, danh sách chương, tiến độ đọc của user và nội dung chương hiện tại).
 * 2. Tối ưu hiệu năng: Giảm bundle size JavaScript tải về cho Client. Toàn bộ logic tương tác
 *    được đẩy xuống Client Component `BookReaderContainer`.
 * 3. URL-driven State: Xác định chương cần đọc dựa trên query params (`chapterId`, `chapter`)
 *    hoặc tiến độ đọc trước đó của người dùng (`progress.chapterId`).
 *
 * @param props - Tham số route params và searchParams (đều là Promise trong Next.js 15+)
 */
export default async function BookReadPage({ params, searchParams }: BookReadPageProps) {
  const { slug } = await params;
  const { chapterId, chapter } = await searchParams;

  // 1. Fetch thông tin sách theo slug. Bắt lỗi 404 để gọi notFound()
  let book;
  try {
    book = await getBookBySlug(slug);
  } catch (error) {
    if (error instanceof BookNotFoundError) {
      notFound();
    }
    throw error;
  }

  // 2. Fetch danh sách chương và tiến độ đọc của người dùng song song
  const [chapters, progress] = await Promise.all([
    getChapters(book.id),
    getReadingProgress(book.id),
  ]);

  // 3. Xác định chương cần đọc (activeChapter)
  let activeChapter = null;
  if (chapterId) {
    activeChapter = chapters.find((ch) => ch.id === chapterId) || null;
  } else if (chapter) {
    const chapterNum = Number(chapter);
    activeChapter = chapters.find((ch) => ch.number === chapterNum) || null;
  } else if (progress?.chapterId) {
    activeChapter = chapters.find((ch) => ch.id === progress.chapterId) || null;
  } else if (chapters.length > 0) {
    activeChapter = chapters[0];
  }

  // 4. Trường hợp sách chưa có chương nào được xuất bản
  if (!chapters || chapters.length === 0 || !activeChapter) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
              Chưa có nội dung đọc
            </h1>
            <p className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed">
              Cuốn sách <span className="font-semibold text-stone-900 dark:text-stone-200">"{book.title}"</span> hiện chưa có chương nào được xuất bản hoặc phát hành nội dung đọc trực tuyến.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href={`/books/${slug}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm transition-colors shadow-md shadow-amber-600/20"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại chi tiết sách
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 5. Fetch chi tiết nội dung chương hiện tại
  const currentChapterDetail = await getChapterDetail(book.id, activeChapter.id);

  // 6. Map dữ liệu chapters từ ChapterSummary[] sang Chapter[] cho BookReaderContainer
  const mappedChapters: Chapter[] = chapters.map((ch) => ({
    id: ch.id,
    title: ch.title,
    number: ch.number,
    readingTime: ch.readingTime,
    wordCount: ch.wordCount,
  }));

  // 7. Render Client Container Component xử lý trải nghiệm đọc sách
  return (
    <BookReaderContainer
      book={book}
      currentChapter={currentChapterDetail}
      chapters={mappedChapters}
      initialProgress={progress}
    />
  );
}
