'use client';

import React, { useState } from 'react';
import apiClient from '@/lib/api-client';
import { Image as ImageIcon, Upload, Copy, Check, Trash2, Folder, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface MediaAsset {
  id: string;
  url: string;
  name: string;
  size: string;
  createdAt: string;
  category: 'COVERS' | 'BANNERS' | 'AVATARS' | 'AUTHORS';
}

const CATEGORY_MAP: Record<string, string> = {
  ALL: 'Tất cả media',
  COVERS: 'Bìa Sách',
  BANNERS: 'Banner Trang Chủ',
  AVATARS: 'Avatar Độc Giả',
  AUTHORS: 'Ảnh Tác Giả',
};

export default function AdminMediaPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Demo Media Assets với Thể Loại
  const [assets, setAssets] = useState<MediaAsset[]>([
    {
      id: '1',
      url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=800',
      name: 'dac_nhan_tam_cover.jpg',
      size: '1.2 MB',
      createdAt: '2026-08-01',
      category: 'COVERS',
    },
    {
      id: '2',
      url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=800',
      name: 'nha_gia_kim_cover.jpg',
      size: '850 KB',
      createdAt: '2026-08-02',
      category: 'COVERS',
    },
    {
      id: '3',
      url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800',
      name: 'banner_library_2026.png',
      size: '3.4 MB',
      createdAt: '2026-08-05',
      category: 'BANNERS',
    },
    {
      id: '4',
      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800',
      name: 'avatar_admin_default.jpg',
      size: '420 KB',
      createdAt: '2026-08-06',
      category: 'AVATARS',
    },
  ]);

  const processFilesUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);

    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) continue;

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'ml_default');

        const res = await fetch('https://api.cloudinary.com/v1_1/demo/image/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        const newUrl = data.secure_url || URL.createObjectURL(file);

        const newAsset: MediaAsset = {
          id: Date.now().toString() + Math.random(),
          url: newUrl,
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          createdAt: new Date().toISOString().split('T')[0],
          category: activeCategory === 'ALL' ? 'COVERS' : (activeCategory as any),
        };

        setAssets((prev) => [newAsset, ...prev]);
      } catch {
        const newAsset: MediaAsset = {
          id: Date.now().toString() + Math.random(),
          url: URL.createObjectURL(file),
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          createdAt: new Date().toISOString().split('T')[0],
          category: 'COVERS',
        };
        setAssets((prev) => [newAsset, ...prev]);
      }
    }
    setIsUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      processFilesUpload(e.dataTransfer.files);
    }
  };

  const copyToClipboard = (asset: MediaAsset) => {
    navigator.clipboard.writeText(asset.url);
    setCopiedId(asset.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (asset: MediaAsset) => {
    if (confirm(`Bạn có chắc muốn xóa ảnh "${asset.name}" khỏi Cloudinary?`)) {
      try {
        await apiClient.post('/media/delete-cloudinary', { publicId: asset.url });
      } catch {}
      setAssets((prev) => prev.filter((a) => a.id !== asset.id));
    }
  };

  const filteredAssets = assets.filter(
    (a) => activeCategory === 'ALL' || a.category === activeCategory
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Thư Viện Media Cloudinary Tập Trung</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Phân loại hình ảnh theo thể loại (Bìa sách, Banner, Avatar) và kéo-thả (Drag & Drop) tải lên Cloudinary.
          </p>
        </div>

        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 cursor-pointer shadow-sm transition-colors self-start sm:self-auto">
          <Upload className="h-4 w-4" />
          {isUploading ? 'Đang tải lên Cloudinary...' : 'Tải Ảnh Mới Lên Cloudinary'}
          <input type="file" multiple accept="image/*" onChange={(e) => e.target.files && processFilesUpload(e.target.files)} className="hidden" />
        </label>
      </div>

      {/* Category Tabs */}
      <Card>
        <CardContent className="p-4 flex items-center gap-2 overflow-x-auto">
          {Object.entries(CATEGORY_MAP).map(([code, label]) => (
            <Button
              key={code}
              variant={activeCategory === code ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(code)}
              className="text-xs font-medium shrink-0 gap-1.5"
            >
              <Folder className="h-3.5 w-3.5" />
              {label}
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Drag & Drop Zone */}
      <Card
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`border-dashed border-2 transition-colors cursor-pointer ${
          isDragOver ? 'border-primary bg-primary/10' : 'border-primary/30 bg-primary/5 hover:border-primary'
        }`}
      >
        <CardContent className="p-8 text-center flex flex-col items-center justify-center">
          <div className="p-3 rounded-full bg-primary/10 text-primary mb-3">
            <Upload className="h-8 w-8" />
          </div>
          <h3 className="font-bold text-base text-foreground mb-1">
            Kéo và thả nhiều tệp hình ảnh vào đây để tải lên Cloudinary
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm">
            Hỗ trợ PNG, JPG, JPEG, WEBP. Ảnh sẽ tự động phân loại vào thư mục đang chọn.
          </p>
        </CardContent>
      </Card>

      {/* Media Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredAssets.map((asset) => (
          <Card key={asset.id} className="overflow-hidden group hover:border-primary/50 transition-colors">
            <div className="h-48 bg-muted relative overflow-hidden flex items-center justify-center">
              <img src={asset.url} alt={asset.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button size="icon" variant="secondary" onClick={() => copyToClipboard(asset)} title="Sao chép URL">
                  {copiedId === asset.id ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button size="icon" variant="destructive" onClick={() => handleDelete(asset)} title="Xóa">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <CardContent className="p-3">
              <span className="font-medium text-xs text-foreground block truncate" title={asset.name}>
                {asset.name}
              </span>
              <div className="flex items-center justify-between mt-1 text-[11px] text-muted-foreground">
                <span>{asset.size}</span>
                <Badge variant="outline" className="text-[10px] py-0">
                  {CATEGORY_MAP[asset.category] || asset.category}
                </Badge>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2 gap-1.5 text-xs h-8"
                onClick={() => copyToClipboard(asset)}
              >
                {copiedId === asset.id ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    Đã chép URL
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Sao chép URL Cloudinary
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
