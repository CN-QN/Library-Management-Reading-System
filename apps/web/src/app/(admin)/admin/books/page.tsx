'use client';

import React, { useEffect, useState } from 'react';
import { BookOpen, Plus, Search, Edit, Trash2, Upload, DollarSign, Check, AlertCircle, Image as ImageIcon } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

interface BookItem {
  id: string;
  title: string;
  slug: string;
  isbn?: string;
  summary?: string;
  accessType: string;
  price: number;
  status: string;
  coverAssetId?: string;
  totalChapters: number;
}

export default function AdminBooksPage() {
  const [books, setBooks] = useState<BookItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingBook, setEditingBook] = useState<BookItem | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [isbn, setIsbn] = useState('');
  const [accessType, setAccessType] = useState('PAID');
  const [price, setPrice] = useState(10000);
  const [coverUrl, setCoverUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const fetchBooks = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/books?pageSize=50');
      const data = res.data?.data?.items || res.data?.data || [];
      setBooks(data);
    } catch (err) {
      console.error('Lỗi khi lấy danh sách sách:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const openCreateModal = () => {
    setEditingBook(null);
    setTitle('');
    setSlug('');
    setIsbn('');
    setAccessType('PAID');
    setPrice(10000);
    setCoverUrl('');
    setSummary('');
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (book: BookItem) => {
    setEditingBook(book);
    setTitle(book.title);
    setSlug(book.slug);
    setIsbn(book.isbn || '');
    setAccessType(book.accessType || 'PAID');
    setPrice(book.price || 10000);
    setCoverUrl(book.coverAssetId || '');
    setSummary(book.summary || '');
    setErrors({});
    setIsModalOpen(true);
  };

  // Tải ảnh trực tiếp lên Cloudinary Demo Unsigned Preset
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate kích thước & đuôi file
    if (file.size > 10 * 1024 * 1024) {
      alert('Kích thước ảnh bìa không được vượt quá 10 MB');
      return;
    }

    setIsUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'ml_default');

      const res = await fetch('https://api.cloudinary.com/v1_1/demo/image/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.secure_url) {
        setCoverUrl(data.secure_url);
      } else {
        // Fallback Base64 preview nếu Cloudinary demo bận
        const reader = new FileReader();
        reader.onloadend = () => {
          setCoverUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    } catch {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingCover(false);
    }
  };

  // Validation Form đầy đủ
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Tên sách không được để trống';
    } else if (title.trim().length < 2 || title.trim().length > 200) {
      newErrors.title = 'Tên sách phải từ 2 đến 200 ký tự';
    }

    if (!slug.trim()) {
      newErrors.slug = 'Slug đường dẫn không được để trống';
    } else if (!/^[a-z0-9-]+$/.test(slug)) {
      newErrors.slug = 'Slug chỉ được chứa chữ cái thường, số và dấu gạch ngang (VD: dac-nhan-tam)';
    }

    if (price < 0) {
      newErrors.price = 'Giá sách không được là số âm';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      title,
      slug,
      isbn: isbn || undefined,
      summary,
      accessType,
      price: Number(price),
      coverAssetId: coverUrl || undefined,
      status: 'PUBLISHED',
    };

    try {
      if (editingBook) {
        await apiClient.put(`/books/${editingBook.id}`, payload);
      } else {
        await apiClient.post('/books', payload);
      }
      setIsModalOpen(false);
      fetchBooks();
    } catch (err) {
      alert('Không thể lưu sách. Vui lòng kiểm tra lại thông tin.');
    }
  };

  const filteredBooks = books.filter((b) =>
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Quản Lý Sách & Nội Dung Trực Tuyến</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Thêm mới và chỉnh sửa thông tin sách, tích hợp **Rich Text Editor** và **Tải ảnh bìa Cloudinary**.
          </p>
        </div>

        <Button onClick={openCreateModal} className="gap-1.5 self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          Thêm Sách Mới
        </Button>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo Tên sách hoặc Slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Book Catalog Table */}
      <Card>
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Danh Sách Sách Số ({filteredBooks.length})
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="py-16 text-center text-muted-foreground text-sm">Đang tải danh sách sách...</div>
          ) : filteredBooks.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">Không tìm thấy sách nào.</div>
          ) : (
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-muted/40 text-muted-foreground text-xs uppercase font-semibold border-b border-border">
                <tr>
                  <th className="px-4 py-3">Sách & Ảnh bìa</th>
                  <th className="px-4 py-3">Loại Sách</th>
                  <th className="px-4 py-3">Giá bán</th>
                  <th className="px-4 py-3">Số chương</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredBooks.map((book) => {
                  const isPaid = book.accessType === 'PAID' || book.accessType === 'PREMIUM';

                  return (
                    <tr key={book.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3.5 flex items-center gap-3">
                        <div className="h-12 w-9 rounded overflow-hidden bg-muted border border-border shrink-0">
                          {book.coverAssetId ? (
                            <img src={book.coverAssetId} alt={book.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                              <ImageIcon className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="font-semibold text-foreground block line-clamp-1">{book.title}</span>
                          <span className="text-[11px] font-mono text-muted-foreground">/{book.slug}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <Badge variant={isPaid ? 'default' : 'secondary'} className={isPaid ? 'bg-amber-600 hover:bg-amber-700' : ''}>
                          {isPaid ? 'PAID' : 'FREE'}
                        </Badge>
                      </td>

                      <td className="px-4 py-3.5 font-semibold text-foreground">
                        {isPaid ? `${(book.price || 10000).toLocaleString('vi-VN')} VNĐ` : 'Miễn phí'}
                      </td>

                      <td className="px-4 py-3.5 font-medium">{book.totalChapters || 0} chương</td>

                      <td className="px-4 py-3.5 text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(book)} className="gap-1 text-xs">
                          <Edit className="h-3.5 w-3.5" />
                          Sửa
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

      {/* Modal Add / Edit Book */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-lg text-foreground">
                {editingBook ? 'Chỉnh Sửa Sách' : 'Thêm Sách Mới'}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                ✕
              </Button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <Label htmlFor="title" className="text-xs font-semibold">Tên sách *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!editingBook) {
                      setSlug(e.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));
                    }
                  }}
                  placeholder="Nhập tên sách..."
                  className={errors.title ? 'border-destructive' : ''}
                />
                {errors.title && <p className="text-xs text-destructive mt-1">{errors.title}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="slug" className="text-xs font-semibold">Slug đường dẫn *</Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="dac-nhan-tam"
                    className={errors.slug ? 'border-destructive font-mono text-xs' : 'font-mono text-xs'}
                  />
                  {errors.slug && <p className="text-xs text-destructive mt-1">{errors.slug}</p>}
                </div>

                <div>
                  <Label htmlFor="isbn" className="text-xs font-semibold">Mã ISBN</Label>
                  <Input
                    id="isbn"
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    placeholder="978-3-16-148410-0"
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 rounded-lg bg-muted/30 border border-border">
                <div>
                  <Label className="text-xs font-semibold block mb-1.5">Loại sách</Label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                      <input
                        type="radio"
                        name="accessType"
                        value="PAID"
                        checked={accessType === 'PAID'}
                        onChange={() => {
                          setAccessType('PAID');
                          setPrice(10000);
                        }}
                      />
                      <span>PAID (Trả phí SePay)</span>
                    </label>

                    <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                      <input
                        type="radio"
                        name="accessType"
                        value="FREE"
                        checked={accessType === 'FREE'}
                        onChange={() => {
                          setAccessType('FREE');
                          setPrice(0);
                        }}
                      />
                      <span>FREE (Miễn phí)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="price" className="text-xs font-semibold">Giá bán (VNĐ)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    disabled={accessType === 'FREE'}
                    className="font-semibold text-primary"
                  />
                </div>
              </div>

              {/* Cover Image Upload */}
              <div>
                <Label className="text-xs font-semibold block mb-1">Ảnh bìa Cloudinary</Label>
                <div className="flex items-center gap-3">
                  {coverUrl && (
                    <img src={coverUrl} alt="Cover Preview" className="h-16 w-12 object-cover rounded border border-border" />
                  )}
                  <div className="flex-1">
                    <Input
                      value={coverUrl}
                      onChange={(e) => setCoverUrl(e.target.value)}
                      placeholder="Dán URL ảnh hoặc tải từ máy tính..."
                      className="text-xs font-mono mb-1.5"
                    />
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer transition-colors">
                      <Upload className="h-3.5 w-3.5" />
                      {isUploadingCover ? 'Đang tải lên Cloudinary...' : 'Chọn tệp ảnh tải lên Cloudinary'}
                      <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Rich Text Editor for Summary */}
              <div>
                <Label className="text-xs font-semibold block mb-1">Tóm tắt & Nội dung (Rich Text Editor)</Label>
                <RichTextEditor value={summary} onChange={setSummary} placeholder="Soạn thảo tóm tắt nội dung cuốn sách..." />
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit">Lưu thông tin</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
