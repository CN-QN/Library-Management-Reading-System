'use client';

import React from 'react';
import { BookOpen, History, Library } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ProfileTabType } from '@/types/Profile';

/**
 * Props cho component ProfileTabsNav.
 *
 * @param activeTab - Tab đang được chọn hiện tại ('reading' | 'history' | 'borrowed')
 * @param onChangeTab - Hàm callback xử lý chuyển đổi tab (cập nhật URL query string)
 * @param counts - Số lượng bản ghi cho mỗi danh mục tương ứng
 */
export interface ProfileTabsNavProps {
  activeTab: ProfileTabType;
  onChangeTab: (tab: ProfileTabType) => void;
  counts: {
    reading: number;
    history: number;
    borrowed: number;
  };
}

/**
 * ProfileTabsNav - Thanh tab điều hướng giữa các khu vực nội dung trong hồ sơ độc giả.
 *
 * Cho phép chuyển đổi URL-driven giữa: Sách đang đọc dở, Lịch sử sách đã đọc xong, và Sách mượn vật lý.
 *
 * Dùng ở: Trang hồ sơ cá nhân độc giả (/profile).
 */
export function ProfileTabsNav({ activeTab, onChangeTab, counts }: ProfileTabsNavProps) {
  const tabs = [
    {
      id: 'reading' as ProfileTabType,
      label: 'Sách đang đọc',
      icon: BookOpen,
      count: counts.reading,
    },
    {
      id: 'history' as ProfileTabType,
      label: 'Lịch sử hoàn thành',
      icon: History,
      count: counts.history,
    },
    {
      id: 'borrowed' as ProfileTabType,
      label: 'Sách mượn thư viện',
      icon: Library,
      count: counts.borrowed,
    },
  ];

  return (
    <div className="flex items-center gap-2 border-b border-border/60 pb-px mb-6 overflow-x-auto no-scrollbar">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onChangeTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap -mb-px',
              isActive
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            <Icon className={cn('h-4 w-4', isActive ? 'text-primary' : 'text-muted-foreground')} />
            <span>{tab.label}</span>
            <Badge
              variant="secondary"
              className={cn(
                'ml-1 text-[11px] px-1.5 py-0 rounded-full',
                isActive
                  ? 'bg-primary text-primary-foreground font-bold'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {tab.count}
            </Badge>
          </button>
        );
      })}
    </div>
  );
}
