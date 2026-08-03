import React from 'react';
import Link from 'next/link';
import { BookOpen, ArrowRight } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Props cho component ProfileEmptyState.
 *
 * @param icon - Element Icon hiển thị ở giữa (mặc định là BookOpen icon)
 * @param title - Tiêu đề thông báo trạng thái rỗng
 * @param description - Đoạn mô tả chi tiết / gợi ý cho người dùng
 * @param actionText - Nhãn của nút hành động CTA (mặc định 'Khám phá kho sách')
 * @param actionHref - Đích đến URL điều hướng (mặc định '/books')
 * @param onAction - Callback thay thế cho actionHref nếu sử dụng handler thay vì Link
 */
export interface ProfileEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
}

/**
 * ProfileEmptyState - Component hiển thị khối trạng thái rỗng kèm nút kêu gọi hành động (CTA).
 *
 * Dùng khi danh sách sách đang đọc, lịch sử hoàn thành, hoặc sách mượn trống.
 *
 * Dùng ở: Các tab nội dung trên trang hồ sơ cá nhân độc giả (/profile).
 */
export function ProfileEmptyState({
  icon,
  title,
  description,
  actionText = 'Khám phá kho sách',
  actionHref = '/books',
  onAction,
}: ProfileEmptyStateProps) {
  return (
    <Card className="border-border/60 bg-card/60 backdrop-blur-sm border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-3.5 border border-amber-500/20">
          {icon || <BookOpen className="h-8 w-8" />}
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1.5">{title}</h3>
        <p className="text-xs text-muted-foreground max-w-md mb-5 leading-relaxed">
          {description}
        </p>
        {actionHref ? (
          <Link
            href={actionHref}
            className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5 cursor-pointer shadow-sm')}
          >
            <span>{actionText}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ) : onAction ? (
          <Button onClick={onAction} size="sm" className="gap-1.5 cursor-pointer shadow-sm">
            <span>{actionText}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
