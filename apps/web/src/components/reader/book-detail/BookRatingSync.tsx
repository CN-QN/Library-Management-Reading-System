'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

/**
 * Context chia sẻ trạng thái rating realtime giữa hero metadata và ReviewsSection.
 *
 * Lý do: page.tsx là Server Component nên không thể giữ state.
 * Context này cho phép ReviewsSection thông báo thay đổi rating lên hero section
 * mà không cần prop drilling qua Server Component.
 */

interface BookRatingContextValue {
  /** Điểm rating hiện tại (cập nhật realtime) */
  liveRating: number;
  /** Callback để ReviewsSection gọi khi stats thay đổi */
  handleStatsChange: (averageRating: number, totalReviews: number) => void;
}

const BookRatingContext = createContext<BookRatingContextValue | null>(null);

interface BookRatingProviderProps {
  /** Điểm rating ban đầu từ server */
  initialRating: number;
  children: React.ReactNode;
}

/**
 * Provider bọc quanh các component cần chia sẻ trạng thái rating.
 * Đặt trong page.tsx bọc quanh hero section và ReviewsSection.
 */
export function BookRatingProvider({ initialRating, children }: BookRatingProviderProps) {
  const [liveRating, setLiveRating] = useState(initialRating);

  const handleStatsChange = useCallback((averageRating: number) => {
    setLiveRating(averageRating);
  }, []);

  const value = useMemo(
    () => ({ liveRating, handleStatsChange }),
    [liveRating, handleStatsChange]
  );

  return (
    <BookRatingContext.Provider value={value}>
      {children}
    </BookRatingContext.Provider>
  );
}

/**
 * Hook lấy rating realtime từ BookRatingContext.
 * Dùng trong component hiển thị rating ở hero section.
 */
export function useBookRating() {
  const context = useContext(BookRatingContext);
  if (!context) {
    throw new Error('useBookRating phải được dùng bên trong BookRatingProvider');
  }
  return context;
}
