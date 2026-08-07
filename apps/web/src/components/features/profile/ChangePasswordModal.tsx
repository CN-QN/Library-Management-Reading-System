'use client';

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { KeyRound, Mail, Lock, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/lib/api/auth';

export interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
}

/**
 * ChangePasswordModal - Modal hỗ trợ người dùng đã đăng nhập thực hiện đổi mật khẩu tài khoản.
 * Quy trình 2 bước: Yêu cầu mã xác nhận -> Nhập mã token và mật khẩu mới.
 */
export function ChangePasswordModal({
  isOpen,
  onClose,
  userEmail,
}: ChangePasswordModalProps) {
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [token, setToken] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPasswords, setShowPasswords] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Tự động xóa sạch trạng thái và reset form mỗi khi Modal đóng/mở
  useEffect(() => {
    if (!isOpen) {
      setStep('request');
      setToken('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswords(false);
      setIsLoading(false);
      setError('');
      setSuccessMessage('');
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isOpen]);

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!userEmail.trim()) {
      setError('Không tìm thấy email tài khoản. Vui lòng thử lại sau.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await authApi.forgotPassword(userEmail);
      const devToken = (res.data?.data as { token?: string } | undefined)?.token;
      if (devToken) {
        setToken(devToken);
      }
      setSuccessMessage(
        res.data?.message || 'Mã xác nhận đổi mật khẩu đã được gửi đến email của bạn.'
      );
      setStep('reset');
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message
        : undefined;
      setError(msg || 'Không thể gửi yêu cầu mã xác nhận. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!token.trim()) {
      setError('Vui lòng nhập mã xác nhận.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await authApi.resetPassword(userEmail, token.trim(), newPassword);
      setSuccessMessage(
        res.data?.message || 'Đặt lại mật khẩu mới thành công!'
      );
      timerRef.current = setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message
        : undefined;
      setError(
        msg || 'Mã xác nhận không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu lại.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <KeyRound className="h-5 w-5 text-primary" />
            <span>Đổi mật khẩu tài khoản</span>
          </DialogTitle>
          <DialogDescription>
            {step === 'request'
              ? 'LibraryHub sẽ gửi mã xác nhận đổi mật khẩu tới email đăng ký của bạn.'
              : 'Nhập mã xác nhận và mật khẩu mới để hoàn tất đổi mật khẩu.'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 text-sm rounded-lg bg-destructive/10 text-destructive border border-destructive/20 font-medium">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="p-3 text-sm rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-medium flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {step === 'request' ? (
          <form onSubmit={handleRequestToken} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="change-password-email">Email tài khoản</Label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="change-password-email"
                  type="email"
                  value={userEmail}
                  disabled
                  className="pl-9 bg-muted/50 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Hủy
              </Button>
              <Button type="submit" disabled={isLoading} className="gap-2 font-semibold cursor-pointer">
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Gửi mã xác nhận</span>
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="change-password-token">Mã xác nhận (Token)</Label>
              <div className="relative flex items-center">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="change-password-token"
                  type="text"
                  placeholder="Nhập mã xác nhận"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  disabled={isLoading}
                  className="pl-9 font-mono text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="change-password-new">Mật khẩu mới</Label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="change-password-new"
                  type={showPasswords ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                  className="pl-9 pr-9"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="change-password-confirm">Xác nhận mật khẩu mới</Label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="change-password-confirm"
                  type={showPasswords ? 'text' : 'password'}
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  className="pl-9 pr-9"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setSuccessMessage('');
                  setStep('request');
                }}
                disabled={isLoading}
                className="text-xs text-primary hover:underline font-medium cursor-pointer"
              >
                Gửi lại mã xác nhận?
              </button>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                  Hủy
                </Button>
                <Button type="submit" disabled={isLoading} className="gap-2 font-semibold cursor-pointer">
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Xác nhận đổi</span>
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
