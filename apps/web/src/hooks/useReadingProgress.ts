'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ReadingProgress, SaveReadingProgressPayload } from '@/types/Reading';
import { saveReadingProgress, saveReadingProgressBeacon } from '@/lib/api/reading';

/**
 * Interface thuộc tính đầu vào cho hook `useReadingProgress`.
 */
export interface UseReadingProgressOptions {
  /** ID cuốn sách đang đọc */
  bookId: string;
  /** ID chương sách đang đọc */
  chapterId: string;
  /** Số thứ tự của chương sách đang đọc */
  chapterNumber: number;
  /** Dữ liệu tiến độ đọc ban đầu (nếu có) khôi phục từ backend hoặc local storage */
  initialProgress?: ReadingProgress | null;
  /** Thời gian debounce tự động lưu tiến độ (mặc định: 3000ms) */
  debounceMs?: number;
  /** Tổng số chương của cuốn sách */
  totalChapters: number;
}

/**
 * Interface kết quả trả về của hook `useReadingProgress`.
 */
export interface UseReadingProgressReturn {
  /** Phần trăm hoàn thành đọc chương/sách hiện tại (0 - 100) */
  scrollPercentage: number;
  /** Vị trí cuộn trang hiện tại theo trục tung vertical (tính bằng pixel) */
  currentPosition: number;
  /** Trạng thái đã hoàn tất khôi phục vị trí cuộn trang hay chưa */
  isRestored: boolean;
  /** Hàm thực thi cuộn trang mượt mà về vị trí chỉ định hoặc vị trí ban đầu */
  restoreScroll: (targetPos?: number) => void;
  /** Hàm chủ động lưu ngay lập tức tiến độ đọc lên server (bỏ qua debounce) */
  saveNow: () => void;
}

/**
 * Hook theo dõi, tính toán phần trăm cuộn trang và tự động lưu tiến độ đọc sách của người dùng.
 *
 * TẠI SAO CẦN HOOK NÀY:
 * 1. Tối ưu trải nghiệm đọc: Giúp độc giả không bị mất dấu vị trí đang đọc khi chuyển trang hoặc tắt trình duyệt.
 * 2. Tối ưu hiệu năng: Sử dụng `requestAnimationFrame` để throttle sự kiện cuộn trang `scroll` (tránh giật lag UI).
 * 3. Tối ưu traffic API: Debounce 3000ms trước khi gửi API lưu tiến độ đọc thông thường.
 * 4. Đảm bảo toàn vẹn dữ liệu: Đăng ký các sự kiện rời trang (`visibilitychange`, `pagehide`, `beforeunload`)
 *    để gọi `saveReadingProgressBeacon` (dùng `fetch` với `keepalive: true`), đảm bảo request vẫn gửi thành công khi tab đóng.
 *
 * @param options - Thông tin cuốn sách, chương sách và tiến độ ban đầu
 * @returns Object chứa vị trí cuộn, phần trăm đọc, hàm restoreScroll và hàm saveNow.
 */
