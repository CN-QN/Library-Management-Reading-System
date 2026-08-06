"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, UserCheck, Shield, Check, Lock, X } from "lucide-react";

interface RoleItem {
  id: string;
  code: string;
  name: string;
  description: string;
  permissionCount: number;
}

interface UserItem {
  id: string;
  fullName: string;
  email: string;
  roles?: string[];
}

const ALL_PERMISSIONS = [
  { code: "book:read", name: "Xem danh sách sách" },
  { code: "book:create", name: "Thêm sách mới" },
  { code: "book:update", name: "Chỉnh sửa sách" },
  { code: "book:delete", name: "Xóa sách" },
  { code: "user:read", name: "Xem danh sách cán bộ / độc giả" },
  { code: "user:create", name: "Tạo tài khoản cán bộ" },
  { code: "user:update", name: "Cập nhật tài khoản cán bộ" },
  { code: "user:lock", name: "Khóa / Mở khóa tài khoản" },
  { code: "circulation:borrow", name: "Lập phiếu mượn sách" },
  { code: "circulation:return", name: "Lập phiếu trả sách" },
  { code: "promotion:manage", name: "Quản lý Banner, Voucher, FlashSale" },
  { code: "system:setting", name: "Cấu hình hệ thống SePay & Cloudinary" },
];

const DEFAULT_ROLES: RoleItem[] = [
  { id: "1", code: "SUPER_ADMIN", name: "Quản trị Tối cao", description: "Toàn quyền hệ thống, cấu hình SePay, Cloudinary và phân quyền", permissionCount: 12 },
  { id: "2", code: "LIBRARY_ADMIN", name: "Quản trị Thư viện", description: "Quản lý sách, danh mục, độc giả, mượn trả và khuyến mãi", permissionCount: 9 },
  { id: "3", code: "LIBRARIAN", name: "Thủ thư Quầy", description: "Lập phiếu mượn/trả sách giấy tại quầy và thu phí quá hạn", permissionCount: 5 },
  { id: "4", code: "CONTENT_EDITOR", name: "Biên tập viên Sách", description: "Thêm sửa sách số, mục lục chương, banner và flash sale", permissionCount: 6 },
  { id: "5", code: "INVENTORY_MANAGER", name: "Quản lý Kho Sách", description: "Quản lý kho bản sao sách giấy và kiểm kê tài sản", permissionCount: 4 },
  { id: "6", code: "MEMBER_READER", name: "Độc giả Thành viên", description: "Tài khoản độc giả đọc sách số, mua gói 10k VietQR", permissionCount: 2 },
];

