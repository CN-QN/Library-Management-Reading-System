/**
 * Mirrors `apps/api/Common/Constants/ErrorCodes.cs`.
 * Maps a backend error code to a friendly Vietnamese message for toasts/forms.
 * Falls back to the raw `message` field from the API when the code is unknown.
 */
const ERROR_MESSAGES: Record<string, string> = {
  AUTH_001: "Sai email hoặc mật khẩu.",
  AUTH_002: "Phiên đăng nhập đã hết hạn hoặc bị thu hồi. Vui lòng đăng nhập lại.",
  AUTH_003: "Tài khoản của bạn đã bị khóa.",

  USER_001: "Email này đã được đăng ký.",
  USER_002: "Mã sinh viên này đã được đăng ký.",
  USER_003: "Không tìm thấy người dùng.",

  PERM_001: "Bạn không có quyền thực hiện thao tác này.",
  PERM_002: "Thao tác này nằm ngoài phạm vi chi nhánh của bạn.",

  BOOK_001: "Không tìm thấy sách.",
  BOOK_002: "ISBN hoặc slug này đã tồn tại.",

  CHAPTER_001: "Số chương bị trùng.",

  COPY_001: "Bản sao sách hiện không sẵn sàng.",

  LOAN_001: "Đã vượt quá hạn mức mượn sách.",
  LOAN_002: "Thành viên còn khoản phạt chưa xử lý.",
  LOAN_003: "Bản sao sách này đã được người khác mượn.",

  PROGRESS_001: "Tiến trình đọc đã cũ hơn phiên bản hiện tại.",

  FILE_001: "Loại hoặc kích thước file không hợp lệ.",

  SYS_001: "Dịch vụ tạm thời gián đoạn, vui lòng thử lại sau.",
  VALIDATION: "Dữ liệu gửi lên không hợp lệ.",
};

export function describeErrorCode(
  errorCode: string | undefined,
  fallbackMessage: string
): string {
  if (errorCode && ERROR_MESSAGES[errorCode]) {
    return ERROR_MESSAGES[errorCode];
  }
  return fallbackMessage || "Đã có lỗi xảy ra. Vui lòng thử lại.";
}
