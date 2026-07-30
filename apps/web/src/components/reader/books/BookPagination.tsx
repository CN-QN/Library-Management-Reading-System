'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Pagination } from '@/components/shared/Pagination';

interface BookPaginationProps {
  currentPage: number;
  totalPages: number;
}

/**
 * BookPagination - Client wrapper hỗ trợ phân trang cho trang tìm kiếm sách.
 * 
 * Lắng nghe sự kiện click chuyển trang và đẩy state lên URL (tham số `Page`) 
 * thông qua `useRouter`, giúp tính năng phân trang có thể chia sẻ được link (URL-driven).
 * 
 * @param currentPage - Trang hiện tại đang đứng
 * @param totalPages - Tổng số trang
 */
export function BookPagination({ currentPage, totalPages }: BookPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('Page', page.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={handlePageChange}
      className="mt-8 mb-4"
    />
  );
}
