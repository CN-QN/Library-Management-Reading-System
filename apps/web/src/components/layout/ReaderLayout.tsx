'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, LogOut, User, Clock, ShieldCheck, MapPin, Phone, Mail } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useRouter, usePathname } from 'next/navigation';

export default function ReaderLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  // Khi đang ở chế độ đọc sách toàn màn hình (/books/[slug]/read), không render header/footer chung của portal
  const isReaderPage = pathname ? /\/books\/[^/]+\/read(\/|$)/.test(pathname) : false;
  if (isReaderPage) {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Logo & Main Nav */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 text-primary font-bold text-xl hover:opacity-90 transition-opacity">
              <BookOpen size={24} />
              <span>LibraryHub</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                Trang chủ
              </Link>
              <Link href="/books" className="text-muted-foreground hover:text-foreground transition-colors">
                Tất cả sách
              </Link>
              <Link href="/categories" className="text-muted-foreground hover:text-foreground transition-colors">
                Thể loại
              </Link>
            </nav>
          </div>

          {/* User Menu / Login Button */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger render={
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-1 ring-border">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {user?.firstName?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                } />
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.firstName} {user?.lastName}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem render={
                    <Link href="/profile" className="cursor-pointer flex items-center w-full">
                      <User className="mr-2 h-4 w-4" />
                      <span>Hồ sơ cá nhân</span>
                    </Link>
                  } />
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login" className={buttonVariants({ variant: "default", className: "font-medium" })}>
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Comprehensive Reader Portal Footer */}
      <footer className="border-t bg-card text-card-foreground mt-auto">
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Column 1: Brand & Intro */}
            <div className="space-y-3">
              <Link href="/" className="flex items-center gap-2 text-primary font-bold text-xl hover:opacity-90 transition-opacity">
                <BookOpen size={24} />
                <span>LibraryHub</span>
              </Link>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Hệ thống Quản lý Thư viện & Đọc sách trực tuyến thông minh. Mang hàng ngàn cuốn sách hay, tri thức và trải nghiệm đọc tuyệt vời đến với độc giả.
              </p>
              <div className="pt-1 text-xs text-muted-foreground space-y-1.5">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>Giờ mở cửa: T2 - T7 (08:00 - 20:00)</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Bảo mật hệ thống chuẩn SSL 256-bit</span>
                </div>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold tracking-wider uppercase text-foreground">
                Khám phá & Đọc sách
              </h3>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>
                  <Link href="/" className="hover:text-primary transition-colors">
                    Trang chủ Portal
                  </Link>
                </li>
                <li>
                  <Link href="/books" className="hover:text-primary transition-colors">
                    Tất cả danh mục sách
                  </Link>
                </li>
                <li>
                  <Link href="/categories" className="hover:text-primary transition-colors">
                    Phân loại thể loại sách
                  </Link>
                </li>
                <li>
                  <Link href="/books" className="hover:text-primary transition-colors">
                    Sách mới phát hành
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Library Services */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold tracking-wider uppercase text-foreground">
                Dịch vụ Thư viện
              </h3>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>
                  <span className="hover:text-primary cursor-pointer transition-colors">
                    Tra cứu & Đặt mượn sách
                  </span>
                </li>
                <li>
                  <span className="hover:text-primary cursor-pointer transition-colors">
                    Đăng ký thẻ đọc giả
                  </span>
                </li>
                <li>
                  <span className="hover:text-primary cursor-pointer transition-colors">
                    Quy định mượn trả & Tiền phạt
                  </span>
                </li>
                <li>
                  <span className="hover:text-primary cursor-pointer transition-colors">
                    Hướng dẫn đọc sách trực tuyến
                  </span>
                </li>
              </ul>
            </div>

            {/* Column 4: Contact & Location */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold tracking-wider uppercase text-foreground">
                Thông tin Liên hệ
              </h3>
              <div className="space-y-2.5 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary shrink-0" />
                  <span>Hotline: 1900 6868 - (024) 3869 1234</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary shrink-0" />
                  <span>Email: hotro@libraryhub.vn</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Copyright Bar */}
          <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>© 2026 LibraryHub Management System. Tất cả quyền được bảo lưu.</p>
            <div className="flex items-center gap-6">
              <span className="hover:text-foreground cursor-pointer transition-colors">
                Điều khoản dịch vụ
              </span>
              <span className="hover:text-foreground cursor-pointer transition-colors">
                Chính sách bảo mật
              </span>
              <span className="hover:text-foreground cursor-pointer transition-colors">
                Trợ giúp & FAQ
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
