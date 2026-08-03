'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, LogIn, AlertCircle } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { ReviewSummary } from './reviews/ReviewSummary';
import { ReviewForm } from './reviews/ReviewForm';
import { UserReviewCard } from './reviews/UserReviewCard';
import { ReviewItem } from './reviews/ReviewItem';
import { ReviewListSkeleton } from './reviews/ReviewListSkeleton';

/**
 * Thuật toán tính toán dải số trang hiển thị gọn gàng (windowing),
 * ngăn chặn tràn giao diện khi số trang lớn (ví dụ > 7 trang) bằng cách chèn dấu ba chấm '...'.
 */
function getVisiblePages(current: number, total: number): (number | string)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, '...', total];
  }
  if (current >= total - 3) {
    return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, '...', current - 1, current, current + 1, '...', total];
}
import { ReviewEmptyState } from './reviews/ReviewEmptyState';
import {
  getReviews,
  getReviewStats,
  getUserReview,
  createReview,
  updateReview,
  deleteReview,
} from '@/lib/api/reviews';
import { useAuthStore } from '@/store/auth-store';
import type { Review, ReviewStats } from '@/types/Review';

/**
 * Thuộc tính đầu vào của component ReviewsSection.
 */
export interface ReviewsSectionProps {
  /** ID cuốn sách cần quản lý đánh giá & nhận xét */
  bookId: string;
  /** ID người dùng (optional - ưu tiên tự động lấy từ useAuthStore) */
  userId?: string | null;
  /** Tên hiển thị người dùng (optional - ưu tiên tự động lấy từ useAuthStore) */
  userDisplayName?: string | null;
  /** Callback thông báo điểm số trung bình và tổng lượt đánh giá ngược lên component cha khi có thay đổi */
  onStatsChange?: (averageRating: number, totalReviews: number) => void;
}

/**
 * ReviewsSection - Component chính quản lý toàn bộ khu vực Đánh giá & Nhận xét của sách.
 * 
 * Chức năng:
 * 1. Hiển thị bảng tổng quan điểm trung bình và phân bổ số sao (ReviewSummary).
 * 2. Phân quyền người dùng: 
 *    - Khách chưa đăng nhập -> Hiển thị banner CTA điều hướng sang trang /login kèm returnUrl.
 *    - Người dùng đã đăng nhập chưa có review -> Hiển thị form tạo đánh giá mới (ReviewForm).
 *    - Người dùng đã có review -> Hiển thị thẻ bài đánh giá cá nhân (UserReviewCard) kèm khả năng chỉnh sửa/xóa.
 * 3. Hiển thị danh sách đánh giá cộng đồng (ReviewItem) kèm bộ lọc số sao, sắp xếp và phân trang.
 * 4. Phát sự kiện callback `onStatsChange` thông báo lên component cha để cập nhật UI thời gian thực.
 *
 * Dùng ở: Trang chi tiết sách của độc giả (`/books/[id]`).
 *
 * @param bookId - ID của cuốn sách
 * @param userId - ID người dùng (optional fallback)
 * @param userDisplayName - Tên hiển thị người dùng (optional fallback)
 * @param onStatsChange - Callback cập nhật thống kê rating lên component cha
 */
