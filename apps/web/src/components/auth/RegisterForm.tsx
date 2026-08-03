'use client';

import axios from 'axios';
import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * RegisterForm - Form đăng ký tài khoản mới.
 * 
 * Gọi API POST /auth/register.
 * Khi thành công, hiển thị thông báo popup trực tiếp trên form,
 * yêu cầu người dùng nhấn OK để chuyển về trang đăng nhập.
 */
export function RegisterForm() {
  const [formData, setFormData] = useState({
    fullName: '',
    studentCode: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  // Xử lý bảo mật Open Redirect:
  // Đảm bảo URL trả về phải là một path nội bộ (bắt đầu bằng '/'),
  // tránh trường hợp bị tấn công chuyển hướng sang domain khác.
  const rawReturnUrl = searchParams.get('returnUrl') || '/';
  const returnUrl = (rawReturnUrl.startsWith('/') && !rawReturnUrl.startsWith('//')) ? rawReturnUrl : '/';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsSubmitting(true);

    try {
      await apiClient.post('/auth/register', {
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        studentCode: formData.studentCode || undefined, // Bỏ qua nếu rỗng
      });
      
      // Thành công -> Đổi state để hiện UI thông báo
      setIsSuccess(true);
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || err.response?.data?.title
        : undefined;
      setError(message || 'Đăng ký thất bại. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessOk = () => {
    // Chuyển hướng về trang đăng nhập, mang theo returnUrl nếu có
    router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
  };

  if (isSuccess) {
    return (
      <div className="flex min-h-[80vh] flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-card py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-border text-center space-y-6">
            <div className="flex justify-center">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Đăng ký thành công!</h2>
            <p className="text-muted-foreground text-sm">
              Tài khoản của bạn đã được khởi tạo. Chào mừng bạn gia nhập LibraryHub.
            </p>
            <Button onClick={handleSuccessOk} className="w-full">
              Đăng nhập ngay
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
          <UserPlus size={32} />
        </div>
        <h2 className="text-center text-3xl font-bold tracking-tight text-foreground">
          Đăng ký tài khoản
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-border">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-foreground">
                Họ và tên *
              </label>
              <div className="mt-1">
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full"
                  placeholder="Nguyễn Văn A"
                />
              </div>
            </div>

            <div>
              <label htmlFor="studentCode" className="block text-sm font-medium text-foreground">
                Mã số sinh viên (Không bắt buộc)
              </label>
              <div className="mt-1">
                <Input
                  id="studentCode"
                  name="studentCode"
                  type="text"
                  value={formData.studentCode}
                  onChange={handleChange}
                  className="w-full"
                  placeholder="VD: 20230001"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email *
              </label>
              <div className="mt-1">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full"
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Mật khẩu *
              </label>
              <div className="mt-1">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full"
                  placeholder="Tối thiểu 6 ký tự"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
                Xác nhận mật khẩu *
              </label>
              <div className="mt-1">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full"
                  placeholder="Nhập lại mật khẩu"
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                {error}
              </div>
            )}

            <div className="pt-2">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  'Tạo tài khoản'
                )}
              </Button>
            </div>
            
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Đã có tài khoản?{' '}
              <Link href={`/login?returnUrl=${encodeURIComponent(returnUrl)}`} className="text-primary hover:underline font-medium">
                Đăng nhập
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
