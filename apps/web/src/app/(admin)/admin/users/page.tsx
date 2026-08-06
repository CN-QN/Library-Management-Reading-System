'use client';

import React, { useEffect, useState } from 'react';
import { Users, Search, Lock, Unlock, Shield, Mail, Calendar, RefreshCw, AlertCircle } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserRecord {
  id: string;
  email: string;
  fullName: string;
  avatar?: string;
  status: string;
  roles: string[];
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

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
            Quản lý tài khoản độc giả, kiểm soát khóa/mở khóa và vai trò người dùng trong hệ thống.
          </p>
        </div>

        <Button onClick={fetchUsers} variant="outline" size="sm" className="gap-1.5 self-start sm:self-auto">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo Tên hoặc Email độc giả..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            {['ALL', 'ADMIN', 'LIBRARIAN', 'READER'].map((role) => (
              <Button
                key={role}
                variant={roleFilter === role ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRoleFilter(role)}
                className="text-xs font-medium shrink-0"
              >
                {role === 'ALL' ? 'Tất cả vai trò' : role}
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
            Danh Sách Độc Giả ({filteredUsers.length})
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
                  <th className="px-4 py-3">Độc giả</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Vai trò</th>
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
                          {userItem.roles?.map((r) => (
                            <Badge key={r} variant="outline" className="text-[11px] font-mono">
                              {r}
                            </Badge>
                          )) || <Badge variant="outline">READER</Badge>}
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
    </div>
  );
}
