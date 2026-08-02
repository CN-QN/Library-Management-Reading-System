import React, { Suspense } from 'react';
import { ErrorBoundary } from '@/components/ui/error-boundary';

interface AsyncSectionProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

/**
 * AsyncSection - Wrapper component kết hợp ErrorBoundary và Suspense.
 * 
 * Mục đích: Quản lý độc lập trạng thái tải (loading) và lỗi (error) 
 * cho từng phân vùng dữ liệu bất đồng bộ (vd: danh sách sách, tiến độ đọc).
 * Ngăn việc lỗi của một mục làm sập cả trang (chống lỗi dây chuyền).
 *
 * @param children - Các Server Component thực hiện fetch dữ liệu (có thể throw Promise hoặc Error)
 * @param fallback - Giao diện khung xương (Skeleton) hiển thị trong thời gian chờ dữ liệu
 */
export function AsyncSection({ children, fallback }: AsyncSectionProps) {
  return (
    <ErrorBoundary>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}
