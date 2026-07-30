using api.Modules.Inventory.DTOs;
using api.Common.Models;

namespace api.Modules.Inventory.Services
{
    public interface IInventoryTransactionService
    {
        /// <summary>
        /// Tạo giao dịch nhập kho
        /// </summary>
        Task<InventoryTransactionResponseDto> ImportBookAsync(
            InventoryTransactionRequestDto request,
            string userId);

        /// <summary>
        /// Tạo giao dịch chuyển kho
        /// </summary>
        Task<InventoryTransactionResponseDto> TransferBookAsync(
            InventoryTransferRequestDto request,
            string userId);

        /// <summary>
        /// Tạo giao dịch kiểm kê
        /// </summary>
        Task<InventoryTransactionResponseDto> AuditBookAsync(
            InventoryAuditRequestDto request,
            string userId);

        /// <summary>
        /// Ghi nhận sách mất
        /// </summary>
        Task<InventoryTransactionResponseDto> MarkBookAsLostAsync(
            string bookCopyId,
            string? note,
            string userId);

        /// <summary>
        /// Ghi nhận tìm thấy sách
        /// </summary>
        Task<InventoryTransactionResponseDto> MarkBookAsFoundAsync(
            string bookCopyId,
            string? note,
            string userId);

        /// <summary>
        /// Ghi nhận sách hỏng
        /// </summary>
        Task<InventoryTransactionResponseDto> MarkBookAsDamagedAsync(
            string bookCopyId,
            string? note,
            string userId);

        /// <summary>
        /// Lấy thông tin giao dịch theo ID
        /// </summary>
        Task<InventoryTransactionResponseDto?> GetByIdAsync(string id);

        /// <summary>
        /// Lấy danh sách giao dịch
        /// </summary>
        Task<PagedResult<InventoryTransactionResponseDto>> GetTransactionsAsync(
            InventoryTransactionQueryDto query);

        /// <summary>
        /// Lấy danh sách giao dịch của bản sao sách
        /// </summary>
        Task<List<InventoryTransactionResponseDto>> GetByBookCopyIdAsync(string bookCopyId);

        /// <summary>
        /// Lấy danh sách giao dịch của sách
        /// </summary>
        Task<List<InventoryTransactionResponseDto>> GetByBookIdAsync(string bookId);

        /// <summary>
        /// Lấy thống kê giao dịch
        /// </summary>
        Task<Dictionary<string, long>> GetTransactionStatisticsAsync(DateTime? fromDate = null, DateTime? toDate = null);

        /// <summary>
        /// Hủy giao dịch
        /// </summary>
        Task<bool> CancelTransactionAsync(string transactionId, string userId, string? reason = null);
    }
}