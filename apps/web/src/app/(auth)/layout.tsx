'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, ArrowLeft, UserPlus, LogIn, Sparkles } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground relative overflow-hidden selection:bg-primary/20 selection:text-primary">
      {/* Dynamic Background Gradient & Ambient Glow Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-primary/15 via-amber-500/5 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" />
      <div className="absolute bottom-10 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" />

      {/* Header Matching Homepage Branding */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-amber-600 to-amber-700 text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-primary via-amber-600 to-foreground bg-clip-text text-transparent">
                LibraryHub
              </span>
              <span className="text-[10px] text-muted-foreground font-medium -mt-1 tracking-wider uppercase">
                Thư Viện Sách Số
              </span>
            </div>
          </Link>

          {/* Header Right Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mr-2 px-3 py-1.5 rounded-lg hover:bg-muted/50"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại Trang chủ
            </Link>

            {isLoginPage ? (
              <Link
                href="/register"
                className={buttonVariants({
                  variant: 'outline',
                  size: 'sm',
                  className: 'gap-1.5 font-bold rounded-xl border-primary/30 hover:border-primary text-primary hover:bg-primary/10 shadow-sm',
                })}
              >
                <UserPlus className="w-4 h-4" />
                <span>Tạo tài khoản mới</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className={buttonVariants({
                  variant: 'default',
                  size: 'sm',
                  className: 'gap-1.5 font-bold rounded-xl shadow-lg shadow-primary/20',
                })}
              >
                <LogIn className="w-4 h-4" />
                <span>Đăng nhập</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 relative z-10">
        <div className="w-full max-w-md my-auto space-y-6">
          {children}
        </div>
      </main>

      {/* Footer Matching Homepage */}
      <footer className="border-t border-border/40 py-6 bg-card/50 backdrop-blur-md mt-auto relative z-10">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground text-center sm:text-left">
          <p>© 2026 LibraryHub Management System. Nền tảng đọc sách số bản quyền hàng đầu.</p>
          <div className="flex items-center gap-5 font-medium">
            <Link href="/" className="hover:text-primary transition-colors">
              Trang chủ
            </Link>
            <Link href="/books" className="hover:text-primary transition-colors">
              Kho Sách Số
            </Link>
            <Link href="/categories" className="hover:text-primary transition-colors">
              Thể loại Sách
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
