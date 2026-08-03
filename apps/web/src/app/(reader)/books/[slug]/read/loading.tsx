import React from 'react';
import { ReaderSkeleton } from '@/components/features/reader';

/**
 * Loading component hiển thị giao diện Skeleton trong khi chờ server-side data fetching cho trang Đọc sách.
 *
 * TẠI SAO CẦN COMPONENT NÀY:
 * - Đảm bảo trải nghiệm chuyển trang mượt mà (Instant Loading States) theo chuẩn Next.js App Router.
 * - Tránh hiện tượng màn hình trắng (Flash of Unstyled Content) trong lúc server đang tải thông tin sách và chương.
 */
export default function BookReadLoading() {
  return <ReaderSkeleton />;
}