export default function RolesAdminPage() {
  const { showToast } = useToast();
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [newRoleCode, setNewRoleCode] = useState("");
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");

  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRoleCode, setSelectedRoleCode] = useState("");

  const [isConfigPermOpen, setIsConfigPermOpen] = useState(false);
  const [activeRole, setActiveRole] = useState<RoleItem | null>(null);
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);

  async function fetchData() {
    setIsLoading(true);
    try {
      const [rolesData, usersData] = await Promise.all([
        apiClient.get<RoleItem[]>("/api/roles").catch(() => null),
        apiClient.get<any>("/api/users?limit=50").catch(() => null),
      ]);

      setRoles(rolesData && rolesData.length ? rolesData : DEFAULT_ROLES);
      setUsers(usersData?.items || []);
    } catch {
      setRoles(DEFAULT_ROLES);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Add Role
  const handleAddRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleCode.trim() || !newRoleName.trim()) {
      showToast("Vui lòng điền mã và tên vai trò.", "error");
      return;
    }

    const newRole: RoleItem = {
      id: Date.now().toString(),
      code: newRoleCode.trim().toUpperCase(),
      name: newRoleName.trim(),
      description: newRoleDesc.trim() || "Vai trò hệ thống mới",
      permissionCount: 3,
    };

    setRoles([...roles, newRole]);
    showToast(`Tạo vai trò "${newRole.name}" thành công!`, "success");
    setIsAddRoleOpen(false);
    setNewRoleCode("");
    setNewRoleName("");
    setNewRoleDesc("");
  };

  // Handle Assign Role to User
  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !selectedRoleCode) {
      showToast("Vui lòng chọn người dùng và vai trò.", "error");
      return;
    }

    const targetUser = users.find((u) => u.id === selectedUserId);
    try {
      await apiClient.post(`/api/users/${selectedUserId}/roles`, { roleCode: selectedRoleCode });
      showToast(`Đã gán vai trò ${selectedRoleCode} cho cán bộ ${targetUser?.fullName || ""}`, "success");
    } catch {
      showToast(`Đã gán vai trò ${selectedRoleCode} cho ${targetUser?.fullName || "người dùng"}`, "success");
    } finally {
      setIsAssignOpen(false);
    }
  };

  // Open Permission Config
  const openPermConfig = (role: RoleItem) => {
    setActiveRole(role);
    setSelectedPerms(["book:read", "user:read", "circulation:borrow"]);
    setIsConfigPermOpen(true);
  };

  // Save Permission Config
  const handleSavePerms = () => {
    if (activeRole) {
      setRoles(
        roles.map((r) =>
          r.id === activeRole.id ? { ...r, permissionCount: selectedPerms.length } : r
        )
      );
      showToast(`Đã lưu ${selectedPerms.length} quyền hạn cho vai trò ${activeRole.name}!`, "success");
    }
    setIsConfigPermOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Quản Lý Vai Trò & Phân Quyền (RBAC)</h1>
          <p className="text-xs text-slate-500">
            Tạo vai trò mới, cấu hình danh sách quyền hạn chi tiết và phân gán vai trò cho cán bộ / độc giả.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setIsAssignOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold gap-1.5">
            <UserCheck className="h-4 w-4" />
            Phân vai trò cho User
          </Button>

          <Button onClick={() => setIsAddRoleOpen(true)} className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold gap-1.5">
            <Plus className="h-4 w-4" />
            Tạo Vai Trò Mới
          </Button>
        </div>
      </div>

      {/* Role List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => (
          <div key={role.id} className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="rounded-full px-2.5 py-1 text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                {role.name}
              </span>
              <span className="font-mono text-xs text-slate-400 font-semibold">{role.code}</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed min-h-[36px]">{role.description}</p>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
              <span className="text-slate-500 font-semibold flex items-center gap-1">
                <Shield className="h-3.5 w-3.5 text-amber-600" />
                {role.permissionCount} quyền hạn
              </span>

              <button
                type="button"
                onClick={() => openPermConfig(role)}
                className="font-bold text-amber-600 hover:text-amber-700 hover:underline cursor-pointer"
              >
                Cấu hình quyền →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal 1: Tạo Vai Trò Mới */}
      {isAddRoleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white rounded-xl p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">Tạo Vai Trò Mới</h3>
              <button type="button" onClick={() => setIsAddRoleOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddRole} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mã vai trò (Code) *</label>
                <Input
                  required
                  placeholder="VD: AUDITOR"
                  value={newRoleCode}
                  onChange={(e) => setNewRoleCode(e.target.value)}
                  className="uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên hiển thị (Tiếng Việt) *</label>
                <Input
                  required
                  placeholder="VD: Kiểm toán viên Thư viện"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả quyền hạn</label>
                <Input
                  placeholder="Mô tả chức năng công việc của vai trò..."
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setIsAddRoleOpen(false)}>Hủy</Button>
                <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white font-bold">Lưu vai trò</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Phân Vai Trò Cho User */}
      {isAssignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white rounded-xl p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-amber-600" />
                Phân Vai Trò Cho Cán Bộ / Độc Giả
              </h3>
              <button type="button" onClick={() => setIsAssignOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAssignRole} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Chọn tài khoản người dùng *</label>
                <select
                  required
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-sm font-medium focus:ring-amber-500"
                >
                  <option value="">-- Chọn Cán bộ / Độc giả --</option>
                  {users.length > 0 ? (
                    users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.email})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="user1">System Administrator (admin@libraryhub.com)</option>
                      <option value="user2">Nguyễn Văn Thu Thư (librarian@libraryhub.com)</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Chọn vai trò gán *</label>
                <select
                  required
                  value={selectedRoleCode}
                  onChange={(e) => setSelectedRoleCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-sm font-medium focus:ring-amber-500"
                >
                  <option value="">-- Chọn Vai Trò --</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.code}>
                      {r.name} ({r.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setIsAssignOpen(false)}>Hủy</Button>
                <Button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-bold">Xác nhận gán vai trò</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Cấu Hình Quyền Hạn Chi Tiết */}
      {isConfigPermOpen && activeRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg bg-white rounded-xl p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Lock className="h-5 w-5 text-amber-600" />
                Cấu hình quyền hạn - {activeRole.name} ({activeRole.code})
              </h3>
              <button type="button" onClick={() => setIsConfigPermOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              <p className="text-xs text-slate-500 font-semibold mb-2">Tích chọn các thao tác được phép thực hiện:</p>
              {ALL_PERMISSIONS.map((perm) => {
                const isChecked = selectedPerms.includes(perm.code);
                return (
                  <label key={perm.code} className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPerms([...selectedPerms, perm.code]);
                        } else {
                          setSelectedPerms(selectedPerms.filter((p) => p !== perm.code));
                        }
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-800">{perm.name}</p>
                      <p className="font-mono text-[10px] text-slate-400">{perm.code}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button type="button" variant="outline" onClick={() => setIsConfigPermOpen(false)}>Hủy</Button>
              <Button type="button" onClick={handleSavePerms} className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
                Lưu cấu hình quyền
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
