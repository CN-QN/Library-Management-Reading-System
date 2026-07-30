using api.Database.Entities;
using api.Modules.Borrowings.DTOs;
using api.Modules.Borrowings.Services;
using api.Repositories.Interfaces;
using api.Common.Models;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using MongoDB.Bson;
namespace api.Modules.Borrowings.Services
{
    public class BorrowingService : IBorrowingService
    {
        private readonly IMongoCollection<BorrowingRecord> _borrowingCollection;
        private readonly IMongoCollection<BookCopy> _bookCopyCollection;
        private readonly IMongoCollection<Book> _bookCollection;
        private readonly ILogger<BorrowingService> _logger;

        // Giả định lấy từ config
        private const int DEFAULT_BORROW_DAYS = 14;
        private const int MAX_BORROW_LIMIT = 5;
        private const decimal FINE_PER_DAY = 5000m; // 5000 VND/ngày

        public BorrowingService(
            IMongoDatabase database,
            ILogger<BorrowingService> logger)
        {
            _borrowingCollection = database.GetCollection<BorrowingRecord>("borrowingRecords");
            _bookCopyCollection = database.GetCollection<BookCopy>("bookCopies");
            _bookCollection = database.GetCollection<Book>("books");
            _logger = logger;
        }

        public async Task<BorrowResponseDto> BorrowBookAsync(BorrowRequestDto request, string userId)
        {
            // 1. Kiểm tra sách có sẵn không
            var bookCopy = await _bookCopyCollection
                .Find(c => c.Id == request.BookCopyId && c.Status == "AVAILABLE")
                .FirstOrDefaultAsync();

            if (bookCopy == null)
                throw new InvalidOperationException("Book copy is not available for borrowing.");

            // 2. Kiểm tra hạn mức mượn của user
            if (!await CanUserBorrowAsync(request.UserId))
                throw new InvalidOperationException("User has reached maximum borrowing limit.");

            // 3. Kiểm tra user có đang mượn sách này không
            var existingBorrow = await _borrowingCollection
                .Find(b => b.UserId == request.UserId && 
                           b.BookCopyId == request.BookCopyId && 
                           b.Status == "ACTIVE")
                .FirstOrDefaultAsync();

            if (existingBorrow != null)
                throw new InvalidOperationException("User is already borrowing this book.");

            // 4. Lấy thông tin sách
            var book = await _bookCollection
                .Find(b => b.Id == bookCopy.BookId)
                .FirstOrDefaultAsync();

            if (book == null)
                throw new InvalidOperationException("Book not found.");

            // 5. Tạo bản ghi mượn
            var borrowRecord = new BorrowingRecord
            {
                BookCopyId = request.BookCopyId,
                BookId = book.Id,
                BookTitle = book.Title,
                UserId = request.UserId,
                UserName = "User", // Có thể lấy từ UserService
                UserEmail = "user@email.com", // Có thể lấy từ UserService
                BorrowDate = DateTime.UtcNow,
                DueDate = DateTime.UtcNow.AddDays(request.DaysToBorrow > 0 ? request.DaysToBorrow : DEFAULT_BORROW_DAYS),
                Status = "ACTIVE",
                Note = request.Note,
                CreatedBy = userId,
                MaxRenewCount = 2,
                RenewCount = 0
            };

            await _borrowingCollection.InsertOneAsync(borrowRecord);

            // 6. Cập nhật trạng thái BookCopy thành BORROWED
            var update = Builders<BookCopy>.Update
                .Set(c => c.Status, "BORROWED")
                .Set(c => c.CurrentBorrowingId, borrowRecord.Id)
                .Set(c => c.UpdatedAt, DateTime.UtcNow);

            await _bookCopyCollection.UpdateOneAsync(
                c => c.Id == request.BookCopyId,
                update
            );

            _logger.LogInformation($"Book borrowed: {book.Title} by user {request.UserId}");

            return await MapToResponseDtoAsync(borrowRecord);
        }

