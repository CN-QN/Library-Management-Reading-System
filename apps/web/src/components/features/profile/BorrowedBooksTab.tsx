'use client';

import React from 'react';
import { Library, AlertTriangle, CheckCircle2, Clock, QrCode, Building } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProfileEmptyState } from './ProfileEmptyState';
import type { BorrowedBook, BorrowStatus } from '@/types/Profile';

/**
 * Interface định nghĩa Props cho component BorrowedBooksTab.
 */
export interface BorrowedBooksTabProps {
  /** Danh sách ấn bản sách giấy sinh viên đang mượn từ thư viện */
  borrowed: BorrowedBook[];
  /** Cờ hiệu thể hiện trạng thái đang tải dữ liệu từ backend */
  isLoading?: boolean;
}

/**
 * Component BorrowedBooksTab - Tab hiển thị danh sách các ấn bản sách giấy mượn tại quầy thư viện.
 *
 * Dùng tại: Trang Hồ sơ cá nhân độc giả (/profile), tab "Sách mượn thư viện".
 * Tác dụng: Giúp độc giả theo dõi thông tin phiếu mượn sách giấy, mã vạch, chi nhánh mượn,
 * cùng các cảnh báo về thời hạn trả sách (Sắp đến hạn, Quá hạn trả, Đã hoàn trả).
 *
 * @param props - BorrowedBooksTabProps
 */
export function BorrowedBooksTab({ borrowed, isLoading }: BorrowedBooksTabProps) {
  if (!isLoading && borrowed.length === 0) {
    return (
      <ProfileEmptyState
        icon={<Library className="h-8 w-8 text-amber-600 dark:text-amber-400" />}
        title="Bạn chưa mượn ấn bản sách nào"
        description="Ghé thăm quầy thư viện tại các chi nhánh để mượn đọc những cuốn sách giấy yêu thích nhé!"
        actionText="Xem danh mục sách"
        actionHref="/books"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {borrowed.map((item) => (
        <Card
          key={item.id}
          className="border-border/60 bg-card/80 hover:bg-card/100 transition-all shadow-sm p-4 space-y-3"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-foreground line-clamp-1">
                {item.bookTitle}
              </h4>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <QrCode className="h-3 w-3 text-primary" />
                  {item.barcode}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Building className="h-3 w-3" />
                  {item.branchName || 'Thư viện Trung tâm'}
                </span>
              </div>
            </div>
            <BorrowStatusBadge status={item.status} daysRemaining={item.daysRemaining} />
          </div>

          <div className="pt-2 border-t border-border/40 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground block text-[11px]">Ngày mượn</span>
              <span className="font-medium text-foreground">
                {new Date(item.borrowedAt).toLocaleDateString('vi-VN')}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Hạn trả quy định</span>
              <span className="font-semibold text-foreground">
                {new Date(item.dueAt).toLocaleDateString('vi-VN')}
              </span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

/**
 * Component hiển thị Badge trạng thái mượn sách với màu sắc phân biệt theo quy định thiết kế.
 *
 * @param status - Trạng thái mượn (OVERDUE: Đỏ, DUE_SOON: Amber, RETURNED: Muted, BORROWED: Emerald)
 * @param daysRemaining - Số ngày còn lại tính tới hạn trả sách
 */
function BorrowStatusBadge({ status, daysRemaining }: { status: BorrowStatus; daysRemaining: number }) {
  if (status === 'OVERDUE') {
    return (
      <Badge variant="destructive" className="bg-red-500/10 text-red-600 border-red-500/30 text-xs font-semibold">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Quá hạn ({Math.abs(daysRemaining)} ngày)
      </Badge>
    );
  }
  if (status === 'DUE_SOON') {
    return (
      <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 text-xs font-semibold">
        <Clock className="h-3 w-3 mr-1" />
        Sắp đến hạn (Còn {daysRemaining} ngày)
      </Badge>
    );
  }
  if (status === 'RETURNED') {
    return (
      <Badge variant="secondary" className="bg-muted text-muted-foreground text-xs font-medium">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Đã hoàn trả
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs font-semibold">
      <CheckCircle2 className="h-3 w-3 mr-1" />
      Đang mượn (Còn {daysRemaining} ngày)
    </Badge>
  );
}
