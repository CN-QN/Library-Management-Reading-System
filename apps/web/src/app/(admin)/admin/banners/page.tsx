'use client';

import React, { useEffect, useState } from 'react';
import { Image as ImageIcon, Plus, Trash2, RefreshCw } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

interface BannerItem {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  isActive: boolean;
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('/books');

  const fetchBanners = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/banners');
      const data = res.data?.data || [];
      setBanners(data);
    } catch (err) {
      console.error('Lỗi khi tải danh sách Banner:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim()) {
      alert('Vui lòng nhập Tiêu đề và URL ảnh Banner!');
      return;
    }

    try {
      await apiClient.post('/banners', {
        title,
        subtitle,
        imageUrl,
        linkUrl,
        isActive: true,
        sortOrder: banners.length + 1,
      });
      setIsModalOpen(false);
      setTitle('');
      setSubtitle('');
      setImageUrl('');
      fetchBanners();
    } catch (err) {
      alert('Không thể lưu Banner vào database.');
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await apiClient.patch(`/banners/${id}/status`);
      setBanners((prev) =>
        prev.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b))
      );
    } catch (err) {
      alert('Lỗi khi cập nhật trạng thái Banner.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc muốn xóa banner này khỏi database?')) {
      try {
        await apiClient.delete(`/banners/${id}`);
        setBanners((prev) => prev.filter((b) => b.id !== id));
      } catch (err) {
        alert('Lỗi khi xóa Banner.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Quản Lý Banner Trang Chủ UI (Database Real)</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cấu hình danh sách Banner Slider trình chiếu nổi bật tại Trang chủ độc giả từ Database API.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button onClick={() => setIsModalOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Thêm Banner Mới
          </Button>
          <Button onClick={fetchBanners} variant="outline" size="sm" className="gap-1.5">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Banner Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-muted-foreground text-sm">Đang tải danh sách banner từ database...</div>
      ) : banners.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground text-sm">Chưa có banner nào trong database.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {banners.map((b) => (
            <Card key={b.id} className="overflow-hidden group hover:border-primary/50 transition-colors">
              <div className="h-48 relative overflow-hidden bg-muted">
                <img src={b.imageUrl} alt={b.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute top-3 right-3">
                  <Badge variant={b.isActive ? 'default' : 'secondary'} className={b.isActive ? 'bg-emerald-600' : ''}>
                    {b.isActive ? 'Hiển thị' : 'Đang ẩn'}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-4 space-y-2">
                <h3 className="font-bold text-base text-foreground line-clamp-1">{b.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-1">{b.subtitle}</p>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <Button variant="outline" size="sm" onClick={() => handleToggleStatus(b.id)} className="text-xs">
                    {b.isActive ? 'Ẩn Banner' : 'Bật Hiển Thị'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(b.id)} className="text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Thêm Banner */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-base text-foreground">Thêm Banner Trang Chủ Mới</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>✕</Button>
            </div>

            <form onSubmit={handleCreateBanner} className="space-y-4">
              <div>
                <Label htmlFor="bTitle" className="text-xs font-semibold">Tiêu đề Banner *</Label>
                <Input
                  id="bTitle"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Chào Hè 2026 - Mở Kho Sách Số 10.000đ"
                />
              </div>

              <div>
                <Label htmlFor="bSub" className="text-xs font-semibold">Mô tả ngắn (Subtitle)</Label>
                <Input
                  id="bSub"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="VD: Đọc không giới hạn kho sách bản quyền..."
                />
              </div>

              <div>
                <Label htmlFor="bImg" className="text-xs font-semibold">URL Ảnh Cloudinary Banner *</Label>
                <Input
                  id="bImg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://res.cloudinary.com/..."
                  className="font-mono text-xs"
                />
              </div>

              <div>
                <Label htmlFor="bLink" className="text-xs font-semibold">Đường dẫn khi click (Link URL)</Label>
                <Input
                  id="bLink"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="/books"
                  className="font-mono text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Hủy</Button>
                <Button type="submit">Lưu Banner</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