        public async Task<BorrowResponseDto> ReturnBookAsync(string borrowingId, ReturnRequestDto request, string userId)
        {
            // 1. Tìm bản ghi mượn
            var borrowRecord = await _borrowingCollection
                .Find(b => b.Id == borrowingId)
                .FirstOrDefaultAsync();

            if (borrowRecord == null)
                throw new InvalidOperationException("Borrowing record not found.");

            if (borrowRecord.Status == "RETURNED")
                throw new InvalidOperationException("Book has already been returned.");

            // 2. Cập nhật bản ghi mượn
            borrowRecord.ReturnDate = DateTime.UtcNow;
            borrowRecord.Status = request.MarkAsLost ? "LOST" : "RETURNED";
            borrowRecord.UpdatedAt = DateTime.UtcNow;

            if (request.MarkAsLost)
            {
                // Nếu đánh dấu là mất, tính phí bồi thường
                borrowRecord.FineAmount = 200000m; // Giá sách mất
                borrowRecord.Note = request.Note ?? "Book marked as lost";
            }
            else
            {
                // Tính phí trễ nếu quá hạn
                if (DateTime.UtcNow > borrowRecord.DueDate)
                {
                    var daysOverdue = (DateTime.UtcNow - borrowRecord.DueDate).Days;
                    borrowRecord.FineAmount = daysOverdue * FINE_PER_DAY;
                    borrowRecord.Note = request.Note ?? $"Overdue {daysOverdue} days. Fine: {borrowRecord.FineAmount}";
                }
                else
                {
                    borrowRecord.Note = request.Note ?? "Returned on time";
                }
            }

            await _borrowingCollection.ReplaceOneAsync(
                b => b.Id == borrowingId,
                borrowRecord
            );

            // 3. Cập nhật trạng thái BookCopy thành AVAILABLE (nếu không bị mất)
            if (!request.MarkAsLost)
            {
                var update = Builders<BookCopy>.Update
                    .Set(c => c.Status, "AVAILABLE")
                    .Unset(c => c.CurrentBorrowingId)
                    .Set(c => c.UpdatedAt, DateTime.UtcNow);

                await _bookCopyCollection.UpdateOneAsync(
                    c => c.Id == borrowRecord.BookCopyId,
                    update
                );
            }
            else
            {
                // Nếu sách mất, đánh dấu là LOST
                var update = Builders<BookCopy>.Update
                    .Set(c => c.Status, "LOST")
                    .Set(c => c.UpdatedAt, DateTime.UtcNow);

                await _bookCopyCollection.UpdateOneAsync(
                    c => c.Id == borrowRecord.BookCopyId,
                    update
                );
            }

            _logger.LogInformation($"Book returned: {borrowRecord.BookTitle} by user {borrowRecord.UserId}");

            return await MapToResponseDtoAsync(borrowRecord);
        }

        public async Task<BorrowResponseDto> RenewBookAsync(string borrowingId, RenewRequestDto request, string userId)
        {
            // 1. Tìm bản ghi mượn
            var borrowRecord = await _borrowingCollection
                .Find(b => b.Id == borrowingId)
                .FirstOrDefaultAsync();

            if (borrowRecord == null)
                throw new InvalidOperationException("Borrowing record not found.");

            if (borrowRecord.Status != "ACTIVE")
                throw new InvalidOperationException("Cannot renew a book that is not actively borrowed.");

            if (borrowRecord.RenewCount >= borrowRecord.MaxRenewCount)
                throw new InvalidOperationException($"Maximum renew limit ({borrowRecord.MaxRenewCount}) reached.");

            // 2. Kiểm tra xem có ai đang chờ mượn sách này không (tùy chọn)
            // ... có thể kiểm tra queue nếu có

            // 3. Gia hạn
            var extraDays = request.ExtraDays > 0 ? request.ExtraDays : 7;
            borrowRecord.DueDate = borrowRecord.DueDate.AddDays(extraDays);
            borrowRecord.RenewCount += 1;
            borrowRecord.UpdatedAt = DateTime.UtcNow;
            borrowRecord.Note = request.Note ?? $"Renewed. New due date: {borrowRecord.DueDate:yyyy-MM-dd}";

            await _borrowingCollection.ReplaceOneAsync(
                b => b.Id == borrowingId,
                borrowRecord
            );

            _logger.LogInformation($"Book renewed: {borrowRecord.BookTitle} for user {borrowRecord.UserId}");

            return await MapToResponseDtoAsync(borrowRecord);
        }

        public async Task<BorrowResponseDto?> GetByIdAsync(string id)
        {
            var record = await _borrowingCollection
                .Find(b => b.Id == id)
                .FirstOrDefaultAsync();

            return record == null ? null : await MapToResponseDtoAsync(record);
        }

        public async Task<PagedResult<BorrowResponseDto>> GetBorrowingsAsync(BorrowQueryDto query)
        {
            var filterBuilder = Builders<BorrowingRecord>.Filter;
            var filters = new List<FilterDefinition<BorrowingRecord>>();

            if (!string.IsNullOrEmpty(query.UserId))
            {
                filters.Add(filterBuilder.Eq(b => b.UserId, query.UserId));
            }

            if (!string.IsNullOrEmpty(query.Status))
            {
                filters.Add(filterBuilder.Eq(b => b.Status, query.Status.ToUpper()));
            }

            if (!string.IsNullOrEmpty(query.Keyword))
            {
                var keywordFilter = filterBuilder.Regex(b => b.BookTitle, new BsonRegularExpression(query.Keyword, "i")) |
                                    filterBuilder.Regex(b => b.UserName, new BsonRegularExpression(query.Keyword, "i"));
                filters.Add(keywordFilter);
            }

            var filter = filters.Any() ? filterBuilder.And(filters) : filterBuilder.Empty;

            var total = await _borrowingCollection.CountDocumentsAsync(filter);

            var sort = query.Descending
                ? Builders<BorrowingRecord>.Sort.Descending(query.SortBy)
                : Builders<BorrowingRecord>.Sort.Ascending(query.SortBy);

            var items = await _borrowingCollection.Find(filter)
                .Sort(sort)
                .Skip((query.Page - 1) * query.Limit)
                .Limit(query.Limit)
                .ToListAsync();

            var dtos = new List<BorrowResponseDto>();
            foreach (var item in items)
            {
                dtos.Add(await MapToResponseDtoAsync(item));
            }

            return new PagedResult<BorrowResponseDto>(dtos, query.Page, query.Limit, (int)total);
        }

