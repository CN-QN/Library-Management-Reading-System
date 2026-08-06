'use client';

import axios from 'axios';
import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordRequirements } from './PasswordRequirements';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Họ và tên độc giả phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không đúng định dạng'),
  password: z
    .string()
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
    .regex(/[A-Z]/, 'Phải chứa chữ hoa')
    .regex(/[a-z]/, 'Phải chứa chữ thường')
    .regex(/[0-9]/, 'Phải chứa chữ số')
    .regex(/[\W_]/, 'Phải chứa ký tự đặc biệt'),
  confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

/**
 * RegisterForm - Form đăng ký tài khoản mới.
 */
export function RegisterForm() {
  const [submitError, setSubmitError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawReturnUrl = searchParams.get('returnUrl') || '/';
  const returnUrl = (rawReturnUrl.startsWith('/') && !rawReturnUrl.startsWith('//')) ? rawReturnUrl : '/';

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onSubmit',
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    }
  });

  const currentPassword = watch('password');

  const onSubmit = async (data: RegisterFormValues) => {
    setSubmitError('');

    try {
      await apiClient.post('/auth/register', {
        email: data.email,
        password: data.password,
        fullName: data.fullName,
      });
      setIsSuccess(true);
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.details?.[0]?.message
          || err.response?.data?.message
          || err.response?.data?.title
        : undefined;
      setSubmitError(message || 'Đăng ký thất bại. Vui lòng thử lại sau.');
    }
  };

  const handleSuccessOk = () => {
    router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
  };

  if (isSuccess) {
    return (
      <div className="w-full space-y-6">
        <div className="bg-card py-8 px-6 shadow-xl rounded-2xl border border-border text-center space-y-6">
          <div className="flex justify-center">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Đăng ký thành công!</h2>
          <p className="text-muted-foreground text-sm">
            Tài khoản độc giả của bạn đã được khởi tạo. Chào mừng bạn gia nhập LibraryHub.
          </p>
          <Button onClick={handleSuccessOk} size="lg" className="w-full font-semibold rounded-xl">
            Đăng nhập ngay
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col items-center text-center">
        <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-3 shadow-inner">
          <UserPlus size={28} />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          Đăng ký tài khoản
        </h2>
        <p className="text-xs md:text-sm text-muted-foreground mt-1">
          Tạo tài khoản mới để trải nghiệm đọc sách và mượn sách trực tuyến
        </p>
      </div>

      <div className="bg-card py-8 px-6 shadow-xl rounded-2xl border border-border">
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-foreground">
              Họ và tên độc giả *
            </label>
            <div className="mt-1 relative">
              <Input
                id="fullName"
                type="text"
                autoComplete="name"
                {...register('fullName')}
                className={`w-full ${errors.fullName ? 'border-destructive' : ''}`}
                placeholder="Nhập họ và tên đầy đủ..."
              />
            </div>
            {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName.message}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              Email *
            </label>
            <div className="mt-1 relative">
              <Input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className={`w-full ${errors.email ? 'border-destructive' : ''}`}
                placeholder="email@example.com"
              />
            </div>
            {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
              Mật khẩu *
            </label>
            <div className="mt-1 relative flex items-center">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                {...register('password')}
                className={`w-full pr-10 ${errors.password ? 'border-destructive' : ''}`}
                placeholder="Tối thiểu 6 ký tự"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Ẩn/Hiện mật khẩu"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <PasswordRequirements password={currentPassword} />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
              Xác nhận mật khẩu *
            </label>
            <div className="mt-1 relative flex items-center">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                {...register('confirmPassword')}
                className={`w-full pr-10 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                placeholder="Nhập lại mật khẩu"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Ẩn/Hiện xác nhận mật khẩu"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-destructive mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          {submitError && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-xl border border-destructive/20 font-medium">
              {submitError}
            </div>
          )}

          <div className="pt-2">
            <Button type="submit" size="lg" className="w-full font-semibold rounded-xl" disabled={isSubmitting}>
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

          <div className="pt-2 text-center text-sm text-muted-foreground">
            Đã có tài khoản?{' '}
            <Link href={`/login?returnUrl=${encodeURIComponent(returnUrl)}`} className="text-primary hover:underline font-semibold">
              Đăng nhập ngay
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
