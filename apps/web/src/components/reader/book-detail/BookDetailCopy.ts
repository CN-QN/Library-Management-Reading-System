/**
 * Quản lý tập trung toàn bộ văn bản (copy) hiển thị cho trang Reader Portal Book Detail.
 * Giúp mã nguồn UI sạch sẽ và nhất quán theo chuẩn quy định dự án.
 */
export const BOOK_DETAIL_COPY = {
  pageTitleSuffix: ' - Reader Portal',
  missingAuthor: 'Chưa cập nhật tác giả',
  missingCategory: 'Chưa phân loại',
  missingPublisher: 'Đang cập nhật',
  missingPublicationYear: 'N/A',
  missingLanguage: 'N/A',
  missingIsbn: 'N/A',
  missingSummary: 'Chưa có thông tin tóm tắt cho cuốn sách này.',
  
  // Nút hành động đọc
  startReading: 'Bắt đầu đọc',
  continueReading: 'Đọc tiếp',
  noChaptersAvailable: 'Sách chưa có chương',
  
  // Tiến độ đọc
  progressHeading: 'Tiến độ của bạn',
  progressPercentLabel: 'hoàn thành',
  chapterLabel: 'Chương',

  // Bookmark / Yêu thích
  bookmarkAdd: 'Đánh dấu yêu thích',
  bookmarkRemove: 'Đã đánh dấu yêu thích',
  bookmarkNotice: 'Lưu ý: Tính năng đánh dấu yêu thích hiện lưu tạm thời trên trình duyệt.',

  // Danh sách chương
  chaptersHeading: 'Danh sách chương',
  chaptersCountLabel: 'chương',
  readingTimeLabel: 'phút đọc',
  wordCountLabel: 'từ',
  chaptersError: 'Không thể tải danh sách chương. Vui lòng thử lại.',
  retryButton: 'Thử lại',
  
  // Tệp tải xuống
  downloadFile: 'Tải sách (PDF)',
  downloadUnavailable: 'Chưa có file tải xuống',

  // Sách gợi ý
  recommendationsHeading: 'Gợi ý cho bạn',
  noRecommendations: 'Hiện chưa có sách gợi ý phù hợp.',

  // Đánh giá / Bình luận
  reviewsHeading: 'Đánh giá & Bình luận',
  reviewsNotice: 'Lưu ý: Đánh giá hiện được lưu tạm thời trên trình duyệt của bạn.',
  reviewRatingLabel: 'Đánh giá của bạn',
  reviewCommentLabel: 'Nhận xét của bạn',
  reviewCommentPlaceholder: 'Chia sẻ cảm nhận của bạn về cuốn sách này...',
  submitReview: 'Gửi đánh giá',
  submittingReview: 'Đang gửi...',
  reviewSuccess: 'Cảm ơn bạn đã gửi đánh giá!',
  validationRatingRequired: 'Vui lòng chọn số sao đánh giá (1 - 5).',
  validationCommentRequired: 'Vui lòng nhập nội dung nhận xét (tối thiểu 3 ký tự).',
  noReviewsYet: 'Chưa có đánh giá nào cho cuốn sách này. Hãy là người đầu tiên đánh giá!',

  // Trạng thái trang
  notFoundTitle: 'Không tìm thấy sách',
  notFoundDescription: 'Cuốn sách bạn đang tìm kiếm không tồn tại hoặc đã bị gỡ bỏ khỏi hệ thống.',
  backToBooks: 'Quay lại danh mục sách',
  errorTitle: 'Đã xảy ra lỗi',
  errorDescription: 'Không thể tải thông tin cuốn sách này vào lúc này. Vui lòng thử lại sau.',
} as const;