        public async Task<List<BorrowResponseDto>> GetByUserIdAsync(string userId)
        {
            var records = await _borrowingCollection
                .Find(b => b.UserId == userId)
                .Sort(Builders<BorrowingRecord>.Sort.Descending(b => b.BorrowDate))
                .ToListAsync();

            var result = new List<BorrowResponseDto>();
            foreach (var record in records)
            {
                result.Add(await MapToResponseDtoAsync(record));
            }

            return result;
        }

        public async Task<List<BorrowResponseDto>> GetActiveBorrowingsAsync()
        {
            var records = await _borrowingCollection
                .Find(b => b.Status == "ACTIVE")
                .Sort(Builders<BorrowingRecord>.Sort.Descending(b => b.BorrowDate))
                .ToListAsync();

            var result = new List<BorrowResponseDto>();
            foreach (var record in records)
            {
                result.Add(await MapToResponseDtoAsync(record));
            }

            return result;
        }

        public async Task<List<BorrowResponseDto>> GetOverdueBorrowingsAsync()
        {
            var records = await _borrowingCollection
                .Find(b => b.Status == "ACTIVE" && b.DueDate < DateTime.UtcNow)
                .Sort(Builders<BorrowingRecord>.Sort.Descending(b => b.DueDate))
                .ToListAsync();

            var result = new List<BorrowResponseDto>();
            foreach (var record in records)
            {
                result.Add(await MapToResponseDtoAsync(record));
            }

            return result;
        }

        public async Task<bool> IsUserBorrowingBookAsync(string userId, string bookId)
        {
            var record = await _borrowingCollection
                .Find(b => b.UserId == userId && 
                          b.BookId == bookId && 
                          b.Status == "ACTIVE")
                .FirstOrDefaultAsync();

            return record != null;
        }

        public async Task<decimal> CalculateFineAsync(string borrowingId)
        {
            var record = await _borrowingCollection
                .Find(b => b.Id == borrowingId)
                .FirstOrDefaultAsync();

            if (record == null)
                throw new InvalidOperationException("Borrowing record not found.");

            if (record.Status != "ACTIVE")
                return 0;

            if (DateTime.UtcNow <= record.DueDate)
                return 0;

            var daysOverdue = (DateTime.UtcNow - record.DueDate).Days;
            return daysOverdue * FINE_PER_DAY;
        }

        public async Task<bool> PayFineAsync(string borrowingId, string userId)
        {
            var record = await _borrowingCollection
                .Find(b => b.Id == borrowingId)
                .FirstOrDefaultAsync();

            if (record == null)
                return false;

            if (record.FineAmount <= 0)
                return false;

            record.FinePaid = true;
            record.UpdatedAt = DateTime.UtcNow;

            await _borrowingCollection.ReplaceOneAsync(
                b => b.Id == borrowingId,
                record
            );

            _logger.LogInformation($"Fine paid for borrowing: {borrowingId} by user {userId}");

            return true;
        }

        public async Task<bool> CanUserBorrowAsync(string userId, int maxBorrowLimit = 5)
        {
            var activeCount = await _borrowingCollection
                .CountDocumentsAsync(b => b.UserId == userId && b.Status == "ACTIVE");

            return activeCount < maxBorrowLimit;
        }

        // ============== Private Methods ==============

        private async Task<BorrowResponseDto> MapToResponseDtoAsync(BorrowingRecord record)
        {
            var isOverdue = record.Status == "ACTIVE" && DateTime.UtcNow > record.DueDate;
            var daysOverdue = isOverdue ? (DateTime.UtcNow - record.DueDate).Days : 0;

            return new BorrowResponseDto
            {
                Id = record.Id,
                BookCopyId = record.BookCopyId,
                BookId = record.BookId,
                BookTitle = record.BookTitle,
                UserId = record.UserId,
                UserName = record.UserName,
                UserEmail = record.UserEmail,
                BorrowDate = record.BorrowDate,
                DueDate = record.DueDate,
                ReturnDate = record.ReturnDate,
                Status = record.Status,
                FineAmount = record.FineAmount,
                FinePaid = record.FinePaid,
                RenewCount = record.RenewCount,
                Note = record.Note,
                CreatedAt = record.CreatedAt,
                UpdatedAt = record.UpdatedAt,
                IsOverdue = isOverdue,
                DaysOverdue = daysOverdue
            };
        }
    }
}