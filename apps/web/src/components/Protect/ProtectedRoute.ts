'use client';

import { createElement, Fragment, ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

/**
 * ProtectedRoute - HOC kiểm tra và bảo vệ các route yêu cầu đăng nhập.
 *
 * Sẽ hiển thị màn hình loading trong lúc kiểm tra token.
 * Nếu chưa đăng nhập, tự động chuyển hướng về trang `/login`.
 *
 * @param children - Các component con cần được bảo vệ
 */
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Chỉ thực hiện chuyển hướng khi store đã load xong trạng thái auth (tránh chớp nhoáng).
    // Phụ thuộc vào isLoading và isAuthenticated để phản ứng ngay khi trạng thái đổi.
    if (!isLoading && !isAuthenticated) {
      // Đính kèm returnUrl để sau khi đăng nhập xong user được trả về đúng trang đang định vào.
      router.push(`/login?returnUrl=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  if (isLoading) {
    return createElement(LoadingSpinner, {
      size: 32,
      className: 'min-h-[60vh]',
      text: 'Đang kiểm tra phiên làm việc...',
    });
  }

  if (isAuthenticated) {
    return createElement(Fragment, null, children);
  }

  return null;
}
