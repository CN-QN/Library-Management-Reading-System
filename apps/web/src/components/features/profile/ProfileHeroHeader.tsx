'use client';

import React from 'react';
import { Mail, Phone, Building, Edit3, ShieldCheck, KeyRound } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export interface UserProfileHeaderProps {
  user: {
    id: string;
    email: string;
    fullName?: string;
    phoneNumber?: string;
    avatar?: string | null;
    branchName?: string;
    notifyBookAvailable?: boolean;
  } | null;
  onOpenEditModal: () => void;
  onOpenChangePasswordModal: () => void;
}

export function ProfileHeroHeader({
  user,
  onOpenEditModal,
  onOpenChangePasswordModal,
}: UserProfileHeaderProps) {
  const displayName = user?.fullName || 'Độc giả Thư viện';

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
          {/* Avatar & Info */}
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
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                  <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                  Độc giả chính thức
                </Badge>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1 font-medium">
                  <Mail className="h-3.5 w-3.5 text-primary" />
                  {user?.email || 'Chưa cập nhật email'}
                </span>
                {user?.phoneNumber && (
                  <span className="flex items-center gap-1 font-medium">
                    <Phone className="h-3.5 w-3.5 text-emerald-600" />
                    {user.phoneNumber}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Building className="h-3.5 w-3.5" />
                  {user?.branchName || 'Thư viện Trung tâm'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={onOpenChangePasswordModal}
              variant="outline"
              size="sm"
              className="cursor-pointer gap-1.5 border-border/80 hover:bg-primary/10 hover:text-primary hover:border-primary/40 font-semibold transition-colors"
            >
              <KeyRound className="h-4 w-4" />
              <span>Đổi mật khẩu</span>
            </Button>

            <Button
              onClick={onOpenEditModal}
              variant="outline"
              size="sm"
              className="cursor-pointer gap-1.5 border-border/80 hover:bg-primary/10 hover:text-primary hover:border-primary/40 font-semibold transition-colors"
            >
              <Edit3 className="h-4 w-4" />
              <span>Chỉnh sửa hồ sơ</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
