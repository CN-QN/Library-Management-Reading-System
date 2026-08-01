using api.Modules.Circulation.DTOs;

namespace api.Modules.Circulation.Services
{
    public interface IBorrowingService
    {
        Task<BorrowingResponseDto> CreateBorrowingAsync(CreateBorrowingDto dto, string createdByUserId);
        Task<(List<BorrowingResponseDto> Items, long Total)> GetBorrowingsAsync(string? userId, string? branchId, string? status, string? keyword, int page, int limit);
        Task<BorrowingResponseDto?> GetBorrowingByIdAsync(string id);
        Task<BorrowingResponseDto> ReturnBorrowingItemsAsync(string borrowingId, ReturnItemsDto dto);
        Task<BorrowingItemResponseDto> RenewBorrowingItemAsync(string itemId, RenewItemDto dto);
        Task<BorrowingItemResponseDto> MarkItemStatusAsync(string itemId, MarkItemStatusDto dto, string actorUserId);
    }
}
