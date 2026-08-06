using api.Database.Entities;
using api.Modules.Inventory.DTOs;
using api.Modules.Inventory.Services;
using api.Repositories.Interfaces;
using api.Common.Models;
using Microsoft.Extensions.Logging;

namespace api.Modules.Inventory.Services
{
    public class InventoryTransactionService : IInventoryTransactionService
    {
        private readonly IInventoryTransactionRepository _transactionRepository;
        private readonly ICopyRepository _copyRepository;
        private readonly IBookRepository _bookRepository;
        private readonly ILogger<InventoryTransactionService> _logger;

        public InventoryTransactionService(
            IInventoryTransactionRepository transactionRepository,
            ICopyRepository copyRepository,
            IBookRepository bookRepository,
            ILogger<InventoryTransactionService> logger)
        {
            _transactionRepository = transactionRepository;
            _copyRepository = copyRepository;
            _bookRepository = bookRepository;
            _logger = logger;
        }

        public async Task<InventoryTransactionResponseDto> ImportBookAsync(
            InventoryTransactionRequestDto request,
            string userId)
        {
            // 1. Lấy thông tin BookCopy
            var bookCopy = await _copyRepository.GetByIdAsync(request.BookCopyId);
            if (bookCopy == null)
                throw new InvalidOperationException("Book copy not found.");

            var book = await _bookRepository.GetByIdAsync(bookCopy.BookId);
            if (book == null)
                throw new InvalidOperationException("Book not found.");

            // 2. Tạo giao dịch
            var transaction = new InventoryTransaction
            {
                BookCopyId = request.BookCopyId,
                BookId = bookCopy.BookId,
                BookTitle = book.Title,
                TransactionType = "IMPORT",
                Quantity = request.Quantity,
                ToLocation = request.ToLocation ?? bookCopy.CurrentBranchId,
                Status = "COMPLETED",
                Note = request.Note ?? "Import book to inventory",
                PerformedBy = userId,
                PerformedAt = DateTime.UtcNow,
                Metadata = request.Metadata ?? new Dictionary<string, string>()
            };

            await _transactionRepository.InsertAsync(transaction);

            // 3. Cập nhật BookCopy status
            bookCopy.Status = "AVAILABLE";
            bookCopy.CurrentBranchId = request.ToLocation ?? bookCopy.CurrentBranchId;
            await _copyRepository.UpdateAsync(bookCopy.Id, bookCopy);

            _logger.LogInformation($"Book imported: {book.Title} (Copy: {bookCopy.Id}) by user {userId}");

            return await MapToResponseDtoAsync(transaction);
        }

        public async Task<InventoryTransactionResponseDto> TransferBookAsync(
            InventoryTransferRequestDto request,
            string userId)
        {
            // 1. Lấy thông tin BookCopy
            var bookCopy = await _copyRepository.GetByIdAsync(request.BookCopyId);
            if (bookCopy == null)
                throw new InvalidOperationException("Book copy not found.");

            if (bookCopy.Status == "BORROWED")
                throw new InvalidOperationException("Cannot transfer a book that is currently borrowed.");

            var book = await _bookRepository.GetByIdAsync(bookCopy.BookId);
            if (book == null)
                throw new InvalidOperationException("Book not found.");

            // 2. Tạo giao dịch
            var transaction = new InventoryTransaction
            {
                BookCopyId = request.BookCopyId,
                BookId = bookCopy.BookId,
                BookTitle = book.Title,
                TransactionType = "TRANSFER",
                Quantity = 1,
                FromLocation = bookCopy.CurrentBranchId,
                ToLocation = request.ToLocation,
                FromBranchName = await GetBranchNameAsync(bookCopy.CurrentBranchId),
                ToBranchName = await GetBranchNameAsync(request.ToLocation),
                Status = "COMPLETED",
                Note = request.Note ?? $"Transfer from {bookCopy.CurrentBranchId} to {request.ToLocation}",
                PerformedBy = userId,
                PerformedAt = DateTime.UtcNow
            };

            await _transactionRepository.InsertAsync(transaction);

            // 3. Cập nhật BookCopy location
            bookCopy.CurrentBranchId = request.ToLocation;
            await _copyRepository.UpdateAsync(bookCopy.Id, bookCopy);

            _logger.LogInformation($"Book transferred: {book.Title} from {transaction.FromLocation} to {transaction.ToLocation} by user {userId}");

            return await MapToResponseDtoAsync(transaction);
        }

