'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogIn, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import {
  getMyReadingProgress,
  getMyReadingHistory,
  getMyBorrowedBooks,
  getReadingStats,
} from '@/lib/api/profile';
import {
  ProfileHeroHeader,
  ReadingStatsGrid,
  ProfileTabsNav,
  InProgressBooksTab,
  ReadingHistoryTab,
  BorrowedBooksTab,
  EditProfileModal,
} from './index';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type {
  ProfileTabType,
  InProgressBook,
  ReadingHistoryItem,
  BorrowedBook,
  ReadingStats,
} from '@/types/Profile';

interface ProfileContainerProps {
  initialTab?: ProfileTabType;
  initialPage?: number;
}

/**
 * Container Client Component chính quản lý dữ liệu, trạng thái xác thực và điều hướng Tab trên trang Hồ sơ cá nhân.
 */
export function ProfileContainer({
  initialTab = 'reading',
  initialPage = 1,
}: ProfileContainerProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading, checkAuth } = useAuthStore();

  const activeTab = initialTab;
  const currentPage = initialPage;

  const [inProgressBooks, setInProgressBooks] = useState<InProgressBook[]>([]);
  const [readingHistory, setReadingHistory] = useState<ReadingHistoryItem[]>([]);
  const [borrowedBooks, setBorrowedBooks] = useState<BorrowedBook[]>([]);
  const [stats, setStats] = useState<ReadingStats>({
    completedBooksCount: 0,
    inProgressBooksCount: 0,
    totalChaptersRead: 0,
    activeBorrowedCount: 0,
    totalReadingMinutes: 0,
  });

  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [profileOverride, setProfileOverride] = useState<{ fullName?: string; avatar?: string | null }>({});

  // Đọc dữ liệu ghi đè từ LocalStorage nếu có
  useEffect(() => {
    if (typeof window !== 'undefined' && user?.id) {
      try {
        const stored = localStorage.getItem(`user_profile_override_${user.id}`);
        if (stored) {
          setProfileOverride(JSON.parse(stored));
        }
      } catch {
        // Bỏ qua lỗi đọc LocalStorage
      }
    }
  }, [user?.id]);

  // Tải dữ liệu song song từ API thật
  const loadProfileData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [progress, history, borrowed] = await Promise.all([
        getMyReadingProgress(),
        getMyReadingHistory(),
        getMyBorrowedBooks(user?.id),
      ]);

      setInProgressBooks(progress);
      setReadingHistory(history);
      setBorrowedBooks(borrowed);

      const calculatedStats = getReadingStats(progress, history, borrowed);
      setStats(calculatedStats);
    } catch (error) {
      console.warn('Lỗi khi tải dữ liệu trang cá nhân:', error);
    } finally {
      setIsLoadingData(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  // Xử lý đổi Tab và đồng bộ URL query parameter không giật trang
  const handleTabChange = (tab: ProfileTabType) => {
    router.replace(`/profile?tab=${tab}`, { scroll: false });
  };

  // Xử lý đổi trang phân trang
  const handlePageChange = (page: number) => {
    router.replace(`/profile?tab=${activeTab}&page=${page}`, { scroll: false });
  };

  // Callback sau khi lưu thông tin cá nhân
  const handleProfileUpdated = (updated: { fullName: string; avatar?: string | null }) => {
    setProfileOverride(updated);
    checkAuth();
  };

  // Trạng thái đang kiểm tra auth ban đầu
  if (isAuthLoading) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8 animate-pulse space-y-6">
        <div className="h-44 rounded-xl bg-muted/60" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-muted/40" />
          ))}
        </div>
        <div className="h-64 rounded-xl bg-muted/30" />
      </div>
    );
  }

  // Trạng thái khách vãng lai (Guest) chưa đăng nhập
  if (!isAuthenticated && !user) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
        <Card className="border-border/60 bg-card/80 shadow-md">
          <CardContent className="p-8 flex flex-col items-center space-y-4">
            <div className="p-4 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ShieldAlert className="h-10 w-10" />
            </div>
            <h2 className="text-xl font-bold text-foreground">
              Yêu cầu đăng nhập tài khoản độc giả
            </h2>
            <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
              Vui lòng đăng nhập bằng tài khoản sinh viên hoặc độc giả để theo dõi tiến trình đọc sách, xem lịch sử và quản lý ấn bản mượn tại thư viện.
            </p>
            <Button size="default" className="gap-2 cursor-pointer mt-2 shadow-sm p-0">
              <Link href="/login?returnUrl=/profile" className="flex items-center gap-2 px-4 py-2 w-full h-full">
                <LogIn className="h-4 w-4" />
                <span>Đăng nhập ngay</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Hợp nhất dữ liệu user hiển thị
  const displayUser = user
    ? {
        ...user,
        fullName: profileOverride.fullName || user.fullName,
        avatar: profileOverride.avatar !== undefined ? profileOverride.avatar : user.avatar,
      }
    : null;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      {/* Header hồ sơ độc giả */}
      <ProfileHeroHeader
        user={displayUser}
        onOpenEditModal={() => setIsEditModalOpen(true)}
      />

      {/* Lưới Bento thống kê đọc sách */}
      <ReadingStatsGrid stats={stats} isLoading={isLoadingData} />

      {/* Thanh tab điều hướng */}
      <ProfileTabsNav
        activeTab={activeTab}
        onChangeTab={handleTabChange}
        counts={{
          reading: inProgressBooks.length,
          history: readingHistory.length,
          borrowed: borrowedBooks.filter((b) => b.status !== 'RETURNED').length,
        }}
      />

      {/* Nội dung theo Tab đang chọn */}
      <div>
        {activeTab === 'reading' && (
          <InProgressBooksTab books={inProgressBooks} isLoading={isLoadingData} />
        )}
        {activeTab === 'history' && (
          <ReadingHistoryTab
            items={readingHistory}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            isLoading={isLoadingData}
          />
        )}
        {activeTab === 'borrowed' && (
          <BorrowedBooksTab borrowed={borrowedBooks} isLoading={isLoadingData} />
        )}
      </div>

      {/* Modal Chỉnh sửa hồ sơ cá nhân */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        currentUser={displayUser}
        onSuccess={handleProfileUpdated}
      />
    </div>
  );
}
