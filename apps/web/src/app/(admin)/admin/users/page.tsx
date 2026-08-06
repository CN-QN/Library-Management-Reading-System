'use client';

import React, { useEffect, useState } from 'react';
import { Users, Search, Lock, Unlock, Mail, RefreshCw, AlertCircle, UserPlus, Shield } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';

interface UserRecord {
  id: string;
  email: string;
  fullName: string;
  avatar?: string;
  status: string;
  roles: string[];
  createdAt: string;
}

// Chuẩn hóa tên vai trò sang Tiếng Việt thân thiện
const ROLE_LABEL_MAP: Record<string, { label: string; color: string }> = {
  SUPER_ADMIN: { label: 'Quản trị Tối cao', color: 'bg-purple-600' },
  LIBRARY_ADMIN: { label: 'Quản trị Thư viện', color: 'bg-indigo-600' },
  LIBRARIAN: { label: 'Thủ thư', color: 'bg-blue-600' },
  CONTENT_EDITOR: { label: 'Biên tập viên', color: 'bg-teal-600' },
  INVENTORY_STAFF: { label: 'Quản lý Kho', color: 'bg-amber-600' },
  STUDENT: { label: 'Độc giả Thành viên', color: 'bg-emerald-600' },
  GUEST: { label: 'Khách Vãng lai', color: 'bg-slate-600' },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  // Form Thêm người dùng mới
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('STUDENT');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/users');
      const data = res.data?.data?.items || res.data?.data || [];
      setUsers(data);
    } catch (err) {
      console.error('Lỗi khi lấy danh sách người dùng:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (userItem: UserRecord) => {
    const newStatus = userItem.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED';
    setStatusUpdatingId(userItem.id);
    try {
      await apiClient.patch(`/users/${userItem.id}/status`, { status: newStatus });
      setUsers((prev) =>
        prev.map((u) => (u.id === userItem.id ? { ...u, status: newStatus } : u))
      );
    } catch (err) {
      alert('Không thể cập nhật trạng thái người dùng. Vui lòng thử lại.');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const validateUserForm = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim() || fullName.trim().length < 2) {
      errs.fullName = 'Họ tên phải từ 2 ký tự trở lên';
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Email không hợp lệ';
    }
    if (!password || password.length < 6) {
      errs.password = 'Mật khẩu phải từ 6 ký tự trở lên';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateUserForm()) return;

    try {
      await apiClient.post('/users', {
        fullName,
        email,
        password,
        roleCode: selectedRole,
      });
      setIsModalOpen(false);
      setFullName('');
      setEmail('');
      setPassword('');
      fetchUsers();
    } catch (err) {
      alert('Không thể tạo tài khoản mới. Email có thể đã tồn tại.');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole =
      roleFilter === 'ALL' || u.roles.some((r) => r.toUpperCase() === roleFilter);

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Quản Lý Độc Giả & Phân Quyền</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý tài khoản độc giả cộng đồng, phân quyền vai trò Tiếng Việt và kiểm soát mở/khóa tài khoản.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button onClick={() => setIsModalOpen(true)} className="gap-1.5">
            <UserPlus className="h-4 w-4" />
            Thêm Người Dùng Mới
          </Button>
          <Button onClick={fetchUsers} variant="outline" size="sm" className="gap-1.5">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo Họ tên hoặc Email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            <Button
              variant={roleFilter === 'ALL' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRoleFilter('ALL')}
              className="text-xs font-medium shrink-0"
            >
              Tất cả vai trò
            </Button>
            {Object.entries(ROLE_LABEL_MAP).map(([code, meta]) => (
              <Button
                key={code}
                variant={roleFilter === code ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRoleFilter(code)}
                className="text-xs font-medium shrink-0"
              >
                {meta.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User Table */}
      <Card>
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Danh Sách Người Dùng ({filteredUsers.length})
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="py-16 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              Đang tải danh sách người dùng...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
              <AlertCircle className="h-8 w-8 text-muted-foreground/60" />
              Không tìm thấy người dùng nào phù hợp.
            </div>
          ) : (
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-muted/40 text-muted-foreground text-xs uppercase font-semibold border-b border-border">
                <tr>
                  <th className="px-4 py-3">Họ tên độc giả</th>
                  <th className="px-4 py-3">Email liên hệ</th>
                  <th className="px-4 py-3">Vai trò hệ thống</th>
                  <th className="px-4 py-3 text-center">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((userItem) => {
                  const isLocked = userItem.status === 'LOCKED';
                  const isUpdating = statusUpdatingId === userItem.id;

                  return (
                    <tr key={userItem.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3.5 flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-border">
                          <AvatarImage src={userItem.avatar} />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                            {userItem.fullName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="font-semibold text-foreground block">{userItem.fullName}</span>
                          <span className="text-[11px] text-muted-foreground font-mono">ID: {userItem.id.substring(0, 8)}...</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-muted-foreground font-mono text-xs">
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground/70" />
                          {userItem.email}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 flex-wrap">
                          {userItem.roles?.map((r) => {
                            const meta = ROLE_LABEL_MAP[r.toUpperCase()] || { label: r, color: 'bg-muted' };
                            return (
                              <Badge key={r} className={`${meta.color} text-white text-[11px] font-medium`}>
                                {meta.label}
                              </Badge>
                            );
                          }) || <Badge variant="secondary">Độc giả Thành viên</Badge>}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <Badge
                          variant={isLocked ? 'destructive' : 'default'}
                          className={!isLocked ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                        >
                          {isLocked ? 'Đã khóa' : 'Hoạt động'}
                        </Badge>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <Button
                          variant={isLocked ? 'default' : 'outline'}
                          size="sm"
                          disabled={isUpdating}
                          onClick={() => handleToggleStatus(userItem)}
                          className={isLocked ? 'bg-emerald-600 hover:bg-emerald-700 gap-1 text-xs' : 'text-destructive border-destructive/30 hover:bg-destructive/10 gap-1 text-xs'}
                        >
                          {isLocked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                          {isLocked ? 'Mở khóa' : 'Khóa TK'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Modal Thêm người dùng */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-base text-foreground">Thêm Người Dùng Mới</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>✕</Button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <Label htmlFor="uFullName" className="text-xs font-semibold">Họ và tên độc giả *</Label>
                <Input
                  id="uFullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className={formErrors.fullName ? 'border-destructive' : ''}
                />
                {formErrors.fullName && <p className="text-xs text-destructive mt-1">{formErrors.fullName}</p>}
              </div>

              <div>
                <Label htmlFor="uEmail" className="text-xs font-semibold">Địa chỉ Email *</Label>
                <Input
                  id="uEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="docgia@gmail.com"
                  className={formErrors.email ? 'border-destructive' : ''}
                />
                {formErrors.email && <p className="text-xs text-destructive mt-1">{formErrors.email}</p>}
              </div>

              <div>
                <Label htmlFor="uPassword" className="text-xs font-semibold">Mật khẩu ban đầu *</Label>
                <Input
                  id="uPassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={formErrors.password ? 'border-destructive' : ''}
                />
                {formErrors.password && <p className="text-xs text-destructive mt-1">{formErrors.password}</p>}
              </div>

              <div>
                <Label className="text-xs font-semibold block mb-1">Vai trò hệ thống</Label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm font-medium"
                >
                  {Object.entries(ROLE_LABEL_MAP).map(([code, meta]) => (
                    <option key={code} value={code}>
                      {meta.label} ({code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Hủy</Button>
                <Button type="submit">Tạo tài khoản</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
