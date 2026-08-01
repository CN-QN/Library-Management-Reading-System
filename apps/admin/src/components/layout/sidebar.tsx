"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Permissions } from "@/lib/permissions";

interface NavItem {
  href: string;
  label: string;
  /** Epic/task this page belongs to, for traceability with the GitHub board. */
  epic: string;
  /** User needs ANY of these permissions to see the link. Empty = always visible. */
  permissions: string[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Tổng quan", epic: "E5.2", permissions: [] },
  {
    href: "/books",
    label: "Quản lý sách",
    epic: "E5.3",
    permissions: [Permissions.BookRead],
  },
  {
    href: "/users",
    label: "Người dùng",
    epic: "E5.5",
    permissions: [Permissions.UserRead],
  },
  {
    href: "/borrowings",
    label: "Mượn / Trả",
    epic: "E5.6",
    permissions: [Permissions.LoanCreate, Permissions.LoanReturn, Permissions.LoanExtend],
  },
  {
    href: "/reports",
    label: "Báo cáo & Thống kê",
    epic: "E5.7",
    permissions: [Permissions.ReportView],
  },
  {
    href: "/categories",
    label: "Thể loại & Tác giả",
    epic: "E5.8",
    permissions: [Permissions.BookRead],
  },
  {
    href: "/settings",
    label: "Cấu hình hệ thống",
    epic: "E5.9",
    permissions: [Permissions.SettingRead],
  },
  {
    href: "/audit-logs",
    label: "Nhật ký hệ thống",
    epic: "E5.10",
    permissions: [Permissions.AuditRead],
  },
];

interface SidebarProps {
  /** Mobile drawer open state. Ignored on md+ where the sidebar is always visible. */
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { canAny } = useAuth();

  const visibleItems = NAV_ITEMS.filter(
    (item) => item.permissions.length === 0 || canAny(...item.permissions)
  );

  return (
    <>
      <div className="flex h-16 items-center border-b border-slate-200 px-6">
        <span className="text-lg font-semibold tracking-tight text-slate-900">
          LibraryHub <span className="text-slate-400">Admin</span>
        </span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export function Sidebar({ isMobileOpen = false, onMobileClose }: SidebarProps) {
  return (
    <>
      {/* Desktop: static rail, always visible md+ */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white md:flex md:flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile: drawer + backdrop, only rendered while open */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40"
            aria-hidden="true"
            onClick={onMobileClose}
          />
          <aside className="relative flex h-full w-64 flex-col bg-white shadow-xl">
            <SidebarContent onNavigate={onMobileClose} />
          </aside>
        </div>
      )}
    </>
  );
}
