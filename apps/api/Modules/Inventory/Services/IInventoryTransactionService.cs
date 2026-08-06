using api.Modules.Inventory.DTOs;
using api.Common.Models;

namespace api.Modules.Inventory.Services
{
    public interface IInventoryTransactionService
    {
        /// Tạo giao dịch nhập kho
        Task<InventoryTransactionResponseDto> ImportBookAsync(
            InventoryTransactionRequestDto request,
            string userId);

        /// Tạo giao dịch chuyển kho
        Task<InventoryTransactionResponseDto> TransferBookAsync(
            InventoryTransferRequestDto request,
            string userId);

        /// Tạo giao dịch kiểm kê
        Task<InventoryTransactionResponseDto> AuditBookAsync(
            InventoryAuditRequestDto request,
            string userId);

        /// Ghi nhận sách mất
        Task<InventoryTransactionResponseDto> MarkBookAsLostAsync(
            string bookCopyId,
            string? note,
            string userId);
        /// Ghi nhận tìm thấy sách
        Task<InventoryTransactionResponseDto> MarkBookAsFoundAsync(
            string bookCopyId,
            string? note,
            string userId);

        /// Ghi nhận sách hỏng
        Task<InventoryTransactionResponseDto> MarkBookAsDamagedAsync(
            string bookCopyId,
            string? note,
            string userId);

        /// Lấy thông tin giao dịch theo ID
        Task<InventoryTransactionResponseDto?> GetByIdAsync(string id);

        /// Lấy danh sách giao dịch

        Task<PagedResult<InventoryTransactionResponseDto>> GetTransactionsAsync(
            InventoryTransactionQueryDto query);

        /// Lấy danh sách giao dịch của bản sao sách
        Task<List<InventoryTransactionResponseDto>> GetByBookCopyIdAsync(string bookCopyId);

        /// Lấy danh sách giao dịch của sách
        Task<List<InventoryTransactionResponseDto>> GetByBookIdAsync(string bookId);

        /// Lấy thống kê giao dịch

        Task<Dictionary<string, long>> GetTransactionStatisticsAsync(DateTime? fromDate = null, DateTime? toDate = null);

        /// Hủy giao dịch
   
        Task<bool> CancelTransactionAsync(string transactionId, string userId, string? reason = null);
    }
}
