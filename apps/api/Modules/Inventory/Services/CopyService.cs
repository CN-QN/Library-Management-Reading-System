using api.Database.Entities;
using api.Modules.Inventory.DTOs;
using api.Repositories.Interfaces;
using api.Common.Models;
using Microsoft.Extensions.Logging;

namespace api.Modules.Inventory.Services
{
    public class CopyService : ICopyService
    {
        private readonly ICopyRepository _copyRepository;
        private readonly IBookRepository _bookRepository;
        private readonly ILogger<CopyService> _logger;

        public CopyService(
            ICopyRepository copyRepository,
            IBookRepository bookRepository,
            ILogger<CopyService> logger)
        {
            _copyRepository = copyRepository;
            _bookRepository = bookRepository;
            _logger = logger;
        }

        public async Task<CopyResponseDto?> GetByIdAsync(string id)
        {
            var copy = await _copyRepository.GetByIdAsync(id);
            return copy == null ? null : await MapToResponseAsync(copy);
        }

        public async Task<List<CopyResponseDto>> GetByBookIdAsync(string bookId)
        {
            var copies = await _copyRepository.GetByBookIdAsync(bookId);
            var result = new List<CopyResponseDto>();
            foreach (var copy in copies)
            {
                result.Add(await MapToResponseAsync(copy));
            }
            return result;
        }

        public async Task<List<CopyResponseDto>> GetByBranchIdAsync(string branchId)
        {
            var copies = await _copyRepository.GetByBranchIdAsync(branchId);
            var result = new List<CopyResponseDto>();
            foreach (var copy in copies)
            {
                result.Add(await MapToResponseAsync(copy));
            }
            return result;
        }

        public async Task<PagedResult<CopyResponseDto>> SearchAsync(string? keyword, int page, int limit)
        {
            var (copies, total) = await _copyRepository.SearchAsync(keyword, page, limit);
            var items = new List<CopyResponseDto>();
            foreach (var copy in copies)
            {
                items.Add(await MapToResponseAsync(copy));
            }

            return new PagedResult<CopyResponseDto>(items, page, limit, total);
        }

        public async Task<CopyResponseDto> CreateAsync(CreateCopyDto dto, string userId)
        {
            if (await _copyRepository.ExistsByBarcodeAsync(dto.Barcode))
                throw new InvalidOperationException($"Barcode '{dto.Barcode}' already exists");

            var book = await _bookRepository.GetByIdAsync(dto.BookId);
            if (book == null)
                throw new InvalidOperationException("Book not found");

            var copy = new BookCopy
            {
                BookId = dto.BookId,
                BranchId = dto.BranchId,
                Barcode = dto.Barcode,
                ShelfCode = dto.ShelfCode,
                Condition = dto.Condition ?? "GOOD",
                Status = "AVAILABLE",
                Price = dto.Price,
                AcquiredAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _copyRepository.InsertAsync(copy);
            _logger.LogInformation($"Copy {copy.Barcode} created for book {book.Title} by user {userId}");

            return await MapToResponseAsync(copy);
        }

        public async Task<CopyResponseDto?> UpdateAsync(string id, UpdateCopyDto dto, string userId)
        {
            var copy = await _copyRepository.GetByIdAsync(id);
            if (copy == null) return null;

            if (!string.IsNullOrEmpty(dto.ShelfCode)) copy.ShelfCode = dto.ShelfCode;
            if (!string.IsNullOrEmpty(dto.Condition)) copy.Condition = dto.Condition;
            if (dto.Price.HasValue) copy.Price = dto.Price.Value;
            if (!string.IsNullOrEmpty(dto.Status)) copy.Status = dto.Status;

            copy.UpdatedAt = DateTime.UtcNow;
            await _copyRepository.UpdateAsync(id, copy);
            _logger.LogInformation($"Copy {copy.Barcode} updated by user {userId}");

            return await MapToResponseAsync(copy);
        }

        public async Task<CopyResponseDto?> UpdateStatusAsync(string id, string status, string userId)
        {
            var copy = await _copyRepository.GetByIdAsync(id);
            if (copy == null) return null;

            copy.Status = status;
            copy.UpdatedAt = DateTime.UtcNow;
            await _copyRepository.UpdateAsync(id, copy);
            _logger.LogInformation($"Copy {copy.Barcode} status updated to {status} by user {userId}");

            return await MapToResponseAsync(copy);
        }

        public async Task<bool> TransferAsync(TransferCopyDto dto, string userId)
        {
            var copy = await _copyRepository.GetByIdAsync(dto.CopyId);
            if (copy == null) return false;

            if (copy.Status != "AVAILABLE" && copy.Status != "MAINTENANCE")
                throw new InvalidOperationException($"Cannot transfer copy with status '{copy.Status}'");

            copy.BranchId = dto.ToBranchId;
            copy.UpdatedAt = DateTime.UtcNow;
            await _copyRepository.UpdateAsync(copy.Id, copy);

            _logger.LogInformation($"Copy {copy.Barcode} transferred from {dto.FromBranchId} to {dto.ToBranchId} by user {userId}");
            return true;
        }

        public async Task<bool> AuditAsync(InventoryAuditDto dto, string userId)
        {
            var copy = await _copyRepository.GetByIdAsync(dto.CopyId);
            if (copy == null) return false;

            if (!string.IsNullOrEmpty(dto.Condition))
                copy.Condition = dto.Condition;

            copy.LastInventoryAt = DateTime.UtcNow;
            copy.UpdatedAt = DateTime.UtcNow;
            await _copyRepository.UpdateAsync(copy.Id, copy);

            _logger.LogInformation($"Copy {copy.Barcode} audited by user {userId}");
            return true;
        }

        public async Task<long> CountAvailableAsync(string bookId)
        {
            return await _copyRepository.CountAvailableByBookIdAsync(bookId);
        }

        public async Task<bool> IsAvailableAsync(string copyId)
        {
            var copy = await _copyRepository.GetByIdAsync(copyId);
            return copy != null && copy.Status == "AVAILABLE";
        }

        private async Task<CopyResponseDto> MapToResponseAsync(BookCopy copy)
        {
            var response = new CopyResponseDto
            {
                Id = copy.Id,
                BookId = copy.BookId,
                BranchId = copy.BranchId,
                Barcode = copy.Barcode,
                ShelfCode = copy.ShelfCode,
                Condition = copy.Condition,
                Status = copy.Status,
                Price = copy.Price,
                AcquiredAt = copy.AcquiredAt,
                LastInventoryAt = copy.LastInventoryAt,
                CreatedAt = copy.CreatedAt
            };

            var book = await _bookRepository.GetByIdAsync(copy.BookId);
            response.BookTitle = book?.Title ?? "Unknown";

            return response;
        }
    }
}