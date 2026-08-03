import React from 'react';
import type { Metadata } from 'next';
import { ProfileContainer } from '@/components/features/profile';
import type { ProfileTabType } from '@/types/Profile';

export const metadata: Metadata = {
  title: 'Hồ sơ độc giả & Lịch sử đọc sách | Thư viện Đại học',
  description:
    'Quản lý thông tin độc giả cá nhân, theo dõi tiến trình đọc sách số, lịch sử sách đã hoàn thành và danh sách sách mượn tại thư viện.',
};

interface ProfilePageProps {
  searchParams: Promise<{
    tab?: string;
    page?: string;
  }>;
}

/**
 * Trang Hồ sơ độc giả và Lịch sử đọc sách (Pure Next.js Server Component).
 * Tiếp nhận query params từ URL và phân phối trạng thái xuống Leaf Client Component ProfileContainer.
 */
export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const resolvedParams = await searchParams;

  const validTabs: ProfileTabType[] = ['reading', 'history', 'borrowed'];
  const tab: ProfileTabType = validTabs.includes(resolvedParams.tab as ProfileTabType)
    ? (resolvedParams.tab as ProfileTabType)
    : 'reading';

  const page = Math.max(1, parseInt(resolvedParams.page || '1', 10) || 1);

  return <ProfileContainer initialTab={tab} initialPage={page} />;
}
