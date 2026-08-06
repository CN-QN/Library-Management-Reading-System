'use client';

import React, { useState } from 'react';
import { Loader2, User, Mail, Phone, Bell, Image as ImageIcon } from 'lucide-react';
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
import axios from 'axios';

export interface CurrentUserProfile {
  id: string;
  fullName?: string;
  email: string;
  phoneNumber?: string;
  avatar?: string | null;
  notifyBookAvailable?: boolean;
}

export interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CurrentUserProfile | null;
  onSuccess: (updated: Partial<CurrentUserProfile>) => void;
}

export function EditProfileModal({
  isOpen,
  onClose,
  currentUser,
  onSuccess,
}: EditProfileModalProps) {
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phoneNumber || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatar || '');
  const [notifyBookAvailable, setNotifyBookAvailable] = useState(currentUser?.notifyBookAvailable ?? true);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMessage('Họ và tên độc giả phải có tối thiểu 2 ký tự.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const payload = {
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        avatar: avatarUrl.trim() || null,
        notifyBookAvailable,
      };

      await axios.put('http://localhost:5210/api/auth/profile', payload, { withCredentials: true });
      onSuccess(payload);
      onClose();
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : 'Không thể cập nhật hồ sơ độc giả vào database.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || 'DG';

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5210/api'}/media/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      });

      const url = res.data?.data?.fileUrl;
      if (url) {
        setAvatarUrl(url);
      }
    } catch (err: unknown) {
      setErrorMessage(axios.isAxiosError(err) ? err.response?.data?.message : 'Không thể tải ảnh lên server.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            Chỉnh sửa thông tin hồ sơ độc giả
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Cập nhật Họ tên, Email, Số điện thoại và cài đặt nhận thông báo sách mới về thư viện.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Avatar Preview */}
          <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/40 border border-border/50">
            <Avatar className="h-16 w-16 border-2 border-primary/20 shadow-sm shrink-0">
              <AvatarImage src={avatarUrl || undefined} alt={fullName} className="object-cover" />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0 space-y-1.5">
              <p className="text-xs font-semibold text-foreground">Ảnh đại diện Cloudinary</p>
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
                <ImageIcon className="w-3.5 h-3.5" />
                {isUploading ? 'Đang tải lên...' : 'Đổi ảnh đại diện'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-1">
            <Label htmlFor="fullName" className="text-xs font-semibold">
              Họ và tên độc giả <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="VD: Nguyễn Văn An"
                className="pl-9 text-sm"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <Label htmlFor="email" className="text-xs font-semibold">
              Địa chỉ Email (Nhận thông báo sách) <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="reader@gmail.com"
                className="pl-9 text-sm"
                required
              />
            </div>
          </div>

          {/* Phone Number */}
          <div className="space-y-1">
            <Label htmlFor="phoneNumber" className="text-xs font-semibold">
              Số điện thoại (Nhận tin nhắn SMS khi sách về kho)
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="VD: 0987654321"
                className="pl-9 text-sm"
              />
            </div>
          </div>

          {/* Notification Checkbox */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <input
              type="checkbox"
              id="notifyBook"
              checked={notifyBookAvailable}
              onChange={(e) => setNotifyBookAvailable(e.target.checked)}
              className="h-4 w-4 rounded border-amber-500 text-amber-600 focus:ring-amber-500 cursor-pointer"
            />
            <label htmlFor="notifyBook" className="text-xs font-medium text-foreground cursor-pointer flex items-center gap-1.5">
              <Bell className="h-4 w-4 text-amber-500 shrink-0" />
              Tự động gửi thông báo Email / SMS khi có sách mới hoặc mượn trả về kho
            </label>
          </div>

          {errorMessage && (
            <p className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-md border border-destructive/20 font-medium">
              {errorMessage}
            </p>
          )}

          <DialogFooter className="pt-2 gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-1.5">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Lưu thông tin</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
