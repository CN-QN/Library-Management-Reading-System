'use client';

import React, { useState } from 'react';
import { Settings, CreditCard, Save, CheckCircle2, Shield, Globe, Bell, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function AdminSettingsPage() {
  const [bankName, setBankName] = useState('VietinBank');
  const [bankAccount, setBankAccount] = useState('105886719416');
  const [accountName, setAccountName] = useState('THU VIEN LIBRARYHUB');
  const [apiKey, setApiKey] = useState('SePayApiKeySecret2026');
  const [defaultPrice, setDefaultPrice] = useState(10000);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Cấu Hình Web & Cổng Thanh Toán SePay</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Thiết lập thông tin tài khoản ngân hàng kết nối SePay VietQR, giá bán sách số và cấu hình hệ thống.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* SePay Config Card */}
        <Card className="border-primary/20">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Cấu Hình Cổng Thanh Toán SePay VietQR
            </CardTitle>
            <CardDescription className="text-xs">
              Các thông tin này dùng để sinh mã VietQR động 10.000 VNĐ và xác thực Webhook tự động từ SePay.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bankName" className="text-xs font-semibold">Tên Ngân hàng (Mã VietQR) *</Label>
                <Input
                  id="bankName"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="MBBank, VietinBank, Vietcombank, ACB..."
                />
              </div>

              <div>
                <Label htmlFor="bankAccount" className="text-xs font-semibold">Số tài khoản Ngân hàng *</Label>
                <Input
                  id="bankAccount"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="accountName" className="text-xs font-semibold">Tên Chủ tài khoản hiển thị *</Label>
                <Input
                  id="accountName"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="apiKey" className="text-xs font-semibold">SePay Secret Token (API Key) *</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cloudinary Config Card */}
        <Card className="border-sky-500/20">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-sky-500" />
              Cấu Hình Thư Viện Ảnh Cloudinary (Tải & Xóa Ảnh Server)
            </CardTitle>
            <CardDescription className="text-xs">
              Điền thông tin tài khoản Cloudinary của bạn tại đây để tải ảnh bìa và hỗ trợ xóa ảnh trực tiếp trên Cloudinary.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cloudName" className="text-xs font-semibold">Cloud Name *</Label>
                <Input
                  id="cloudName"
                  value="demo"
                  placeholder="tên_cloud_name_của_bạn"
                  className="font-mono text-xs"
                />
              </div>

              <div>
                <Label htmlFor="uploadPreset" className="text-xs font-semibold">Upload Preset *</Label>
                <Input
                  id="uploadPreset"
                  value="ml_default"
                  placeholder="ml_default"
                  className="font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cApiKey" className="text-xs font-semibold">Cloudinary API Key *</Label>
                <Input
                  id="cApiKey"
                  placeholder="Dán API Key từ Cloudinary Dashboard..."
                  className="font-mono text-xs"
                />
              </div>

              <div>
                <Label htmlFor="cApiSecret" className="text-xs font-semibold">Cloudinary API Secret (Dùng để Xóa ảnh) *</Label>
                <Input
                  id="cApiSecret"
                  type="password"
                  placeholder="Dán API Secret từ Cloudinary Dashboard..."
                  className="font-mono text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Config Card */}
        <Card>
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Cấu Hình Giá Bán Sách Số & Đơn Vị Tiền Tệ
            </CardTitle>
          </CardHeader>

          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="defaultPrice" className="text-xs font-semibold">Giá bán mặc định cho Sách PAID (VNĐ)</Label>
                <Input
                  id="defaultPrice"
                  type="number"
                  value={defaultPrice}
                  onChange={(e) => setDefaultPrice(Number(e.target.value))}
                  className="font-bold text-primary"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Đơn vị tiền tệ mặc định</Label>
                <Input value="VNĐ (Việt Nam Đồng)" disabled className="bg-muted text-xs" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex items-center gap-3">
          <Button type="submit" size="lg" className="gap-2">
            <Save className="h-4 w-4" />
            Lưu Cấu Hình
          </Button>

          {isSaved && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              Đã lưu cấu hình thành công!
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
