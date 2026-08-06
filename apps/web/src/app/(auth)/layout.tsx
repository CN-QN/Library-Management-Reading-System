'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, ArrowLeft, UserPlus, LogIn } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-foreground">
      {/* Auth Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-md">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link
            href="/"
            className="flex items-center gap-2 text-primary font-bold text-xl hover:opacity-90 transition-opacity"
          >
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <BookOpen size={22} />
            </div>
            <span>LibraryHub</span>
          </Link>

          {/* Right Navigation */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium mr-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Trang chủ
            </Link>

            {isLoginPage ? (
              <Link
                href="/register"
                className={buttonVariants({ variant: 'outline', size: 'sm', className: 'gap-1.5 font-medium' })}
              >
                <UserPlus className="w-4 h-4" />
                <span>Đăng ký</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className={buttonVariants({ variant: 'default', size: 'sm', className: 'gap-1.5 font-medium' })}
              >
                <LogIn className="w-4 h-4" />
                <span>Đăng nhập</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Form Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md my-auto">
          {children}
        </div>
      </main>

      {/* Auth Footer */}
      <footer className="border-t py-6 bg-card mt-auto">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground text-center sm:text-left">
          <p>© 2026 LibraryHub Management System. Tất cả quyền được bảo lưu.</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-foreground transition-colors">
              Trang chủ
            </Link>
            <Link href="/books" className="hover:text-foreground transition-colors">
              Tất cả sách
            </Link>
            <Link href="/categories" className="hover:text-foreground transition-colors">
              Thể loại
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