        public async Task<InventoryTransactionResponseDto> AuditBookAsync(
            InventoryAuditRequestDto request,
            string userId)
        {
            var bookCopy = await _copyRepository.GetByIdAsync(request.BookCopyId);
            if (bookCopy == null)
                throw new InvalidOperationException("Book copy not found.");

            var book = await _bookRepository.GetByIdAsync(bookCopy.BookId);
            if (book == null)
                throw new InvalidOperationException("Book not found.");

            // Kiểm tra số lượng thực tế so với số lượng trong hệ thống
            var actualQuantity = request.ActualQuantity;
            var systemQuantity = 1; // Mỗi BookCopy là 1 bản

            var note = request.Note ?? $"Audit: Actual quantity = {actualQuantity}, System quantity = {systemQuantity}";

            if (actualQuantity != systemQuantity)
            {
                note += $" (Discrepancy found: {(actualQuantity - systemQuantity)})";
            }

            var transaction = new InventoryTransaction
            {
                BookCopyId = request.BookCopyId,
                BookId = bookCopy.BookId,
                BookTitle = book.Title,
                TransactionType = "AUDIT",
                Quantity = Math.Abs(actualQuantity - systemQuantity),
                ToLocation = bookCopy.CurrentBranchId,
                Status = actualQuantity == systemQuantity ? "COMPLETED" : "PENDING",
                Note = note,
                PerformedBy = userId,
                PerformedAt = DateTime.UtcNow,
                Metadata = new Dictionary<string, string>
                {
                    ["actualQuantity"] = actualQuantity.ToString(),
                    ["systemQuantity"] = systemQuantity.ToString()
                }
            };

            await _transactionRepository.InsertAsync(transaction);

            // Nếu có sai lệch, cập nhật trạng thái BookCopy
            if (actualQuantity != systemQuantity)
            {
                if (actualQuantity == 0)
                {
                    bookCopy.Status = "LOST";
                }
                await _copyRepository.UpdateAsync(bookCopy.Id, bookCopy);
            }

            _logger.LogInformation($"Book audited: {book.Title} by user {userId}");

            return await MapToResponseDtoAsync(transaction);
        }

        public async Task<InventoryTransactionResponseDto> MarkBookAsLostAsync(
            string bookCopyId,
            string? note,
            string userId)
        {
            var bookCopy = await _copyRepository.GetByIdAsync(bookCopyId);
            if (bookCopy == null)
                throw new InvalidOperationException("Book copy not found.");

            var book = await _bookRepository.GetByIdAsync(bookCopy.BookId);
            if (book == null)
                throw new InvalidOperationException("Book not found.");

            var transaction = new InventoryTransaction
            {
                BookCopyId = bookCopyId,
                BookId = bookCopy.BookId,
                BookTitle = book.Title,
                TransactionType = "LOST",
                Quantity = 1,
                FromLocation = bookCopy.CurrentBranchId,
                Status = "COMPLETED",
                Note = note ?? "Book marked as lost",
                PerformedBy = userId,
                PerformedAt = DateTime.UtcNow
            };

            await _transactionRepository.InsertAsync(transaction);

            bookCopy.Status = "LOST";
            await _copyRepository.UpdateAsync(bookCopy.Id, bookCopy);

            _logger.LogWarning($"Book marked as lost: {book.Title} by user {userId}");

            return await MapToResponseDtoAsync(transaction);
        }

        public async Task<InventoryTransactionResponseDto> MarkBookAsFoundAsync(
            string bookCopyId,
            string? note,
            string userId)
        {
            var bookCopy = await _copyRepository.GetByIdAsync(bookCopyId);
            if (bookCopy == null)
                throw new InvalidOperationException("Book copy not found.");

            var book = await _bookRepository.GetByIdAsync(bookCopy.BookId);
            if (book == null)
                throw new InvalidOperationException("Book not found.");

            var transaction = new InventoryTransaction
            {
                BookCopyId = bookCopyId,
                BookId = bookCopy.BookId,
                BookTitle = book.Title,
                TransactionType = "FOUND",
                Quantity = 1,
                ToLocation = bookCopy.CurrentBranchId,
                Status = "COMPLETED",
                Note = note ?? "Book found",
                PerformedBy = userId,
                PerformedAt = DateTime.UtcNow
            };

            await _transactionRepository.InsertAsync(transaction);

            bookCopy.Status = "AVAILABLE";
            await _copyRepository.UpdateAsync(bookCopy.Id, bookCopy);

            _logger.LogInformation($"Book found: {book.Title} by user {userId}");

            return await MapToResponseDtoAsync(transaction);
        }

        public async Task<InventoryTransactionResponseDto> MarkBookAsDamagedAsync(
            string bookCopyId,
            string? note,
            string userId)
        {
            var bookCopy = await _copyRepository.GetByIdAsync(bookCopyId);
            if (bookCopy == null)
                throw new InvalidOperationException("Book copy not found.");

            var book = await _bookRepository.GetByIdAsync(bookCopy.BookId);
            if (book == null)
                throw new InvalidOperationException("Book not found.");

            var transaction = new InventoryTransaction
            {
                BookCopyId = bookCopyId,
                BookId = bookCopy.BookId,
                BookTitle = book.Title,
                TransactionType = "DAMAGED",
                Quantity = 1,
                FromLocation = bookCopy.CurrentBranchId,
                Status = "COMPLETED",
                Note = note ?? "Book damaged",
                PerformedBy = userId,
                PerformedAt = DateTime.UtcNow
            };

            await _transactionRepository.InsertAsync(transaction);

            bookCopy.Status = "DAMAGED";
            await _copyRepository.UpdateAsync(bookCopy.Id, bookCopy);

            _logger.LogWarning($"Book marked as damaged: {book.Title} by user {userId}");

            return await MapToResponseDtoAsync(transaction);
        }

