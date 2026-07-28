using api.Modules.Inventory.DTOs;
using api.Common.Models;

namespace api.Modules.Inventory.Services
{
    public interface ICopyService
    {
        Task<CopyResponseDto?> GetByIdAsync(string id);
        Task<List<CopyResponseDto>> GetByBookIdAsync(string bookId);
        Task<List<CopyResponseDto>> GetByBranchIdAsync(string branchId);
        Task<PagedResult<CopyResponseDto>> SearchAsync(string? keyword, int page, int limit);
        Task<CopyResponseDto> CreateAsync(CreateCopyDto dto, string userId);
        Task<CopyResponseDto?> UpdateAsync(string id, UpdateCopyDto dto, string userId);
        Task<CopyResponseDto?> UpdateStatusAsync(string id, string status, string userId);
        Task<bool> TransferAsync(TransferCopyDto dto, string userId);
        Task<bool> AuditAsync(InventoryAuditDto dto, string userId);
        Task<long> CountAvailableAsync(string bookId);
        Task<bool> IsAvailableAsync(string copyId);
    }
}