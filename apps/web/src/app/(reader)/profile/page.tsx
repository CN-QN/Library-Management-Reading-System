'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  BookOpen,
  History,
  BookmarkCheck,
  Clock,
  ArrowRight,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  BookMarked,
  ShieldCheck,
  Mail,
  X,
} from 'lucide-react';

import { useAuthStore } from '@/store/auth-store';
import {
  getMyReadingProgress,
  getMyReadingHistory,
  getMyBorrowedBooks,
  InProgressBook,
  ReadingHistoryItem,
  BorrowedBook,
  updateProfile,
} from '@/lib/api/profile';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { buttonVariants, Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ProfilePage() {
  const { user, checkAuth } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'reading' | 'history' | 'borrowed'>('reading');
  const [inProgressBooks, setInProgressBooks] = useState<InProgressBook[]>([]);
  const [readingHistory, setReadingHistory] = useState<ReadingHistoryItem[]>([]);
  const [borrowedBooks, setBorrowedBooks] = useState<BorrowedBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Profile modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
    }
  }, [user]);

  useEffect(() => {
    async function loadStudentData() {
      setIsLoading(true);
      try {
        const [progressData, historyData, loansData] = await Promise.all([
          getMyReadingProgress(),
          getMyReadingHistory(),
          getMyBorrowedBooks(),
        ]);
        setInProgressBooks(progressData);
        setReadingHistory(historyData);
        setBorrowedBooks(loansData);
      } catch (err) {
        console.error('Failed to load profile data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadStudentData();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setUpdateMessage(null);

    try {
      await updateProfile({ firstName, lastName });
      await checkAuth();
      setUpdateMessage('Cập nhật thông tin thành công!');
      setTimeout(() => {
        setIsEditModalOpen(false);
        setUpdateMessage(null);
      }, 1200);
    } catch (err) {
      console.error('Update profile error:', err);
      setUpdateMessage('Không thể cập nhật hồ sơ. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateDaysLeft = (dueDateStr: string) => {
    const due = new Date(dueDateStr);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto">
      {/* Profile Header Banner */}
      <div className="bg-gradient-to-r from-primary/15 via-primary/5 to-background border rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <Avatar className="w-20 h-20 border-2 border-primary/30 shadow-md">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                {user?.firstName?.[0] || 'S'}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {user ? `${user.firstName} ${user.lastName}` : 'Sinh viên'}
                </h1>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  {user?.role || 'STUDENT'}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-muted-foreground pt-1">
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  {user?.email || 'student@libraryhub.com'}
                </span>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            className="border-primary/30 hover:bg-primary/10"
            onClick={() => setIsEditModalOpen(true)}
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Sửa hồ sơ
          </Button>
        </div>
      </div>

      {/* Reading Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card/80 border-border/60">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Sách đang đọc
              </p>
              <h3 className="text-2xl font-bold">{inProgressBooks.length}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/80 border-border/60">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
              <BookmarkCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Đã hoàn thành
              </p>
              <h3 className="text-2xl font-bold">{readingHistory.length}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/80 border-border/60">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl">
              <BookMarked className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Sách đang mượn
              </p>
              <h3 className="text-2xl font-bold">{borrowedBooks.length}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Custom Tabs Navigation */}
      <div className="border-b flex gap-6">
        <button
          onClick={() => setActiveTab('reading')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'reading'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Sách đang đọc ({inProgressBooks.length})
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <History className="w-4 h-4" />
          Lịch sử đọc ({readingHistory.length})
        </button>

        <button
          onClick={() => setActiveTab('borrowed')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'borrowed'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <BookMarked className="w-4 h-4" />
          Sách mượn vật lý ({borrowedBooks.length})
        </button>
      </div>

      {/* Tab Content 1: Sách đang đọc */}
      {activeTab === 'reading' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-xl"></div>
              ))}
            </div>
          ) : inProgressBooks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inProgressBooks.map((item) => (
                <Card key={item.bookId} className="hover:border-primary/40 transition-all bg-card">
                  <CardContent className="p-5 flex gap-4">
                    <div className="relative w-16 h-24 bg-muted rounded-md overflow-hidden shrink-0">
                      {item.book.coverImage ? (
                        <Image
                          src={item.book.coverImage}
                          alt={item.book.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground bg-secondary">
                          No Cover
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        <h3 className="font-semibold text-base line-clamp-1">{item.book.title}</h3>
                        <p className="text-xs text-muted-foreground">{item.book.author}</p>
                        {item.chapterTitle && (
                          <p className="text-xs font-medium text-primary mt-1">
                            {item.chapterTitle}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground font-mono">
                          <span>Tiến trình</span>
                          <span className="font-semibold text-foreground">
                            {Math.round(item.progressPercentage)}%
                          </span>
                        </div>
                        <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-primary h-full transition-all duration-500 rounded-full"
                            style={{ width: `${Math.min(100, Math.max(0, item.progressPercentage))}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="pt-1 flex justify-end">
                        <Link
                          href={`/read/${item.bookId}/${item.chapterId || 'latest'}`}
                          className={buttonVariants({ size: 'sm', className: 'h-8 font-medium' })}
                        >
                          Đọc tiếp <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-xl border border-dashed p-8 space-y-3">
              <BookOpen className="w-10 h-10 text-muted-foreground mx-auto" />
              <h4 className="font-semibold">Bạn chưa có cuốn sách nào đang đọc</h4>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Hãy khám phá thư viện và bắt đầu đọc những tác phẩm yêu thích của bạn.
              </p>
              <Link href="/categories" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                Khám phá thể loại
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Tab Content 2: Lịch sử đọc */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {readingHistory.length > 0 ? (
            <div className="space-y-3">
              {readingHistory.map((item) => (
                <Card key={item.id} className="bg-card">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-lg shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{item.book.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          Hoàn thành ngày {new Date(item.completedAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/books/${item.bookId}`}
                      className={buttonVariants({ variant: 'ghost', size: 'sm' })}
                    >
                      Chi tiết sách
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-xl border border-dashed p-8 space-y-2">
              <History className="w-10 h-10 text-muted-foreground mx-auto" />
              <h4 className="font-semibold">Chưa có lịch sử đọc hoàn thành</h4>
              <p className="text-xs text-muted-foreground">
                Các cuốn sách bạn đọc xong sẽ tự động được ghi nhận tại đây.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab Content 3: Sách mượn vật lý */}
      {activeTab === 'borrowed' && (
        <div className="space-y-4">
          {borrowedBooks.length > 0 ? (
            <div className="space-y-3">
              {borrowedBooks.map((loan) => {
                const daysLeft = calculateDaysLeft(loan.dueAt);
                const isOverdue = daysLeft < 0;

                return (
                  <Card key={loan.id} className="bg-card">
                    <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0">
                          <BookMarked className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-base">{loan.bookTitle}</h4>
                          <p className="text-xs text-muted-foreground font-mono">
                            Mã bản sao (Barcode): {loan.barcode}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                            <span>Mượn: {new Date(loan.borrowedAt).toLocaleDateString('vi-VN')}</span>
                            <span>Hạn trả: {new Date(loan.dueAt).toLocaleDateString('vi-VN')}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        {isOverdue ? (
                          <Badge variant="destructive" className="flex items-center gap-1 py-1 px-3">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Quá hạn {Math.abs(daysLeft)} ngày
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-emerald-500 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 py-1 px-3"
                          >
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            Còn {daysLeft} ngày
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-xl border border-dashed p-8 space-y-2">
              <BookMarked className="w-10 h-10 text-muted-foreground mx-auto" />
              <h4 className="font-semibold">Bạn hiện không mượn sách vật lý nào</h4>
              <p className="text-xs text-muted-foreground">
                Đến chi nhánh thư viện gần nhất để mượn bản sao vật lý.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border rounded-2xl w-full max-w-md p-6 space-y-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-bold">Chỉnh sửa hồ sơ</h3>
              <p className="text-xs text-muted-foreground">
                Cập nhật thông tin cá nhân của bạn trên hệ thống LibraryHub.
              </p>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Họ và Tên đệm</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Tên</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>

              {updateMessage && (
                <div
                  className={`text-xs p-3 rounded-lg ${
                    updateMessage.includes('thành công')
                      ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                      : 'bg-destructive/10 text-destructive'
                  }`}
                >
                  {updateMessage}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