export function ReviewsSection({
  bookId,
  userId,
  userDisplayName,
  onStatsChange,
}: ReviewsSectionProps) {
  // Lấy thông tin xác thực từ Zustand Auth Store
  const { user, isAuthenticated } = useAuthStore();

  // Xác định ID và thông tin người dùng active.
  // Lý do: Ưu tiên dữ liệu chính xác từ useAuthStore, fallback về props nếu props được truyền trực tiếp từ SSR parent component.
  const activeUserId = user?.id || userId || null;
  const isUserLoggedIn = isAuthenticated || Boolean(activeUserId);
  const activeUserName = user
    ? `${user.firstName} ${user.lastName}`.trim() || user.email
    : userDisplayName || 'Độc giả';
  const activeUserEmail = user?.email || '';

  // State lưu trữ dữ liệu thống kê tổng quan (điểm trung bình, phân bổ 1-5 sao)
  const [stats, setStats] = useState<ReviewStats | null>(null);

  // State lưu trữ danh sách các bài đánh giá ở trang hiện tại
  const [reviews, setReviews] = useState<Review[]>([]);

  // State lưu trữ bài đánh giá của chính người dùng hiện tại đối với cuốn sách này (nếu có)
  const [userReview, setUserReview] = useState<Review | null>(null);

  // Trạng thái bật/tắt form chỉnh sửa bài đánh giá cá nhân
  const [isEditingUserReview, setIsEditingUserReview] = useState<boolean>(false);

  // State phân trang
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  // State bộ lọc sao ('all' hoặc 1..5) và tiêu chí sắp xếp ('newest' | 'highest' | 'lowest')
  const [ratingFilter, setRatingFilter] = useState<1 | 2 | 3 | 4 | 5 | 'all'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest'>('newest');

  // Trạng thái tải dữ liệu bất đồng bộ
  const [isLoadingReviews, setIsLoadingReviews] = useState<boolean>(true);
  const [, setIsLoadingStats] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Luồng fetch stats & live stats callback:
   * Lấy thông tin thống kê điểm trung bình và phân bổ số sao từ API.
   * Đồng thời gọi callback `onStatsChange` để cập nhật rating trên header trang chi tiết sách mà không cần reload trang.
   */
  const loadStats = useCallback(async () => {
    try {
      const data = await getReviewStats(bookId);
      setStats(data);
      // Live stats callback: Thông báo ngược lên component cha ngay khi thống kê thay đổi
      if (onStatsChange) {
        onStatsChange(data.averageRating, data.totalReviews);
      }
    } catch (error) {
      console.error('Lỗi khi tải thống kê đánh giá:', error);
    } finally {
      setIsLoadingStats(false);
    }
  }, [bookId, onStatsChange]);

  /**
   * Luồng fetch user review:
   * Lấy bài đánh giá của người dùng hiện tại (nếu đã đăng nhập).
   * Quyết định xem giao diện sẽ hiển thị `UserReviewCard` hay `ReviewForm`.
   */
  const loadUserReview = useCallback(async () => {
    if (!activeUserId) {
      setUserReview(null);
      return;
    }
    try {
      const data = await getUserReview(bookId, activeUserId);
      setUserReview(data);
    } catch (error) {
      console.error('Lỗi khi tải bài đánh giá cá nhân:', error);
    }
  }, [bookId, activeUserId]);

  /**
   * Luồng fetch reviews:
   * Lấy danh sách các bài đánh giá cộng đồng theo trang, số sao cần lọc và tiêu chí sắp xếp.
   */
  const loadReviews = useCallback(async () => {
    try {
      const response = await getReviews({
        bookId,
        page,
        limit: 5,
        ratingFilter,
        sortBy,
      });
      setReviews(response.items);
      setTotalPages(response.totalPages);
      setTotalItems(response.totalItems);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Không thể tải danh sách bài đánh giá.';
      setErrorMessage(msg);
    } finally {
      setIsLoadingReviews(false);
    }
  }, [bookId, page, ratingFilter, sortBy]);

  // useEffect đồng bộ dữ liệu thống kê và bài đánh giá cá nhân khi cuốn sách hoặc tài khoản đăng nhập thay đổi.
  useEffect(() => {
    let ignore = false;
    Promise.resolve().then(() => {
      if (!ignore) {
        setIsLoadingStats(true);
        loadStats();
        loadUserReview();
      }
    });
    return () => {
      ignore = true;
    };
  }, [loadStats, loadUserReview]);

  // useEffect tự động tải lại danh sách đánh giá mỗi khi người dùng đổi trang, bộ lọc số sao hoặc kiểu sắp xếp.
  useEffect(() => {
    let ignore = false;
    Promise.resolve().then(() => {
      if (!ignore) {
        setIsLoadingReviews(true);
        setErrorMessage(null);
        loadReviews();
      }
    });
    return () => {
      ignore = true;
    };
  }, [loadReviews]);

  /**
   * Luồng reset page on filter change:
   * Đặt lại trang hiện tại về trang 1 mỗi khi người dùng thay đổi mức sao muốn lọc hoặc đổi kiểu sắp xếp.
   * Lý do: Tránh lỗi hiển thị trang rỗng khi đang ở trang 3 của danh sách tất cả bài viết nhưng chuyển sang lọc 1 sao chỉ có 1 trang.
   */
  const handleFilterChange = (filter: 1 | 2 | 3 | 4 | 5 | 'all') => {
    setRatingFilter(filter);
    setPage(1);
  };

  const handleSortChange = (sort: 'newest' | 'highest' | 'lowest') => {
    setSortBy(sort);
    setPage(1);
  };

  /**
   * Xử lý gửi bài đánh giá mới của độc giả.
   * Sau khi tạo thành công: Cập nhật state bài viết cá nhân, tải lại thống kê và quay về trang 1 danh sách.
   */
  const handleCreateReview = async (data: { rating: number; comment: string }) => {
    if (!activeUserId) {
      throw new Error('Vui lòng đăng nhập để gửi đánh giá.');
    }

    await createReview({
      bookId,
      userId: activeUserId,
      userFullName: activeUserName,
      userEmail: activeUserEmail,
      rating: data.rating,
      comment: data.comment,
    });

    await loadUserReview();
    await loadStats();
    setPage(1);
    await loadReviews();
  };

  /**
   * Xử lý cập nhật bài đánh giá hiện có của độc giả.
   * Sau khi sửa thành công: Đóng form edit, tải lại review cá nhân và cập nhật danh sách & thống kê.
   */
  const handleUpdateReview = async (data: { rating: number; comment: string }) => {
    if (!userReview || !activeUserId) {
      throw new Error('Không tìm thấy bài đánh giá cần cập nhật.');
    }

    await updateReview(userReview.id, {
      bookId,
      userId: activeUserId,
      rating: data.rating,
      comment: data.comment,
    });

    setIsEditingUserReview(false);
    await loadUserReview();
    await loadStats();
    await loadReviews();
  };

  /**
   * Xử lý xóa bài đánh giá cá nhân.
   * Sau khi xóa thành công: Reset state userReview, đóng mode edit, làm mới thống kê và danh sách.
   */
  const handleDeleteReview = async (reviewId: string) => {
    if (!activeUserId) return;

    await deleteReview(reviewId, bookId, activeUserId);
    setUserReview(null);
    setIsEditingUserReview(false);
    await loadStats();
    setPage(1);
    await loadReviews();
  };

  // Lấy pathname hiện tại từ hook của Next.js để đồng nhất 100% giữa Server và Client (tránh lỗi React Hydration Mismatch)
  const pathname = usePathname();
  const loginUrl = `/login?returnUrl=${encodeURIComponent(pathname || `/books/${bookId}`)}`;

  // Lọc bài viết cá nhân của chính mình ra khỏi danh sách bài viết cộng đồng ở bên dưới.
  // Lý do: Tránh hiển thị lặp lại bài đánh giá của chính người dùng ở cả 2 nơi trên cùng một trang.
  const communityReviews = reviews.filter((r) => r.userId !== activeUserId);

  return (
    <section className="space-y-8 pt-8 border-t font-sans" aria-labelledby="reviews-heading">
      <div className="space-y-1">
        <h2 id="reviews-heading" className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          Đánh giá & Bình luận
        </h2>
        <p className="text-xs text-muted-foreground">
          Chia sẻ nhận xét thực tế từ cộng đồng độc giả giúp bạn lựa chọn cuốn sách phù hợp nhất.
        </p>
      </div>

      {/* 1. Bảng Tổng quan Thống kê Điểm đánh giá (ReviewSummary) */}
      {stats && (
        <ReviewSummary
          stats={stats}
          selectedFilter={ratingFilter}
          onFilterChange={handleFilterChange}
          selectedSort={sortBy}
          onSortChange={handleSortChange}
        />
      )}

      {/* 2. Khu vực Form gửi đánh giá / Thẻ đánh giá cá nhân / Guest CTA Banner */}
      <div className="space-y-4">
        {!isUserLoggedIn ? (
          /* Luồng Guest banner: Hiển thị banner kêu gọi đăng nhập nếu chưa đăng nhập */
          <div className="p-6 rounded-xl border border-dashed bg-card/40 text-center space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <LogIn className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">
                Bạn đã đọc cuốn sách này?
              </h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Vui lòng đăng nhập để gửi bài đánh giá, chấm điểm số sao và chia sẻ cảm nhận với cộng đồng độc giả.
              </p>
            </div>
            <Link
              href={loginUrl}
              className={cn(
                buttonVariants({ size: 'sm' }),
                'inline-flex items-center cursor-pointer font-medium'
              )}
            >
              <LogIn className="w-4 h-4 mr-2" />
              Đăng nhập để viết đánh giá
            </Link>
          </div>
        ) : userReview ? (
          isEditingUserReview ? (
            /* Luồng Edit review: Đang mở Form sửa bài viết cá nhân */
            <ReviewForm
              initialRating={userReview.rating}
              initialComment={userReview.comment}
              isEditing={true}
              onSubmit={handleUpdateReview}
              onCancel={() => setIsEditingUserReview(false)}
            />
          ) : (
            /* Luồng User existing review card: Đã có đánh giá -> hiển thị UserReviewCard */
            <UserReviewCard
              review={userReview}
              onEdit={() => setIsEditingUserReview(true)}
              onDelete={handleDeleteReview}
            />
          )
        ) : (
          /* Luồng Tạo mới: Người dùng đã đăng nhập và chưa từng đánh giá cuốn sách này */
          <ReviewForm
            isEditing={false}
            onSubmit={handleCreateReview}
          />
        )}
      </div>

      {/* Thông báo lỗi nếu gọi API thất bại */}
      {errorMessage && (
        <div className="flex items-center gap-2 text-xs text-destructive p-3 rounded-lg bg-destructive/10">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 3. Danh sách Đánh giá Cộng đồng & Skeleton & Empty State */}
      <div className="space-y-4 pt-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Đánh giá từ độc giả ({totalItems})
        </h3>

        {isLoadingReviews ? (
          /* Trạng thái đang tải dữ liệu từ API */
          <ReviewListSkeleton />
        ) : communityReviews.length > 0 ? (
          /* Danh sách các bài viết đánh giá cộng đồng */
          <div className="space-y-3">
            {communityReviews.map((rev) => (
              <ReviewItem key={rev.id} review={rev} />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          /* Không có bài đánh giá nào phù hợp (mảng rỗng) */
          <ReviewEmptyState
            isFiltered={ratingFilter !== 'all'}
            onResetFilter={() => handleFilterChange('all')}
          />
        ) : (
          /* Trường hợp bài duy nhất trên trang này là bài của chính người dùng (đã được hiển thị ở UserReviewCard) */
          <div className="p-6 text-center border border-dashed rounded-xl bg-card/20">
            <p className="text-xs text-muted-foreground italic">
              Chưa có thêm đánh giá nào khác từ các độc giả khác.
            </p>
          </div>
        )}

        {/* 4. Thanh điều hướng phân trang (Pagination) bằng shadcn/ui */}
        {!isLoadingReviews && totalPages > 1 && (
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/40">
            <span className="text-xs text-muted-foreground font-medium">
              Hiển thị trang <strong className="text-foreground">{page}</strong> / {totalPages} (Tổng {totalItems} đánh giá)
            </span>

            <Pagination className="mx-0 w-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  />
                </PaginationItem>

                {/* Render danh sách các nút số trang sử dụng thuật toán thu gọn dải trang */}
                {getVisiblePages(page, totalPages).map((item, idx) =>
                  typeof item === 'number' ? (
                    <PaginationItem key={`page_${item}`}>
                      <PaginationLink
                        isActive={item === page}
                        onClick={() => setPage(item)}
                      >
                        {item}
                      </PaginationLink>
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={`ellipsis_${idx}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )
                )}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </section>
  );
}
