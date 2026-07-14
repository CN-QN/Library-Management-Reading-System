namespace api.Common.Constants;

public static class ErrorCodes
{
    public const string AUTH_001 = "AUTH_001"; // Sai email hoặc mật khẩu
    public const string AUTH_002 = "AUTH_002"; // Refresh token hết hạn/thu hồi
    public const string AUTH_003 = "AUTH_003"; // Tài khoản bị khóa
    
    public const string PERM_001 = "PERM_001"; // Không có permission
    public const string PERM_002 = "PERM_002"; // Ngoài phạm vi chi nhánh
    
    public const string BOOK_001 = "BOOK_001"; // Không tìm thấy sách
    public const string BOOK_002 = "BOOK_002"; // ISBN/slug đã tồn tại
    
    public const string CHAPTER_001 = "CHAPTER_001"; // Số chương bị trùng
    
    public const string COPY_001 = "COPY_001"; // Bản sao không sẵn sàng
    
    public const string LOAN_001 = "LOAN_001"; // Vượt hạn mức mượn
    public const string LOAN_002 = "LOAN_002"; // Thành viên có khoản phạt chưa xử lý
    public const string LOAN_003 = "LOAN_003"; // Bản sao đã được người khác mượn
    
    public const string PROGRESS_001 = "PROGRESS_001"; // Tiến trình cũ hơn phiên bản hiện tại
    
    public const string FILE_001 = "FILE_001"; // Loại/kích thước file không hợp lệ
    
    public const string SYS_001 = "SYS_001"; // Dịch vụ tạm thời suy giảm
    public const string VALIDATION = "VALIDATION"; // Lỗi validate DTO
}
