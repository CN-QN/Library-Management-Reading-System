'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Loader2 } from 'lucide-react';

/**
 * ProtectedRoute - HOC kiểm tra và bảo vệ các route yêu cầu đăng nhập.
 * 
 * Sẽ hiển thị màn hình loading trong lúc kiểm tra token.
 * Nếu chưa đăng nhập, tự động chuyển hướng về trang `/login`.
 *
 * @param children - Các component con cần được bảo vệ
 */
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
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

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground text-sm">Đang kiểm tra phiên làm việc...</p>
      </div>
    );
  }

  // If authenticated, render children
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Fallback (will redirect anyway)
  return null;
}
