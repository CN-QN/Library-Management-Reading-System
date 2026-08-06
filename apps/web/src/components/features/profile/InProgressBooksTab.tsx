'use client';

import React from 'react';
import { BookOpen } from 'lucide-react';
import { ProfileEmptyState } from './ProfileEmptyState';
import { ContinueReadingCard } from '@/components/shared/ContinueReadingCard';
import type { InProgressBook } from '@/types/Profile';

/**
 * Interface định nghĩa các props đầu vào cho component InProgressBooksTab.
 */
export interface InProgressBooksTabProps {
  /** Danh sách các cuốn sách người dùng đang đọc dở */
  books: InProgressBook[];
  /** Cờ hiệu thể hiện trạng thái đang truy vấn dữ liệu từ API */
  isLoading?: boolean;
  /** Callback được gọi khi người dùng muốn xóa tiến trình đọc */
  onDeleteProgress?: (bookId: string) => void;
}

/**
 * Component InProgressBooksTab - Tab hiển thị danh sách các cuốn sách đang đọc dở.
 *
 * Dùng ở: Trang Hồ sơ cá nhân độc giả (/profile), tab "Sách đang đọc".
 * Tác dụng: Hiển thị thanh tiến độ %, chương gần nhất và nút "Tiếp tục đọc"
 * để chuyển trực tiếp đến trang đọc sách đúng vị trí cuộn trước đó.
 *
 * @param props - InProgressBooksTabProps
 */
export function InProgressBooksTab({ books, isLoading, onDeleteProgress }: InProgressBooksTabProps) {
  // Hiển thị trạng thái trống khi không ở trạng thái loading và không có sách nào đang đọc
  if (!isLoading && books.length === 0) {
    return (
      <ProfileEmptyState
        icon={<BookOpen className="h-8 w-8 text-amber-600 dark:text-amber-400" />}
        title="Chưa có sách nào đang đọc"
        description="Khám phá ngay kho sách phong phú và bắt đầu trải nghiệm đọc sách số tuyệt vời ngay hôm nay!"
        actionText="Khám phá kho sách"
        actionHref="/books"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {books.map((book) => (
        <ContinueReadingCard
          key={book.bookId}
          item={book}
          onDeleteProgress={onDeleteProgress}
        />
      ))}
    </div>
  );
}
