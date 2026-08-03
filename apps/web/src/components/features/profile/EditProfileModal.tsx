'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, User, Image as ImageIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { updateUserProfile } from '@/lib/api/profile';

/**
 * Interface định nghĩa dữ liệu độc giả truyền vào modal để khởi tạo giá trị ban đầu.
 */
export interface CurrentUserProfile {
  /** ID duy nhất của người dùng */
  id: string;
  /** Họ và tên hiển thị đầy đủ */
  fullName?: string;
  /** Tên (optional) */
  firstName?: string;
  /** Họ (optional) */
  lastName?: string;
  /** Địa chỉ Email độc giả */
  email: string;
  /** Đường dẫn URL ảnh đại diện */
  avatar?: string | null;
}

/**
 * Interface định nghĩa Props cho component EditProfileModal.
 */
export interface EditProfileModalProps {
  /** Trạng thái đóng/mở của modal dialog */
  isOpen: boolean;
  /** Callback được gọi khi yêu cầu đóng modal */
  onClose: () => void;
  /** Thông tin đối tượng độc giả hiện tại */
  currentUser: CurrentUserProfile | null;
  /** Callback xử lý phản hồi khi thông tin hồ sơ được cập nhật thành công */
  onSuccess: (updated: { fullName: string; avatar?: string | null }) => void;
}

/**
 * Component EditProfileModal - Modal dialog cập nhật họ tên và ảnh đại diện độc giả.
 *
 * Dùng tại: Trang Hồ sơ cá nhân độc giả (/profile), kích hoạt khi nhấn nút "Chỉnh sửa hồ sơ".
 * Tác dụng: Cho phép độc giả nhanh chóng chỉnh sửa thông tin cá nhân và cập nhật avatar trực quan.
 *
 * @param props - EditProfileModalProps
 */
export function EditProfileModal({
  isOpen,
  onClose,
  currentUser,
  onSuccess,
}: EditProfileModalProps) {
  const initialName =
    currentUser?.fullName ||
    [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(' ') ||
    '';

  const [fullName, setFullName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatar || '');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cập nhật lại form state khi modal được mở hoặc đối tượng currentUser thay đổi
  useEffect(() => {
    if (isOpen && currentUser) {
      setFullName(
        currentUser.fullName ||
          [currentUser.firstName, currentUser.lastName].filter(Boolean).join(' ') ||
          ''
      );
      setAvatarUrl(currentUser.avatar || '');
      setErrorMessage(null);
    }
  }, [isOpen, currentUser]);

  /**
   * Xử lý submit form cập nhật thông tin cá nhân.
   * Gửi dữ liệu tới API `updateUserProfile` và phản hồi lại component cha thông qua callback `onSuccess`.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) return;

    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMessage('Họ và tên phải có tối thiểu 2 ký tự.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const payload = {
        fullName: fullName.trim(),
        avatar: avatarUrl.trim() || null,
      };

      await updateUserProfile(currentUser.id, payload);
      onSuccess(payload);
      onClose();
    } catch {
      setErrorMessage('Không thể cập nhật hồ sơ. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  // Tạo các ký tự viết tắt initials (từ 2 từ cuối của tên) làm fallback khi avatar chưa được tải
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || 'DG';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[460px] p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            Chỉnh sửa thông tin cá nhân
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Cập nhật tên hiển thị và ảnh đại diện để cá nhân hóa trải nghiệm đọc sách.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Khung xem trước Avatar thời gian thực */}
          <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/40 border border-border/50">
            <Avatar className="h-16 w-16 border-2 border-primary/20 shadow-sm">
              <AvatarImage src={avatarUrl || undefined} alt={fullName} className="object-cover" />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground">Xem trước ảnh đại diện</p>
              <p className="text-[11px] text-muted-foreground truncate">
                {avatarUrl ? 'Đang sử dụng URL ảnh mới' : 'Ảnh mặc định theo tên'}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fullName" className="text-xs font-semibold">
              Họ và tên <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nhập họ và tên đầy đủ..."
                className="pl-9 text-sm"
                required
                minLength={2}
                maxLength={100}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="avatarUrl" className="text-xs font-semibold">
              Đường dẫn URL ảnh đại diện (Tùy chọn)
            </Label>
            <div className="relative">
              <ImageIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="avatarUrl"
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="pl-9 text-sm"
              />
            </div>
          </div>

          {errorMessage && (
            <p className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-md border border-destructive/20 font-medium">
              {errorMessage}
            </p>
          )}

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="cursor-pointer"
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-1.5 cursor-pointer">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Lưu thay đổi</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
