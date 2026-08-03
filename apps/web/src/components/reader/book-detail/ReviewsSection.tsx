'use client';

import { useState, useEffect } from 'react';
import { Star, MessageSquare, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/shared/StarRating';
import { getReviews, submitReview, type Review } from '@/lib/api/mocks/reviews.mocks';
import { BOOK_DETAIL_COPY } from './BookDetailCopy';
import { cn } from '@/lib/utils';

export interface ReviewsSectionProps {
  /** ID cuốn sách */
  bookId: string;
  /** ID người dùng hiện tại (nếu đã đăng nhập) */
  userId: string | null;
  /** Tên hiển thị người dùng (nếu đã đăng nhập) */
  userDisplayName?: string | null;
}

/**
 * ReviewsSection - Hiển thị danh sách đánh giá và form gửi nhận xét của người dùng.
 * Sử dụng mock storage (localStorage) để hỗ trợ phản hồi tức thì trên giao diện client.
 */
export function ReviewsSection({ bookId, userId, userDisplayName }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Khởi tạo danh sách đánh giá từ localStorage khi mount ở client bất đồng bộ để tránh cascading render
  useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) {
        setReviews(getReviews(bookId));
      }
    });
    return () => {
      isMounted = false;
    };
  }, [bookId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validate số sao đánh giá
    if (rating < 1 || rating > 5) {
      setErrorMsg(BOOK_DETAIL_COPY.validationRatingRequired);
      return;
    }

    // Validate nội dung bình luận
    const trimmed = comment.trim();
    if (!trimmed || trimmed.length < 3) {
      setErrorMsg(BOOK_DETAIL_COPY.validationCommentRequired);
      return;
    }

    setIsSubmitting(true);

    try {
      const created = submitReview({
        bookId,
        userId: userId || 'anonymous',
        displayName: userDisplayName || 'Độc giả',
        rating,
        comment: trimmed,
      });

      // Cập nhật ngay danh sách hiển thị
      setReviews((prev) => [created, ...prev]);

      // Reset form
      setRating(0);
      setComment('');
      setSuccessMsg(BOOK_DETAIL_COPY.reviewSuccess);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đã có lỗi xảy ra.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-8 pt-8 border-t" aria-labelledby="reviews-heading">
      <div className="space-y-1">
        <h2 id="reviews-heading" className="text-xl font-bold tracking-tight">
          {BOOK_DETAIL_COPY.reviewsHeading}
        </h2>
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 shrink-0" />
          {BOOK_DETAIL_COPY.reviewsNotice}
        </p>
      </div>

      {/* Form viết đánh giá mới */}
      <form onSubmit={handleSubmit} className="p-5 rounded-lg border bg-card space-y-4">
        <h3 className="font-semibold text-base">Viết đánh giá của bạn</h3>

        {/* Chọn số sao đánh giá */}
        <div className="space-y-1.5">
          <label id="rating-label" className="text-sm font-medium block">
            {BOOK_DETAIL_COPY.reviewRatingLabel} <span className="text-destructive">*</span>
          </label>
          <div
            className="flex items-center gap-1"
            role="radiogroup"
            aria-labelledby="rating-label"
            aria-required="true"
          >
            {[1, 2, 3, 4, 5].map((starValue) => {
              const active = (hoverRating || rating) >= starValue;
              return (
                <button
                  key={starValue}
                  type="button"
                  role="radio"
                  aria-checked={rating === starValue}
                  aria-label={`${starValue} sao`}
                  onClick={() => {
                    setRating(starValue);
                    setErrorMsg(null);
                  }}
                  onMouseEnter={() => setHoverRating(starValue)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 rounded transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <Star
                    className={cn(
                      'w-6 h-6 transition-colors',
                      active ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/30'
                    )}
                  />
                </button>
              );
            })}
            {rating > 0 && (
              <span className="text-xs font-semibold ml-2 text-amber-600 dark:text-amber-400">
                {rating}/5 sao
              </span>
            )}
          </div>
        </div>

        {/* Nhập nội dung nhận xét */}
        <div className="space-y-1.5">
          <label htmlFor="review-comment" className="text-sm font-medium block">
            {BOOK_DETAIL_COPY.reviewCommentLabel} <span className="text-destructive">*</span>
          </label>
          <textarea
            id="review-comment"
            value={comment}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
              setComment(e.target.value);
              setErrorMsg(null);
            }}
            placeholder={BOOK_DETAIL_COPY.reviewCommentPlaceholder}
            rows={3}
            aria-invalid={Boolean(errorMsg)}
            aria-describedby={errorMsg ? 'review-error' : undefined}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
          />
        </div>

        {/* Thông báo lỗi / thành công dạng aria-live */}
        <div aria-live="polite" className="space-y-2">
          {errorMsg && (
            <div id="review-error" className="flex items-center gap-2 text-xs font-medium text-destructive">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        <Button type="submit" disabled={isSubmitting} size="sm" className="w-full sm:w-auto">
          <MessageSquare className="w-4 h-4 mr-2" />
          {isSubmitting ? BOOK_DETAIL_COPY.submittingReview : BOOK_DETAIL_COPY.submitReview}
        </Button>
      </form>

      {/* Danh sách các bài đánh giá */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground italic text-center py-6">
            {BOOK_DETAIL_COPY.noReviewsYet}
          </p>
        ) : (
          reviews.map((rev) => (
            <div key={rev.id} className="p-4 rounded-lg border bg-card/60 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                    {rev.displayName.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold leading-none">{rev.displayName}</h4>
                    <span className="text-[11px] text-muted-foreground mt-0.5 block">
                      {new Date(rev.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
                <StarRating rating={rev.rating} size={14} />
              </div>
              <p className="text-sm text-foreground/90 pl-10 whitespace-pre-line">{rev.comment}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
