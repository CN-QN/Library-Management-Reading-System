using api.Modules.Borrowings.DTOs;
using api.Common.Models;

namespace api.Modules.Borrowings.Services
{
    public interface IBorrowingService
    {
        /// <summary>
        /// Mượn sách
        /// </summary>
        Task<BorrowResponseDto> BorrowBookAsync(BorrowRequestDto request, string userId);

        /// <summary>
        /// Trả sách
        /// </summary>
        Task<BorrowResponseDto> ReturnBookAsync(string borrowingId, ReturnRequestDto request, string userId);

        /// <summary>
        /// Gia hạn mượn sách
        /// </summary>
        Task<BorrowResponseDto> RenewBookAsync(string borrowingId, RenewRequestDto request, string userId);

        /// <summary>
        /// Lấy thông tin mượn theo ID
        /// </summary>
        Task<BorrowResponseDto?> GetByIdAsync(string id);

        /// <summary>
        /// Lấy danh sách mượn sách
        /// </summary>
        Task<PagedResult<BorrowResponseDto>> GetBorrowingsAsync(BorrowQueryDto query);

        /// <summary>
        /// Lấy danh sách mượn của user
        /// </summary>
        Task<List<BorrowResponseDto>> GetByUserIdAsync(string userId);

        /// <summary>
        /// Lấy danh sách mượn đang hoạt động
        /// </summary>
        Task<List<BorrowResponseDto>> GetActiveBorrowingsAsync();

        /// <summary>
        /// Lấy danh sách mượn quá hạn
        /// </summary>
        Task<List<BorrowResponseDto>> GetOverdueBorrowingsAsync();

        /// <summary>
        /// Kiểm tra user có đang mượn sách này không
        /// </summary>
        Task<bool> IsUserBorrowingBookAsync(string userId, string bookId);

        /// <summary>
        /// Tính tiền phạt cho mượn quá hạn
        /// </summary>
        Task<decimal> CalculateFineAsync(string borrowingId);

        /// <summary>
        /// Thanh toán tiền phạt
        /// </summary>
        Task<bool> PayFineAsync(string borrowingId, string userId);

        /// <summary>
        /// Kiểm tra hạn mức mượn của user
        /// </summary>
        Task<bool> CanUserBorrowAsync(string userId, int maxBorrowLimit = 5);
    }
}