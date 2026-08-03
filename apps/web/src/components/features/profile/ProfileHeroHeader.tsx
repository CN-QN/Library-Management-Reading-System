'use client';

import React from 'react';
import { Mail, GraduationCap, Building, Edit3, ShieldCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Props cho component ProfileHeroHeader.
 *
 * @param user - Thông tin độc giả đăng nhập hiện tại (null nếu chưa tải xong)
 * @param onOpenEditModal - Callback kích hoạt modal chỉnh sửa thông tin cá nhân
 */
export interface UserProfileHeaderProps {
  user: {
    id: string;
    email: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    studentCode?: string;
    avatar?: string | null;
    branchId?: string;
    branchName?: string;
    roles?: string[];
  } | null;
  onOpenEditModal: () => void;
}

/**
 * ProfileHeroHeader - Component hiển thị thông tin hồ sơ độc giả.
 *
 * Hiển thị Banner nền chuyển màu, Avatar độc giả (kèm fallback tên viết tắt),
 * tên hiển thị, mã số sinh viên, danh hiệu độc giả chính thức, email, chi nhánh thư viện
 * và nút kích hoạt modal chỉnh sửa hồ sơ.
 *
 * Dùng ở: Trang hồ sơ độc giả cá nhân (/profile).
 */
export function ProfileHeroHeader({ user, onOpenEditModal }: UserProfileHeaderProps) {
  // Lấy tên hiển thị từ fullName hoặc ghép firstName + lastName, mặc định là 'Độc giả thư viện'
  const displayName =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    'Độc giả thư viện';

  // Lấy 2 chữ cái đầu của 2 từ cuối làm ký tự đại diện cho AvatarFallback
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'DG';

  return (
    <Card className="border-border/60 bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden mb-6">
      <div className="h-24 bg-gradient-to-r from-amber-500/20 via-amber-600/10 to-primary/20 border-b border-border/40" />
      <CardContent className="px-6 pb-6 pt-0 relative">
        <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 -mt-12">
          {/* Avatar & Thông tin cơ bản */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
            <div className="p-1 rounded-full bg-background ring-4 ring-amber-500/20 shadow-md">
              <Avatar className="h-24 w-24 rounded-full">
                <AvatarImage src={user?.avatar || undefined} alt={displayName} className="object-cover" />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-2xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="space-y-1.5 pt-2 sm:pt-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {displayName}
                </h1>
                {user?.studentCode && (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 text-xs font-semibold">
                    <GraduationCap className="h-3 w-3 mr-1" />
                    {user.studentCode}
                  </Badge>
                )}
                <Badge variant="secondary" className="bg-primary/10 text-primary text-xs font-medium">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  Độc giả chính thức
                </Badge>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {user?.email || 'Chưa cập nhật email'}
                </span>
                <span className="flex items-center gap-1">
                  <Building className="h-3.5 w-3.5" />
                  {user?.branchName || 'Thư viện Trung tâm'}
                </span>
              </div>
            </div>
          </div>

          {/* Nút hành động chỉnh sửa thông tin */}
          <Button
            onClick={onOpenEditModal}
            variant="outline"
            size="sm"
            className="cursor-pointer gap-1.5 border-border/80 hover:bg-primary/10 hover:text-primary hover:border-primary/40 font-medium transition-colors"
          >
            <Edit3 className="h-4 w-4" />
            <span>Chỉnh sửa hồ sơ</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
