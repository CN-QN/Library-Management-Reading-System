"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Permissions } from "@/lib/permissions";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Repeat,
  Ticket,
  Image as ImageIcon,
  Zap,
  HardDrive,
  Star,
  BarChart2,
  Settings,
  History,
  ChevronLeft,
  ChevronRight,
  Library,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  epic: string;
  permissions: string[];
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Tổng quan", epic: "E5.2", permissions: [], icon: LayoutDashboard },
  { href: "/books", label: "Quản lý sách", epic: "E5.3", permissions: [Permissions.BookRead], icon: BookOpen },
  { href: "/users", label: "Người dùng", epic: "E5.5", permissions: [Permissions.UserRead], icon: Users },
  { href: "/borrowings", label: "Mượn / Trả", epic: "E5.6", permissions: [Permissions.LoanCreate, Permissions.LoanReturn, Permissions.LoanExtend], icon: Repeat },
  { href: "/vouchers", label: "Quản lý Voucher", epic: "E5.11", permissions: [], icon: Ticket },
  { href: "/banners", label: "Quản lý Banner UI", epic: "E5.12", permissions: [], icon: ImageIcon },
  { href: "/flash-sale", label: "Sự kiện Flash Sale", epic: "E5.13", permissions: [], icon: Zap },
  { href: "/media", label: "Thư viện Media", epic: "E5.14", permissions: [], icon: HardDrive },
  { href: "/reviews", label: "Kiểm duyệt Đánh giá", epic: "E5.15", permissions: [], icon: Star },
  { href: "/reports", label: "Báo cáo & Thống kê", epic: "E5.7", permissions: [Permissions.ReportView], icon: BarChart2 },
  { href: "/settings", label: "Cấu hình hệ thống", epic: "E5.9", permissions: [Permissions.SettingRead], icon: Settings },
  { href: "/audit-logs", label: "Nhật ký hệ thống", epic: "E5.10", permissions: [Permissions.AuditRead], icon: History },
];

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ isMobileOpen = false, onMobileClose }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { canAny } = useAuth();

  const visibleItems = NAV_ITEMS.filter(
    (item) => item.permissions.length === 0 || canAny(...item.permissions)
  );

  return (
    <>
      {/* Desktop: static rail with Collapsible Toggle */}
      <aside className={`hidden border-r border-slate-200 bg-white md:flex md:flex-col transition-all duration-300 relative ${isCollapsed ? "w-20" : "w-64"}`}>
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="rounded-lg bg-slate-900 p-2 text-white shrink-0">
              <Library className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
                LibraryHub <span className="text-slate-400 font-normal">Admin</span>
              </span>
            )}
          </Link>

          {/* Toggle Collapse Button */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            title={isCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
          >
            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const IconComponent = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <IconComponent className={`h-5 w-5 shrink-0 ${isActive ? "text-white" : "text-slate-500"}`} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-slate-900/40" aria-hidden="true" onClick={onMobileClose} />
          <aside className="relative flex h-full w-64 flex-col bg-white shadow-xl">
            <div className="flex h-16 items-center border-b border-slate-200 px-6">
              <span className="text-base font-bold text-slate-900">LibraryHub Admin</span>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {visibleItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const IconComponent = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onMobileClose}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                      isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <IconComponent className="h-5 w-5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
