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
    <div className="flex min-h-[80vh] flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="w-full flex justify-start mb-2">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Về trang chủ
          </Link>
        </div>
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
          <BookOpen size={32} />
        </div>
        <h2 className="text-center text-3xl font-bold tracking-tight text-foreground">
          Đăng nhập LibraryHub
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-border">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email / Tài khoản
              </label>
              <div className="mt-1">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full"
                  placeholder="Vui lòng nhập tài khoản"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Mật khẩu
              </label>
              <div className="mt-1">
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
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                {error}
              </div>
            )}

            <div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  'Đăng nhập'
                )}
              </Button>
            </div>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              Chưa có tài khoản?{' '}
              <Link href={`/register?returnUrl=${encodeURIComponent(returnUrl)}`} className="text-primary hover:underline font-medium">
                Đăng ký ngay
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
