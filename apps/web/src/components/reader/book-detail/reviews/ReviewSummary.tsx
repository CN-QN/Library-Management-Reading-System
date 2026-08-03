'use client';

import React from 'react';
import { Star, ArrowUpDown } from 'lucide-react';
import { StarRating } from '@/components/shared/StarRating';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ReviewStats } from '@/types/Review';

/**
 * Thuộc tính của component ReviewSummary.
 */
export interface ReviewSummaryProps {
  /** Dữ liệu thống kê điểm số và phân bổ sao của cuốn sách */
  stats: ReviewStats;
  /** Mức sao đang được chọn để lọc ('all' hoặc 1..5) */
  selectedFilter: 1 | 2 | 3 | 4 | 5 | 'all';
  /** Callback khi người dùng thay đổi mức sao muốn lọc */
  onFilterChange: (filter: 1 | 2 | 3 | 4 | 5 | 'all') => void;
  /** Tiêu chí sắp xếp danh sách đánh giá */
  selectedSort: 'newest' | 'highest' | 'lowest';
  /** Callback khi người dùng thay đổi tiêu chí sắp xếp */
  onSortChange: (sort: 'newest' | 'highest' | 'lowest') => void;
}

/**
 * ReviewSummary - Hiển thị tổng quan điểm đánh giá trung bình và các thanh tiến trình phân bổ số sao (5★ đến 1★).
 * Hỗ trợ các nút filter nhanh theo từng mức sao và dropdown sắp xếp.
 *
 * Dùng ở: ReviewsSection của trang chi tiết sách.
 */
export function ReviewSummary({
  stats,
  selectedFilter,
  onFilterChange,
  selectedSort,
  onSortChange,
}: ReviewSummaryProps) {
  const stars: (1 | 2 | 3 | 4 | 5)[] = [5, 4, 3, 2, 1];

  return (
    <div className="p-6 rounded-xl border bg-card/60 backdrop-blur-xs space-y-6 shadow-xs">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Cột Điểm trung bình lớn */}
        <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-border/60">
          <span className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
            {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '0.0'}
          </span>
          <div className="mt-2">
            <StarRating rating={stats.averageRating} size={18} />
          </div>
          <span className="text-xs text-muted-foreground mt-1.5 font-medium">
            Dựa trên {stats.totalReviews} lượt đánh giá
          </span>
        </div>

        {/* Cột Thanh phân bổ từng mức sao */}
        <div className="md:col-span-8 space-y-2">
          {stars.map((star) => {
            const count = stats.distribution[star] || 0;
            const percent = stats.percentages[star] || 0;
            const isActive = selectedFilter === star;

            return (
              <button
                key={star}
                type="button"
                onClick={() => onFilterChange(isActive ? 'all' : star)}
                className={cn(
                  'w-full flex items-center gap-3 text-xs group py-1 px-2 rounded-md transition-colors text-left cursor-pointer',
                  isActive ? 'bg-primary/10 font-semibold text-primary' : 'hover:bg-muted/50 text-muted-foreground'
                )}
                title={`Lọc đánh giá ${star} sao`}
              >
                <span className="flex items-center gap-1 w-12 shrink-0 font-medium">
                  {star} <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                </span>

                {/* Progress bar tùy chỉnh */}
                <div className="flex-1 h-2.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      star >= 4 ? 'bg-amber-500' : star === 3 ? 'bg-amber-400' : 'bg-amber-600'
                    )}
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <span className="w-16 shrink-0 text-right font-mono text-[11px] text-muted-foreground">
                  {count} ({percent}%)
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dải nút lọc nhanh theo sao & Sắp xếp */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border/60">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground mr-1">Lọc theo:</span>
          <Button
            variant={selectedFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            className="h-7 text-xs rounded-full px-3 cursor-pointer"
            onClick={() => onFilterChange('all')}
          >
            Tất cả ({stats.totalReviews})
          </Button>
          {stars.map((star) => (
            <Button
              key={star}
              variant={selectedFilter === star ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs rounded-full px-3 cursor-pointer"
              onClick={() => onFilterChange(selectedFilter === star ? 'all' : star)}
            >
              {star}★ ({stats.distribution[star] || 0})
            </Button>
          ))}
        </div>

        {/* Dropdown sắp xếp */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
          <select
            value={selectedSort}
            onChange={(e) => onSortChange(e.target.value as 'newest' | 'highest' | 'lowest')}
            className="text-xs h-7 rounded-md border bg-background px-2.5 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            aria-label="Sắp xếp đánh giá"
          >
            <option value="newest">Mới nhất</option>
            <option value="highest">Đánh giá cao nhất</option>
            <option value="lowest">Đánh giá thấp nhất</option>
          </select>
        </div>
      </div>
    </div>
  );
}
