"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast";

interface RoleItem {
  id: string;
  code: string;
  name: string;
  description: string;
  permissionCount: number;
}

const VIETNAMESE_ROLES: Record<string, { name: string; desc: string; badgeClass: string }> = {
  SUPER_ADMIN: {
    name: "Quản trị Tối cao",
    desc: "Toàn quyền hệ thống, cấu hình SePay, Cloudinary và phân quyền",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-200",
  },
  LIBRARY_ADMIN: {
    name: "Quản trị Thư viện",
    desc: "Quản lý sách, danh mục, độc giả, mượn trả và khuyến mãi",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
  },
  LIBRARIAN: {
    name: "Thủ thư Quầy",
    desc: "Lập phiếu mượn/trả sách giấy tại quầy và thu phí quá hạn",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  CONTENT_EDITOR: {
    name: "Biên tập viên Sách",
    desc: "Thêm sửa sách số, mục lục chương, banner và flash sale",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
  },
  INVENTORY_MANAGER: {
    name: "Quản lý Kho Sách",
    desc: "Quản lý kho bản sao sách giấy và kiểm kê tài sản",
    badgeClass: "bg-orange-100 text-orange-800 border-orange-200",
  },
  MEMBER_READER: {
    name: "Độc giả Thành viên",
    desc: "Tài khoản độc giả đọc sách số, mua gói 10k VietQR",
    badgeClass: "bg-slate-100 text-slate-800 border-slate-200",
  },
};

export default function RolesAdminPage() {
  const { showToast } = useToast();
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function fetchRoles() {
    setIsLoading(true);
    try {
      const data = await apiClient.get<RoleItem[]>("/api/roles");
      setRoles(data || []);
    } catch {
      // Fallback display
      setRoles(
        Object.entries(VIETNAMESE_ROLES).map(([code, meta], idx) => ({
          id: (idx + 1).toString(),
          code,
          name: meta.name,
          description: meta.desc,
          permissionCount: code === "SUPER_ADMIN" ? 45 : 20,
        }))
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchRoles();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Quản Lý Vai Trò & Phân Quyền (RBAC)</h1>
          <p className="text-sm text-slate-500">
            Cấu hình phân quyền quản trị Việt hóa hoàn toàn cho đội ngũ cán bộ thư viện & độc giả.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => {
          const meta = VIETNAMESE_ROLES[role.code] || {
            name: role.name || role.code,
            desc: role.description || "Vai trò hệ thống",
            badgeClass: "bg-slate-100 text-slate-800",
          };

          return (
            <div key={role.id} className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 shadow-sm hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold border ${meta.badgeClass}`}>
                  {meta.name}
                </span>
                <span className="font-mono text-xs text-slate-400">{role.code}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{meta.desc}</p>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <span className="text-slate-500 font-medium">{role.permissionCount || 15} quyền hạn</span>
                <button
                  type="button"
                  onClick={() => showToast(`Cấu hình quyền cho ${meta.name}!`, "info")}
                  className="font-medium text-slate-900 hover:underline"
                >
                  Cấu hình quyền →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
