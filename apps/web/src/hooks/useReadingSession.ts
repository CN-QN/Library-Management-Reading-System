'use client';

import { useState, useEffect } from 'react';
import { startReadingSession, sendReadingSessionHeartbeat, endReadingSession } from '@/lib/api/reading';

/**
 * Interface các tham số tùy chọn đầu vào cho hook `useReadingSession`.
 */
export interface UseReadingSessionOptions {
  /** ID cuốn sách đang đọc */
  bookId: string;
  /** ID chương sách đang đọc */
  chapterId: string;
  /**
   * Cờ bật/tắt việc theo dõi phiên đọc (mặc định: `true`).
   * Truyền `false` nếu muốn tạm dừng theo dõi phiên (ví dụ: khi mở modal xem nhanh hoặc xem trước).
   */
  enabled?: boolean;
}

/**
 * Interface kết quả trả về từ hook `useReadingSession`.
 */
export interface UseReadingSessionReturn {
  /** ID duy nhất của phiên đọc sách đang hoạt động (nhận từ Backend API) hoặc `null` nếu chưa theo dõi */
  sessionId: string | null;
  /** Trạng thái cờ cho biết hệ thống có đang theo dõi phiên đọc hay không */
  isTracking: boolean;
}

/**
 * Hook quản lý vòng đời của một phiên đọc sách (Reading Session).
 *
 * TẠI SAO CẦN HOOK NÀY:
 * 1. Đo lường chính xác thời gian đọc thực tế: Tự động khởi tạo phiên khi độc giả bắt đầu đọc chương sách (`startReadingSession`).
 * 2. Giữ kết nối & thời gian thực: Định kỳ 30 giây gửi nhịp tim (`sendReadingSessionHeartbeat`) nếu tab trình duyệt đang hiển thị (`document.visibilityState === 'visible'`).
 * 3. Tự động dọn dẹp (Cleanup): Khi độc giả chuyển chương sách hoặc rời trang, dừng interval và gửi thông báo kết thúc phiên (`endReadingSession`).
 * 4. Xử lý race conditions: Ngăn ngừa tạo ra các phiên rác khi người dùng nhanh tay chuyển liên tục giữa các chương.
 *
 * @param options - Nhận `bookId`, `chapterId` và cờ kích hoạt `enabled`
 * @returns Object chứa `sessionId` và trạng thái `isTracking`.
 */
export function useReadingSession({
  bookId,
  chapterId,
  enabled = true,
}: UseReadingSessionOptions): UseReadingSessionReturn {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState<boolean>(false);

  useEffect(() => {
    // Không khởi tạo phiên nếu thiếu thông tin, tắt tracking, hoặc đang chạy ở môi trường Server (SSR)
    if (!enabled || !bookId || !chapterId || typeof window === 'undefined') {
      setSessionId(null);
      setIsTracking(false);
      return;
    }

    let activeSessionId: string | null = null;
    let intervalId: NodeJS.Timeout | null = null;
    let isCancelled = false;

    /**
     * Khởi tạo phiên đọc mới và thiết lập interval heartbeat.
     */
    const initSession = async () => {
      try {
        const sid = await startReadingSession(bookId, chapterId);

        // Nếu component đã bị unmount hoặc đổi chapter trước khi API trả về result,
        // lập tức gửi endReadingSession để hủy phiên mồ côi vừa tạo.
        if (isCancelled) {
          if (sid) {
            void endReadingSession(sid);
          }
          return;
        }

        if (sid) {
          activeSessionId = sid;
          setSessionId(sid);
          setIsTracking(true);

          // Định kỳ 30 giây gửi heartbeat duy trì phiên đọc
          intervalId = setInterval(() => {
            if (document.visibilityState === 'visible' && activeSessionId) {
              void sendReadingSessionHeartbeat(activeSessionId);
            }
          }, 30000);
        } else {
          setSessionId(null);
          setIsTracking(false);
        }
      } catch {
        if (!isCancelled) {
          setSessionId(null);
          setIsTracking(false);
        }
      }
    };

    void initSession();

    // Cleanup function: Gọi khi unmount hoặc khi bookId / chapterId / enabled thay đổi
    return () => {
      isCancelled = true;

      // Xóa interval heartbeat
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }

      // Kết thúc phiên đọc đang mở
      if (activeSessionId) {
        const sessionToEnd = activeSessionId;
        activeSessionId = null;
        setSessionId(null);
        setIsTracking(false);
        void endReadingSession(sessionToEnd);
      }
    };
  }, [bookId, chapterId, enabled]);

  return {
    sessionId,
    isTracking,
  };
}
