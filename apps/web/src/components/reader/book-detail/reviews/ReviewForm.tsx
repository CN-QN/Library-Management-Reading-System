'use client';

import React, { useState } from 'react';
import { Star, Send, X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Thuộc tính đầu vào của component ReviewForm.
 */
export interface ReviewFormProps {
  /** Số sao khởi tạo (dùng khi chỉnh sửa bài đánh giá hiện có) */
  initialRating?: number;
  /** Nội dung nhận xét khởi tạo (dùng khi chỉnh sửa bài đánh giá hiện có) */
  initialComment?: string;
  /** Đang ở chế độ chỉnh sửa bài viết đã có hay tạo mới */
  isEditing?: boolean;
  /** Callback xử lý gửi dữ liệu form lên API/server */
  onSubmit: (data: { rating: number; comment: string }) => Promise<void>;
  /** Callback khi bấm nút hủy (chỉ hiển thị ở chế độ chỉnh sửa) */
  onCancel?: () => void;
}

/** 
 * Tên nhãn mô tả cảm xúc tương ứng với từng mức sao (1-5 sao).
 * Giúp người dùng hiểu rõ ý nghĩa từng mức đánh giá.
 */
const RATING_LABELS: Record<number, string> = {
  1: 'Rất tệ',
  2: 'Tệ',
  3: 'Bình thường',
  4: 'Tốt',
  5: 'Tuyệt vời',
};

/**
 * ReviewForm - Form cho phép độc giả chọn số sao trực quan và nhập nhận xét chi tiết cho cuốn sách.
 * Hỗ trợ chọn sao có hiệu ứng hover, validation real-time (tối thiểu 10 ký tự, tối đa 1000 ký tự),
 * chuyển đổi giữa chế độ tạo mới và chỉnh sửa, hiển thị trạng thái loading và phản hồi lỗi/thành công.
 *
 * Dùng ở: ReviewsSection của trang chi tiết sách độc giả (`/books/[id]`).
 *
 * @param initialRating - Số sao ban đầu (mặc định 0)
 * @param initialComment - Nội dung nhận xét ban đầu (mặc định chuỗi rỗng)
 * @param isEditing - Cờ báo chế độ chỉnh sửa (mặc định false)
 * @param onSubmit - Hàm bất đồng bộ gọi khi submit thành công
 * @param onCancel - Hàm hủy bỏ chế độ chỉnh sửa (optional)
 */
export function ReviewForm({
  initialRating = 0,
  initialComment = '',
  isEditing = false,
  onSubmit,
  onCancel,
}: ReviewFormProps) {
  const [rating, setRating] = useState<number>(initialRating);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>(initialComment);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Đồng bộ lại state nội bộ khi props initialRating hoặc initialComment thay đổi
  // (ví dụ khi người dùng chuyển sang sửa bài khác hoặc chuyển từ chế độ sửa về tạo mới).
  const [prevInitialProps, setPrevInitialProps] = useState({ initialRating, initialComment });
  if (
    prevInitialProps.initialRating !== initialRating ||
    prevInitialProps.initialComment !== initialComment
  ) {
    setPrevInitialProps({ initialRating, initialComment });
    setRating(initialRating);
    setComment(initialComment);
  }

  // Đếm số ký tự thực tế sau khi trim để validate chính xác độ dài nhận xét.
  // Yêu cầu từ 10 đến 1000 ký tự nhằm tránh các đánh giá quá ngắn (spam) hoặc quá dài gây vỡ layout/vượt ngưỡng DB.
  const charCount = comment.trim().length;
  const isTooShort = charCount > 0 && charCount < 10;
  const isTooLong = charCount > 1000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validate client-side trước khi gửi API để nâng cao trải nghiệm người dùng và giảm tải server request thừa.
    if (rating < 1 || rating > 5) {
      setErrorMessage('Vui lòng chọn số sao đánh giá (từ 1 đến 5 sao).');
      return;
    }

    if (charCount < 10) {
      setErrorMessage('Nội dung nhận xét phải có ít nhất 10 ký tự.');
      return;
    }

    if (charCount > 1000) {
      setErrorMessage('Nội dung nhận xét không được vượt quá 1000 ký tự.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ rating, comment: comment.trim() });
      setSuccessMessage(isEditing ? 'Cập nhật bài đánh giá thành công!' : 'Gửi bài đánh giá thành công!');
      
      // Xóa dữ liệu input sau khi gửi thành công nếu đang ở chế độ tạo mới để người dùng có thể viết tiếp bài khác nếu cần.
      if (!isEditing) {
        setRating(0);
        setComment('');
      }
    } catch (err: unknown) {
      // Ép kiểu err an toàn qua instance Check để không dùng type 'any'.
      setErrorMessage(err instanceof Error ? err.message : 'Đã có lỗi xảy ra.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ưu tiên hiển thị mức sao đang hover để tạo phản hồi thị giác tức thì khi rê chuột qua các ngôi sao.
  const activeStar = hoverRating || rating;

  return (
    <form onSubmit={handleSubmit} className="p-5 rounded-xl border bg-card space-y-4 shadow-xs">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-base text-foreground">
          {isEditing ? 'Chỉnh sửa đánh giá của bạn' : 'Viết đánh giá & cảm nhận của bạn'}
        </h3>
        {isEditing && onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="w-4 h-4 mr-1" />
            Hủy
          </Button>
        )}
      </div>

      {/* Chọn số sao tương tác trực quan */}
      <div className="space-y-1.5">
        <label id="rating-stars-label" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
          Chọn mức đánh giá <span className="text-destructive">*</span>
        </label>
        <div className="flex items-center gap-2" role="radiogroup" aria-labelledby="rating-stars-label">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((starValue) => {
              const filled = activeStar >= starValue;
              return (
                <button
                  key={starValue}
                  type="button"
                  role="radio"
                  aria-checked={rating === starValue}
                  aria-label={`${starValue} sao - ${RATING_LABELS[starValue]}`}
                  onClick={() => {
                    setRating(starValue);
                    setErrorMessage(null);
                  }}
                  onMouseEnter={() => setHoverRating(starValue)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 rounded-md transition-transform hover:scale-115 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                >
                  <Star
                    className={cn(
                      'w-7 h-7 transition-colors',
                      filled ? 'text-amber-500 fill-amber-500 drop-shadow-xs' : 'text-muted-foreground/25 hover:text-amber-300'
                    )}
                  />
                </button>
              );
            })}
          </div>

          {activeStar > 0 && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 animate-in fade-in duration-200">
              {activeStar}/5 sao • {RATING_LABELS[activeStar]}
            </span>
          )}
        </div>
      </div>

      {/* Textarea nhập nhận xét */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="review-textarea" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Nội dung nhận xét <span className="text-destructive">*</span>
          </label>
          <span
            className={cn(
              'text-[11px] font-mono',
              isTooLong ? 'text-destructive font-bold' : isTooShort ? 'text-amber-600' : 'text-muted-foreground'
            )}
          >
            {charCount}/1000 ký tự (tối thiểu 10)
          </span>
        </div>
        <textarea
          id="review-textarea"
          value={comment}
          onChange={(e) => {
            setComment(e.target.value);
            setErrorMessage(null);
          }}
          placeholder="Chia sẻ cảm nhận chi tiết của bạn về nội dung, phong cách viết hoặc điều bạn tâm đắc nhất ở cuốn sách..."
          rows={4}
          disabled={isSubmitting}
          className="flex min-h-[100px] w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 resize-none font-sans"
        />
      </div>

      {/* Thông báo lỗi / thành công động theo thời gian thực */}
      <div aria-live="polite" className="space-y-2">
        {errorMessage && (
          <div className="flex items-center gap-2 text-xs font-medium text-destructive p-2.5 rounded-md bg-destructive/10">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 p-2.5 rounded-md bg-emerald-500/10">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" disabled={isSubmitting} size="sm" className="min-w-[140px] font-semibold cursor-pointer">
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Đang lưu...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              {isEditing ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
