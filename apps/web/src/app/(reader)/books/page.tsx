import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { searchBooks } from '@/lib/api/books';
import { getSearchFilters } from '@/lib/api/search';
import { BookSearchAndFilters } from '@/components/reader/books/BookSearchAndFilters';
import { BookListContainer } from '@/components/reader/books/BookListContainer';
import { BookPagination } from '@/components/reader/books/BookPagination';

export const metadata: Metadata = {
  title: 'Tìm kiếm sách | Thư viện',
  description: 'Tìm kiếm và khám phá hàng ngàn đầu sách trong thư viện.',
};

type BooksSearchParams = { [key: string]: string | string[] | undefined };

function getStringParam(params: BooksSearchParams, key: string): string {
  const value = params[key];
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Trang tìm kiếm sách (Server Component).
 * Xử lý tham số tìm kiếm từ URL, xác thực giới hạn Limit/Page an toàn.
 * Fetch song song danh sách sách và siêu dữ liệu bộ lọc (thể loại, tình trạng, sắp xếp) từ Backend API.
 * Sử dụng kiến trúc URL-driven state management.
 *
 * @param props - Thuộc tính của trang
 * @param props.searchParams - Tham số tìm kiếm truyền qua URL dạng Promise
 */
export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<BooksSearchParams>;
}) {
  const resolvedParams = await searchParams;

  const keyword = getStringParam(resolvedParams, 'Keyword');
  const categoryId = getStringParam(resolvedParams, 'CategoryId');
  const language = getStringParam(resolvedParams, 'Language');
  const accessType = getStringParam(resolvedParams, 'AccessType');
  const sortBy = getStringParam(resolvedParams, 'SortBy');
  const rawSortOrder = getStringParam(resolvedParams, 'SortOrder');
  const sortOrder = rawSortOrder === 'asc' ? 'asc' : 'desc';

  const rawPage = resolvedParams.Page;
  const page = typeof rawPage === 'string' ? parseInt(rawPage, 10) : 1;
  const validPage = isNaN(page) || page < 1 ? 1 : page;

  const rawLimit = resolvedParams.Limit;
  const limit = typeof rawLimit === 'string' ? parseInt(rawLimit, 10) : 12;
  const validLimit = Math.min(Math.max(isNaN(limit) || limit < 1 ? 12 : limit, 1), 100);

  // Fetch song song kết quả tìm kiếm sách và dữ liệu bộ lọc siêu dữ liệu từ backend
  const [data, filtersData] = await Promise.all([
    searchBooks({
      Keyword: keyword,
      Page: validPage,
      Limit: validLimit,
      CategoryId: categoryId,
      Language: language,
      AccessType: accessType,
      SortBy: sortBy,
      SortOrder: sortBy ? sortOrder : undefined,
    }),
    getSearchFilters(),
  ]);

  const needsPageClamp = validPage > data.totalPages && data.totalPages > 0;

  // Edge Case 1: Người dùng nhập tay Page/Limit không hợp lệ hoặc cố tình nhập số quá lớn (VD: Limit=999999).
  // Hệ thống sẽ tự động ép (clamp) về khoảng an toàn và Redirect giật lại URL chuẩn để đồng bộ UI.
  if (limit !== validLimit || (isNaN(page) ? rawPage !== undefined : page !== validPage) || needsPageClamp) {
    const params = new URLSearchParams();
    if (keyword) params.set('Keyword', keyword);
    if (categoryId) params.set('CategoryId', categoryId);
    if (language) params.set('Language', language);
    if (accessType) params.set('AccessType', accessType);
    const sort = getStringParam(resolvedParams, 'Sort');
    if (sort) params.set('Sort', sort);
    if (sortBy) {
      params.set('SortBy', sortBy);
      params.set('SortOrder', sortOrder);
    }

    const finalPage = needsPageClamp ? data.totalPages : validPage;
    if (finalPage !== 1) params.set('Page', finalPage.toString());
    if (validLimit !== 12) params.set('Limit', validLimit.toString());

    redirect(`/books?${params.toString()}`);
  }

  return (
    <div className="container mx-auto py-8 font-sans">
      <div className="flex flex-col md:flex-row gap-8">
        <BookSearchAndFilters initialKeyword={keyword} filtersData={filtersData} />

        <div className="flex-1 flex flex-col min-h-0">
          <BookListContainer books={data.items} />
          <BookPagination currentPage={data.page} totalPages={data.totalPages} />
        </div>
      </div>
    </div>
  );
}

