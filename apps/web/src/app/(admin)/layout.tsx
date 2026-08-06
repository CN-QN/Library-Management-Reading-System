'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Image as ImageIcon,
  Star,
  Settings,
  Library,
  LogOut,
  ExternalLink,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();

  const adminRoles = ['ADMIN', 'SUPER_ADMIN', 'LIBRARY_ADMIN', 'LIBRARIAN', 'CONTENT_EDITOR'];
  const hasAdminRole = user?.roles?.some((r) => adminRoles.includes(r.toUpperCase())) ?? false;

  // Route Guard: CHỈ cho phép ADMIN, SUPER_ADMIN, LIBRARY_ADMIN, LIBRARIAN truy cập Admin Portal
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login?returnUrl=/admin/dashboard');
      } else if (!hasAdminRole) {
        alert('Tài khoản của bạn không có quyền truy cập vào Trang Quản Trị Admin!');
        router.push('/');
      }
    }
  }, [isAuthenticated, hasAdminRole, isLoading, router]);

  const navItems = [
    {
      href: '/admin/dashboard',
      label: 'Tổng Quan & Doanh Thu',
      icon: LayoutDashboard,
    },
    {
      href: '/admin/users',
      label: 'Quản Lý Độc Giả',
      icon: Users,
    },
    {
      href: '/admin/books',
      label: 'Quản Lý Sách & Rich Text',
      icon: BookOpen,
    },
    {
      href: '/admin/media',
      label: 'Thư Viện Media Cloudinary',
      icon: ImageIcon,
    },
    {
      href: '/admin/reviews',
      label: 'Kiểm Duyệt Đánh Giá',
      icon: Star,
    },
    {
      href: '/admin/settings',
      label: 'Cấu Hình Web & SePay',
      icon: Settings,
    },
  ];

  if (isLoading || !isAuthenticated || !hasAdminRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">Đang xác thực quyền Admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-card border-r border-border flex flex-col shrink-0">
        {/* Brand Header */}
        <div className="p-4 border-b border-border flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Library className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-bold text-base text-foreground leading-none">LibraryHub</h1>
            <span className="text-[11px] font-semibold text-primary uppercase tracking-wider block mt-1">
              Admin Master Suite
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Sidebar Link */}
        <div className="p-3 border-t border-border">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-start gap-2 text-xs border border-border hover:bg-accent p-2 rounded-md font-medium transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Xem trang Độc giả
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar Header */}
        <header className="h-16 border-b border-border bg-card/80 backdrop-blur px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            <h2 className="font-semibold text-sm text-foreground">Hệ thống Quản trị Thư viện Số</h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <Avatar className="h-8 w-8 border border-border">
                <AvatarImage src={user?.avatar || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                  {user?.fullName?.substring(0, 2).toUpperCase() || 'AD'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <span className="text-xs font-semibold text-foreground block line-clamp-1">
                  {user?.fullName || 'Quản trị viên'}
                </span>
                <span className="text-[10px] text-muted-foreground block uppercase">
                  {user?.roles?.[0] || 'ADMIN'}
                </span>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => {
                logout();
                router.push('/login');
              }}
              title="Đăng xuất"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="p-6 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
