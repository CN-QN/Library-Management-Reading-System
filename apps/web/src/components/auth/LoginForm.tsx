'use client';

import axios from 'axios';
import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Loader2, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * LoginForm - Form đăng nhập người dùng.
 * 
 * Là Client Component để xử lý các tương tác form (state, submit)
 * Tự động chuyển hướng về trang trước đó (hoặc trang chủ) sau khi đăng nhập thành công.
 */
export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Xử lý bảo mật Open Redirect:
  // Đảm bảo URL trả về phải là một path nội bộ (bắt đầu bằng '/'),
  // tránh trường hợp bị tấn công chuyển hướng sang domain khác.
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

      <div className="bg-card py-8 px-6 shadow-xl rounded-2xl border border-border">
        <form className="space-y-5" onSubmit={handleSubmit}>
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
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
              Mật khẩu
            </label>
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
    </div>
  );
}
