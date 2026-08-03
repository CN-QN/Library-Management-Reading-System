import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Đăng ký | LibraryHub',
  description: 'Đăng ký tài khoản mới trên hệ thống thư viện',
};

/**
 * RegisterPage - Server component cho trang đăng ký.
 * Bọc RegisterForm trong Suspense vì form có sử dụng useSearchParams().
 */
export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}