        public async Task<InventoryTransactionResponseDto?> GetByIdAsync(string id)
        {
            var transaction = await _transactionRepository.GetByIdAsync(id);
            return transaction == null ? null : await MapToResponseDtoAsync(transaction);
        }

        public async Task<PagedResult<InventoryTransactionResponseDto>> GetTransactionsAsync(
            InventoryTransactionQueryDto query)
        {
            var (transactions, total) = await _transactionRepository.SearchAsync(
                query.BookCopyId,
                query.BookId,
                query.TransactionType,
                query.Status,
                query.FromLocation,
                query.ToLocation,
                query.PerformedBy,
                query.FromDate,
                query.ToDate,
                query.Keyword,
                query.Page,
                query.Limit,
                query.SortBy,
                query.Descending
            );

            var items = new List<InventoryTransactionResponseDto>();
            foreach (var transaction in transactions)
            {
                items.Add(await MapToResponseDtoAsync(transaction));
            }

            return new PagedResult<InventoryTransactionResponseDto>(items, query.Page, query.Limit, (int)total);
        }

        public async Task<List<InventoryTransactionResponseDto>> GetByBookCopyIdAsync(string bookCopyId)
        {
            var transactions = await _transactionRepository.GetByBookCopyIdAsync(bookCopyId);
            var result = new List<InventoryTransactionResponseDto>();
            foreach (var transaction in transactions)
            {
                result.Add(await MapToResponseDtoAsync(transaction));
            }
            return result;
        }

        public async Task<List<InventoryTransactionResponseDto>> GetByBookIdAsync(string bookId)
        {
            var transactions = await _transactionRepository.GetByBookIdAsync(bookId);
            var result = new List<InventoryTransactionResponseDto>();
            foreach (var transaction in transactions)
            {
                result.Add(await MapToResponseDtoAsync(transaction));
            }
            return result;
        }

        public async Task<Dictionary<string, long>> GetTransactionStatisticsAsync(
            DateTime? fromDate = null,
            DateTime? toDate = null)
        {
            return await _transactionRepository.GetTransactionStatisticsAsync(fromDate, toDate);
        }

        public async Task<bool> CancelTransactionAsync(string transactionId, string userId, string? reason = null)
        {
            var transaction = await _transactionRepository.GetByIdAsync(transactionId);
            if (transaction == null)
                return false;

            if (transaction.Status != "PENDING")
                throw new InvalidOperationException("Only pending transactions can be cancelled.");

            transaction.Status = "CANCELLED";
            transaction.Note = (transaction.Note ?? "") + $" Cancelled: {reason ?? "No reason provided"}";
            transaction.UpdatedAt = DateTime.UtcNow;

            await _transactionRepository.UpdateAsync(transactionId, transaction);

            _logger.LogInformation($"Transaction cancelled: {transactionId} by user {userId}");

            return true;
        }

        // ============== Private Methods ==============

        private async Task<InventoryTransactionResponseDto> MapToResponseDtoAsync(InventoryTransaction transaction)
        {
            return new InventoryTransactionResponseDto
            {
                Id = transaction.Id,
                BookCopyId = transaction.BookCopyId,
                BookId = transaction.BookId,
                BookTitle = transaction.BookTitle,
                TransactionType = transaction.TransactionType,
                Quantity = transaction.Quantity,
                FromLocation = transaction.FromLocation,
                ToLocation = transaction.ToLocation,
                FromBranchName = transaction.FromBranchName,
                ToBranchName = transaction.ToBranchName,
                Status = transaction.Status,
                Note = transaction.Note,
                ReferenceId = transaction.ReferenceId,
                ReferenceType = transaction.ReferenceType,
                PerformedBy = transaction.PerformedBy,
                PerformedByName = transaction.PerformedByName,
                PerformedAt = transaction.PerformedAt,
                Metadata = transaction.Metadata,
                CreatedAt = transaction.CreatedAt,
                UpdatedAt = transaction.UpdatedAt
            };
        }

        private async Task<string?> GetBranchNameAsync(string? branchId)
        {
            if (string.IsNullOrEmpty(branchId))
                return null;

            // TODO: Lấy tên branch từ BranchRepository
            // Tạm thời trả về ID
            return branchId;
        }
    }
}
