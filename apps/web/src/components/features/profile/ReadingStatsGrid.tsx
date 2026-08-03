import React from 'react';
import { BookOpen, CheckCircle2, BookMarked, Library } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { ReadingStats } from '@/types/Profile';

/**
 * Props cho component ReadingStatsGrid.
 *
 * @param stats - Dữ liệu thống kê chỉ số đọc sách và mượn sách của độc giả
 * @param isLoading - Trạng thái đang tải dữ liệu (hiển thị '...' khi true)
 */
export interface ReadingStatsGridProps {
  stats: ReadingStats;
  isLoading?: boolean;
}

/**
 * ReadingStatsGrid - Component hiển thị lưới Bento thống kê 4 chỉ số đọc sách và mượn sách.
 *
 * Bao gồm 4 thẻ chỉ số: Sách đã hoàn thành, Sách đang đọc dở, Chương sách đã đọc, và Sách mượn thư viện.
 *
 * Dùng ở: Trang hồ sơ cá nhân độc giả (/profile).
 */
export function ReadingStatsGrid({ stats, isLoading }: ReadingStatsGridProps) {
  const statCards = [
    {
      title: 'Sách đã hoàn thành',
      value: stats.completedBooksCount,
      unit: 'cuốn',
      icon: CheckCircle2,
      colorClass: 'text-emerald-600 dark:text-emerald-400',
      bgClass: 'bg-emerald-500/10 border-emerald-500/20',
      subText: 'Đọc trọn vẹn 100%',
    },
    {
      title: 'Sách đang đọc dở',
      value: stats.inProgressBooksCount,
      unit: 'cuốn',
      icon: BookOpen,
      colorClass: 'text-amber-600 dark:text-amber-400',
      bgClass: 'bg-amber-500/10 border-amber-500/20',
      subText: 'Đang theo dõi tiến độ',
    },
    {
      title: 'Chương sách đã đọc',
      value: stats.totalChaptersRead,
      unit: 'chương',
      icon: BookMarked,
      colorClass: 'text-indigo-600 dark:text-indigo-400',
      bgClass: 'bg-indigo-500/10 border-indigo-500/20',
      subText: 'Tổng số chương đã qua',
    },
    {
      title: 'Sách mượn thư viện',
      value: stats.activeBorrowedCount,
      unit: 'ấn bản',
      icon: Library,
      colorClass: 'text-rose-600 dark:text-rose-400',
      bgClass: 'bg-rose-500/10 border-rose-500/20',
      subText: 'Đang mượn tại quầy',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {statCards.map((item, idx) => {
        const Icon = item.icon;
        return (
          <Card
            key={idx}
            className="border-border/60 bg-card/80 hover:bg-card/100 transition-all shadow-sm hover:shadow-md"
          >
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-medium text-muted-foreground line-clamp-1">
                  {item.title}
                </span>
                <div className={`p-1.5 rounded-md border ${item.bgClass}`}>
                  <Icon className={`h-4 w-4 ${item.colorClass}`} />
                </div>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {isLoading ? '...' : item.value}
                </span>
                <span className="text-xs text-muted-foreground font-normal">{item.unit}</span>
              </div>

              <p className="text-[11px] text-muted-foreground mt-1 truncate">{item.subText}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
