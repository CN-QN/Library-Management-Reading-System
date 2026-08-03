'use client';

import axios from 'axios';
import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, Loader2, CheckCircle2, ArrowLeft, Check, XCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordRequirements } from './PasswordRequirements';

const registerSchema = z.object({
  fullName: z.string().min(1, 'Họ và tên là bắt buộc'),
  studentCode: z.string().optional(),
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
 * 
 * Sử dụng react-hook-form và zod để kiểm tra real-time.
 */
export function RegisterForm() {
  const [submitError, setSubmitError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawReturnUrl = searchParams.get('returnUrl') || '/';
  const returnUrl = (rawReturnUrl.startsWith('/') && !rawReturnUrl.startsWith('//')) ? rawReturnUrl : '/';

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, touchedFields },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: {
      fullName: '',
      studentCode: '',
      email: '',
      password: '',
      confirmPassword: '',
    }
  });

  const currentPassword = watch('password');
  const currentConfirm = watch('confirmPassword');

  const onSubmit = async (data: RegisterFormValues) => {
    setSubmitError('');

    try {
      await apiClient.post('/auth/register', {
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        studentCode: data.studentCode || undefined,
      });
      setIsSuccess(true);
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || err.response?.data?.title
        : undefined;
      setSubmitError(message || 'Đăng ký thất bại. Vui lòng thử lại sau.');
    }
  };

  const handleSuccessOk = () => {
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

  // Component phụ trợ hiển thị Feedback Icon (Tích xanh / Lỗi)
  // Chỉ hiển thị icon khi field ĐÃ BỊ TOUCHED để tránh aggressive validation
  const FeedbackIcon = ({ fieldName, hasError }: { fieldName: keyof RegisterFormValues, hasError: boolean }) => {
    if (!touchedFields[fieldName]) return null;
    if (hasError) return <XCircle className="w-4 h-4 text-destructive absolute right-3 top-3" />;
    return <CheckCircle2 className="w-4 h-4 text-green-500 absolute right-3 top-3" />;
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
          <UserPlus size={32} />
        </div>
        <h2 className="text-center text-3xl font-bold tracking-tight text-foreground">
          Đăng ký tài khoản
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-border">
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-foreground">
                Họ và tên *
              </label>
              <div className="mt-1 relative">
                <Input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  {...register('fullName')}
                  className={`w-full pr-10 ${(touchedFields.fullName && errors.fullName) ? 'border-destructive' : ''}`}
                  placeholder="Nguyễn Văn A"
                />
                <FeedbackIcon fieldName="fullName" hasError={!!errors.fullName} />
              </div>
              {touchedFields.fullName && errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName.message}</p>}
            </div>

            <div>
              <label htmlFor="studentCode" className="block text-sm font-medium text-foreground">
                Mã số sinh viên (Không bắt buộc)
              </label>
              <div className="mt-1">
                <Input
                  id="studentCode"
                  type="text"
                  {...register('studentCode')}
                  className="w-full"
                  placeholder="VD: 20230001"
                />
              </div>
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
                  className={`w-full pr-10 ${(touchedFields.email && errors.email) ? 'border-destructive' : ''}`}
                  placeholder="email@example.com"
                />
                <FeedbackIcon fieldName="email" hasError={!!errors.email} />
              </div>
              {touchedFields.email && errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Mật khẩu *
              </label>
              <div className="mt-1 relative">
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  {...register('password')}
                  className={`w-full pr-10 ${(touchedFields.password && errors.password) ? 'border-destructive' : ''}`}
                  placeholder="Tối thiểu 6 ký tự"
                />
              </div>
              <PasswordRequirements password={currentPassword} />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
                Xác nhận mật khẩu *
              </label>
              <div className="mt-1 relative">
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  {...register('confirmPassword')}
                  className={`w-full pr-10 ${(touchedFields.confirmPassword && errors.confirmPassword) ? 'border-destructive' : ''}`}
                  placeholder="Nhập lại mật khẩu"
                />
                {touchedFields.confirmPassword && currentConfirm && currentConfirm === currentPassword && (
                  <CheckCircle2 className="w-4 h-4 text-green-500 absolute right-3 top-3" />
                )}
                {touchedFields.confirmPassword && currentConfirm !== currentPassword && (
                   <XCircle className="w-4 h-4 text-destructive absolute right-3 top-3" />
                )}
              </div>
              {touchedFields.confirmPassword && errors.confirmPassword && <p className="text-xs text-destructive mt-1">{errors.confirmPassword.message}</p>}
              {touchedFields.confirmPassword && currentConfirm && currentConfirm === currentPassword && (
                 <p className="text-xs text-green-500 mt-1 flex items-center gap-1"><Check className="w-3 h-3"/> Mật khẩu đã khớp!</p>
              )}
            </div>

            {submitError && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                {submitError}
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
