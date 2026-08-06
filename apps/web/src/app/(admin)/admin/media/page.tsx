'use client';

import React, { useState } from 'react';
import apiClient from '@/lib/api-client';
import { Image as ImageIcon, Upload, Copy, Check, Trash2, ExternalLink, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface MediaAsset {
  id: string;
  url: string;
  name: string;
  size: string;
  createdAt: string;
  type: string;
}

export default function AdminMediaPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Initial Demo Media Assets
  const [assets, setAssets] = useState<MediaAsset[]>([
    {
      id: '1',
      url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=800',
      name: 'dac_nhan_tam_cover.jpg',
      size: '1.2 MB',
      createdAt: '2026-08-01',
      type: 'Book Cover',
    },
    {
      id: '2',
      url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=800',
      name: 'nha_gia_kim_cover.jpg',
      size: '850 KB',
      createdAt: '2026-08-02',
      type: 'Book Cover',
    },
    {
      id: '3',
      url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=800',
      name: 'tuoi_tre_dang_gia_bao_nhieu.jpg',
      size: '2.1 MB',
      createdAt: '2026-08-03',
      type: 'Book Cover',
    },
    {
      id: '4',
      url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800',
      name: 'banner_library_2026.png',
      size: '3.4 MB',
      createdAt: '2026-08-05',
      type: 'Banner',
    },
  ]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > 10 * 1024 * 1024) {
      alert('Kích thước ảnh không được vượt quá 10 MB');
      return;
    }

    setIsUploading(true);
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
        id: Date.now().toString(),
        url: newUrl,
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        createdAt: new Date().toISOString().split('T')[0],
        type: 'Uploaded',
      };

      setAssets((prev) => [newAsset, ...prev]);
    } catch {
      const newAsset: MediaAsset = {
        id: Date.now().toString(),
        url: URL.createObjectURL(file),
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        createdAt: new Date().toISOString().split('T')[0],
        type: 'Local Preview',
      };
      setAssets((prev) => [newAsset, ...prev]);
    } finally {
      setIsUploading(false);
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
        setAssets((prev) => prev.filter((a) => a.id !== asset.id));
      } catch {
        setAssets((prev) => prev.filter((a) => a.id !== asset.id));
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Thư Viện Media Cloudinary Tập Trung</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý tập trung tất cả hình ảnh bìa sách, banner quảng cáo và ảnh đại diện độc giả.
          </p>
        </div>

        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 cursor-pointer shadow-sm transition-colors self-start sm:self-auto">
          <Upload className="h-4 w-4" />
          {isUploading ? 'Đang tải lên Cloudinary...' : 'Tải Ảnh Mới Lên Cloudinary'}
          <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        </label>
      </div>

      {/* Drag & Drop Upload Zone */}
      <Card className="border-dashed border-2 border-primary/30 bg-primary/5 hover:border-primary transition-colors">
        <CardContent className="p-8 text-center flex flex-col items-center justify-center">
          <div className="p-3 rounded-full bg-primary/10 text-primary mb-3">
            <Upload className="h-8 w-8" />
          </div>
          <h3 className="font-bold text-base text-foreground mb-1">
            Kéo và thả tệp hình ảnh vào đây để tải lên Cloudinary
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mb-4">
            Hỗ trợ định dạng PNG, JPG, JPEG, WEBP. Kích thước tối đa 10 MB/tệp.
          </p>
        </CardContent>
      </Card>

      {/* Media Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {assets.map((asset) => (
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
                  {asset.type}
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
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
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
