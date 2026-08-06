'use client';

import axios from 'axios';
import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Loader2, KeyRound, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot password modal states
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [tokenStep, setTokenStep] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [isForgotSubmitting, setIsForgotSubmitting] = useState(false);

  const { login } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawReturnUrl = searchParams.get('returnUrl') || '/';
  const returnUrl = rawReturnUrl.startsWith('/') ? rawReturnUrl : '/';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      router.push(returnUrl);
    } catch (error: unknown) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message
        : undefined;
      setError(message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const res = await axios.post('/api/auth/google', {
        email: 'google.user@libraryhub.com',
        name: 'Độc giả Google',
        avatar: 'https://lh3.googleusercontent.com/a/default-user',
      }, { withCredentials: true });

      if (res.data?.success) {
        window.location.href = returnUrl;
      }
    } catch (err) {
      setError('Đăng nhập bằng Google không thành công.');
    }
  };

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotMessage('');
    setIsForgotSubmitting(true);

    try {
      const res = await axios.post('http://localhost:5210/api/auth/forgot-password', { email: forgotEmail });
      const data = res.data?.data;
      setForgotMessage(res.data?.message || `Mã Token khôi phục 6 chữ số (${data?.resetToken}) đã gửi tới email ${forgotEmail}!`);
      if (data?.resetToken) {
        setResetToken(data.resetToken);
      }
      setTokenStep(true);
    } catch (err: any) {
      setForgotError(err.response?.data?.message || 'Email không tồn tại trong hệ thống.');
    } finally {
      setIsForgotSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setIsForgotSubmitting(true);

    try {
      const res = await axios.post('http://localhost:5210/api/auth/reset-password', {
        email: forgotEmail,
        token: resetToken,
        newPassword: newPassword,
      });
      setForgotMessage(res.data?.message || 'Đặt lại mật khẩu mới thành công! Bạn có thể đăng nhập ngay.');
      setTimeout(() => {
        setIsForgotOpen(false);
        setTokenStep(false);
      }, 2000);
    } catch (err: any) {
      setForgotError(err.response?.data?.message || 'Mã Token 6 chữ số không hợp lệ hoặc đã hết hạn.');
    } finally {
      setIsForgotSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col items-center text-center">
        <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-3 shadow-inner">
          <BookOpen size={28} />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          Đăng nhập LibraryHub
        </h2>
        <p className="text-xs md:text-sm text-muted-foreground mt-1">
          Nhập thông tin tài khoản để truy cập hệ thống thư viện
        </p>
      </div>

      <div className="bg-card py-8 px-6 shadow-xl rounded-2xl border border-border space-y-6">
        {/* Google OAuth Login Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 rounded-xl border border-border bg-background py-2.5 px-4 text-sm font-semibold text-foreground hover:bg-accent transition-all shadow-sm"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z" />
            <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
            <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12.5s.7 2.8 1.9 5.2l3.7-2.9z" />
            <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 17C3.7 20.7 7.5 24 12 24z" />
          </svg>
          Đăng nhập bằng Google
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs font-semibold text-muted-foreground uppercase">Hoặc Email</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
              Email / Tài khoản
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
              placeholder="vividu@example.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Mật khẩu
              </label>
              <button
                type="button"
                onClick={() => setIsForgotOpen(true)}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Quên mật khẩu?
              </button>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-xl border border-destructive/20 font-medium">
              {error}
            </div>
          )}

          <Button type="submit" size="lg" className="w-full font-semibold rounded-xl" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              'Đăng nhập'
            )}
          </Button>

          <div className="pt-2 text-center text-sm text-muted-foreground">
            Chưa có tài khoản?{' '}
            <Link href={`/register?returnUrl=${encodeURIComponent(returnUrl)}`} className="text-primary hover:underline font-semibold">
              Đăng ký ngay
            </Link>
          </div>
        </form>
      </div>

      {/* Modal Quên Mật Khẩu với Token Check */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" />
                Quên Mật Khẩu Độc Giả
              </h3>
              <button type="button" onClick={() => setIsForgotOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            {forgotError && (
              <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-xl">
                {forgotError}
              </div>
            )}

            {forgotMessage && (
              <div className="p-3 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 font-medium rounded-xl flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{forgotMessage}</span>
              </div>
            )}

            {!tokenStep ? (
              <form onSubmit={handleRequestToken} className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Nhập địa chỉ email đăng ký. Hệ thống sẽ gửi cho bạn **Mã Token xác thực 6 chữ số** có hiệu lực 15 phút.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Email đăng ký *</label>
                  <Input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="VD: reader@libraryhub.com"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <Button type="button" variant="outline" onClick={() => setIsForgotOpen(false)}>Hủy</Button>
                  <Button type="submit" disabled={isForgotSubmitting}>
                    {isForgotSubmitting ? 'Đang gửi...' : 'Gửi mã xác nhận'}
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Mã Token Xác Thực (6 chữ số) *</label>
                  <Input
                    type="text"
                    required
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    placeholder="VD: 839102"
                    className="font-mono tracking-widest font-bold text-center text-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Mật khẩu mới *</label>
                  <Input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <Button type="button" variant="outline" onClick={() => setIsForgotOpen(false)}>Hủy</Button>
                  <Button type="submit" disabled={isForgotSubmitting}>
                    {isForgotSubmitting ? 'Đang xác thực...' : 'Đổi mật khẩu'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