export function useReadingProgress({
  bookId,
  chapterId,
  chapterNumber,
  initialProgress,
  debounceMs = 3000,
  totalChapters = 1,
}: UseReadingProgressOptions): UseReadingProgressReturn {
  // Bỏ qua giá trị initialProgress?.percentage vì nó có thể là bookPercentage,
  // scrollPercentage ở frontend đại diện cho phần trăm hiện tại của CHƯƠNG.
  const [scrollPercentage, setScrollPercentage] = useState<number>(0);
  const [currentPosition, setCurrentPosition] = useState<number>(initialProgress?.scrollPosition ?? 0);
  const [isRestored, setIsRestored] = useState<boolean>(false);

  // Lưu trữ các giá trị mới nhất vào Ref để tránh Stale Closures trong các event listeners và timer
  const latestPosRef = useRef<number>(initialProgress?.scrollPosition ?? 0);
  const latestPercentageRef = useRef<number>(initialProgress?.percentage ?? 0);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cập nhật ref mỗi khi state thay đổi
  useEffect(() => {
    latestPosRef.current = currentPosition;
    latestPercentageRef.current = scrollPercentage;
  }, [currentPosition, scrollPercentage]);

  /**
   * Helper tạo payload tiến độ đọc chuẩn để gửi API.
   */
  const getPayload = useCallback((): SaveReadingProgressPayload => {
    // Tính toán book percentage
    const chapterPercentage = latestPercentageRef.current;
    let bookPercentage = 0;
    if (totalChapters > 0) {
       bookPercentage = ((chapterNumber - 1) / totalChapters) * 100 + (chapterPercentage / 100) * (100 / totalChapters);
    } else {
       bookPercentage = chapterPercentage;
    }

    return {
      bookId,
      chapterId,
      chapterNumber,
      scrollPosition: latestPosRef.current,
      percentage: bookPercentage,
    };
  }, [bookId, chapterId, chapterNumber, totalChapters]);

  /**
   * Hàm lưu tiến độ đọc ngay lập tức (dùng khi người dùng click bấm lưu hoặc rời chương).
   */
  const saveNow = useCallback(() => {
    if (!bookId || !chapterId) return;

    // Xóa timer debounce đang chờ (nếu có) để tránh gọi API trùng lặp
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const payload = getPayload();
    void saveReadingProgress(payload);
  }, [bookId, chapterId, getPayload]);

  /**
   * Lắng nghe sự kiện scroll trên window với kỹ thuật throttling qua requestAnimationFrame.
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
          const scrollHeight = document.documentElement.scrollHeight || 0;
          const clientHeight = document.documentElement.clientHeight || 0;
          const maxScroll = scrollHeight - clientHeight;

          // Tính toán phần trăm cuộn (nếu nội dung ngắn hơn 1 màn hình thì tính là 100%)
          const percentage =
            maxScroll > 0 ? Math.min(100, Math.max(0, Math.round((scrollTop / maxScroll) * 100))) : 100;
          const pos = Math.round(scrollTop);

          setCurrentPosition(pos);
          setScrollPercentage(percentage);

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  /**
   * Thiết lập Debounce 3000ms tự động lưu tiến độ đọc khi vị trí cuộn trang thay đổi.
   */
  useEffect(() => {
    if (!bookId || !chapterId || typeof window === 'undefined') return;

    // Hủy timer cũ nếu có sự thay đổi vị trí mới
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Đặt timer debounce tự động lưu mới
    debounceTimerRef.current = setTimeout(() => {
      const payload = getPayload();
      void saveReadingProgress(payload);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [bookId, chapterId, currentPosition, scrollPercentage, getPayload, debounceMs]);

  /**
   * Đăng ký các sự kiện rời trang / đóng tab (`visibilitychange`, `pagehide`, `beforeunload`).
   * Sử dụng `saveReadingProgressBeacon` để gửi request với `keepalive: true`.
   */
  useEffect(() => {
    if (typeof window === 'undefined' || !bookId || !chapterId) return;

    const handleExit = () => {
      // Chỉ gửi beacon khi trang ở trạng thái ẩn hoặc đang đóng
      if (document.visibilityState === 'hidden' || document.visibilityState === undefined) {
        saveReadingProgressBeacon(getPayload());
      }
    };

    const handleBeforeUnload = () => {
      saveReadingProgressBeacon(getPayload());
    };

    document.addEventListener('visibilitychange', handleExit);
    window.addEventListener('pagehide', handleExit);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleExit);
      window.removeEventListener('pagehide', handleExit);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [bookId, chapterId, getPayload]);

  /**
   * Hàm khôi phục vị trí cuộn trang (Smooth Scrolling).
   * Chờ DOM render xong hoàn toàn (qua requestAnimationFrame) rồi mới gọi scrollTo.
   *
   * @param targetPos - Vị trí pixel tùy chọn cần cuộn tới (nếu không truyền sẽ lấy từ `initialProgress`)
   */
  const restoreScroll = useCallback(
    (targetPos?: number) => {
      if (typeof window === 'undefined') return;

      const pos = targetPos ?? initialProgress?.scrollPosition ?? 0;

      // Nếu vị trí bằng 0, đánh dấu đã restore ngay mà không cần gọi scrollTo
      if (pos <= 0) {
        setIsRestored(true);
        return;
      }

      // Dùng 2 khung hình animation để đảm bảo React & CSS layout đã render xong chiều cao trang
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo({ top: pos, behavior: 'smooth' });
          setIsRestored(true);
        });
      });
    },
    [initialProgress?.scrollPosition]
  );

  return {
    scrollPercentage,
    currentPosition,
    isRestored,
    restoreScroll,
    saveNow,
  };
}
