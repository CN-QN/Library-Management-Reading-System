'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ReaderSettings, ReaderTheme, ReaderFontSize } from '@/types/Reading';

/**
 * Key lưu trữ cấu hình đọc sách cá nhân trong localStorage của trình duyệt.
 */
const STORAGE_KEY = 'reader_settings_config';

/**
 * Giá trị cấu hình giao diện đọc sách mặc định.
 * - theme: 'light' (giao diện nền sáng chuẩn)
 * - fontSize: 'base' (cỡ chữ tiêu chuẩn 16px)
 * - lineHeight: 'relaxed' (khoảng cách dòng thoáng 1.625 để tối ưu trải nghiệm đọc văn bản dài)
 */
const DEFAULT_SETTINGS: ReaderSettings = {
  theme: 'light',
  fontSize: 'base',
  lineHeight: 'relaxed',
};

/**
 * Interface định dạng kết quả trả về của hook `useReaderSettings`.
 */
export interface UseReaderSettingsReturn {
  /** Cấu hình giao diện đọc sách hiện tại của người dùng */
  settings: ReaderSettings;
  /**
   * Cờ đánh dấu đã tải xong cấu hình từ localStorage hay chưa.
   * Dùng để tránh hiện tượng nhấp nháy giao diện (FOUC) hoặc sai lệch giữa Server & Client (Hydration mismatch).
   */
  isLoaded: boolean;
  /** Thay đổi chủ đề màu nền đọc sách (sáng, sepia, tối) */
  setTheme: (theme: ReaderTheme) => void;
  /** Thay đổi kích thước chữ hiển thị nội dung */
  setFontSize: (fontSize: ReaderFontSize) => void;
  /** Thay đổi khoảng cách giữa các dòng văn bản */
  setLineHeight: (lineHeight: 'normal' | 'relaxed' | 'loose') => void;
  /** Đặt lại toàn bộ cấu hình về mặc định ban đầu */
  resetSettings: () => void;
}

/**
 * Hook quản lý và đồng bộ cấu hình giao diện đọc sách của độc giả với localStorage.
 *
 * TẠI SAO CẦN HOOK NÀY:
 * - Cho phép người đọc tự do tùy chỉnh giao diện (màu nền, cỡ chữ, khoảng cách dòng) theo sở thích cá nhân.
 * - Tự động ghi nhớ và khôi phục cài đặt qua các phiên đọc sách khác nhau thông qua localStorage.
 * - Đảm bảo an toàn khi chạy SSR (Server-Side Rendering) bằng cách khởi tạo mặc định phía Server
 *   và chỉ nạp từ localStorage sau khi component mount phía Client.
 *
 * @returns Object chứa thông tin cấu hình `settings`, trạng thái `isLoaded` và các hàm cập nhật.
 */
export function useReaderSettings(): UseReaderSettingsReturn {
  // Khởi tạo state với giá trị mặc định để đồng bộ giữa Server và Client lần render đầu tiên
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Đọc cấu hình từ localStorage sau khi component đã mount phía Client (tránh lỗi Hydration mismatch)
  useEffect(() => {
    // Kiểm tra an toàn môi trường trình duyệt trước khi truy cập localStorage
    if (typeof window === 'undefined') return;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ReaderSettings>;
        // Validate dữ liệu từ localStorage để tránh crash nếu dữ liệu bị hỏng
        setSettings({
          theme: parsed.theme || DEFAULT_SETTINGS.theme,
          fontSize: parsed.fontSize || DEFAULT_SETTINGS.fontSize,
          lineHeight: parsed.lineHeight || DEFAULT_SETTINGS.lineHeight,
        });
      }
    } catch {
      // Nếu có lỗi parse JSON hoặc người dùng chặn localStorage (Private Mode),
      // giữ nguyên giá trị mặc định đã khởi tạo
    } finally {
      setIsLoaded(true);
    }
  }, []);

  /**
   * Helper đồng bộ cấu hình mới vào state và ghi đè vào localStorage.
   * Dùng try-catch để nuốt lỗi nếu trình duyệt cấm lưu storage.
   */
  const saveSettings = useCallback((newSettings: ReaderSettings) => {
    setSettings(newSettings);
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch {
      // Bỏ qua lỗi ghi localStorage nếu bộ nhớ đầy hoặc bị trình duyệt chặn
    }
  }, []);

  /**
   * Cập nhật màu nền giao diện đọc sách.
   * @param theme - Chủ đề mới ('light' | 'sepia' | 'dark')
   */
  const setTheme = useCallback(
    (theme: ReaderTheme) => {
      saveSettings({ ...settings, theme });
    },
    [settings, saveSettings]
  );

  /**
   * Cập nhật cỡ chữ đọc sách.
   * @param fontSize - Cỡ chữ mới ('sm' | 'base' | 'lg' | 'xl' | '2xl')
   */
  const setFontSize = useCallback(
    (fontSize: ReaderFontSize) => {
      saveSettings({ ...settings, fontSize });
    },
    [settings, saveSettings]
  );

  /**
   * Cập nhật chiều cao dòng / khoảng cách giữa các câu.
   * @param lineHeight - Khoảng cách mới ('normal' | 'relaxed' | 'loose')
   */
  const setLineHeight = useCallback(
    (lineHeight: 'normal' | 'relaxed' | 'loose') => {
      saveSettings({ ...settings, lineHeight });
    },
    [settings, saveSettings]
  );

  /**
   * Khôi phục toàn bộ cài đặt đọc sách về mặc định ban đầu.
   */
  const resetSettings = useCallback(() => {
    saveSettings(DEFAULT_SETTINGS);
  }, [saveSettings]);

  return {
    settings,
    isLoaded,
    setTheme,
    setFontSize,
    setLineHeight,
    resetSettings,
  };
}
