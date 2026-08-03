using api.Common.Redis;
using api.Database.Entities;
using api.Modules.Circulation.DTOs;
using api.Modules.Circulation.Services;
using api.Repositories.Interfaces;
using MongoDB.Driver;

namespace api.Modules.Circulation.Services
{
    public class BorrowingService : IBorrowingService
    {
        private readonly IBorrowingRepository _borrowingRepository;
        private readonly ICopyRepository _copyRepository;
        private readonly IBookRepository _bookRepository;
        private readonly IFineRepository _fineRepository;
        private readonly IMongoCollection<User> _usersCollection;
        private readonly IMongoCollection<LibraryBranch> _branchesCollection;
        private readonly RedisLockHelper _lockHelper;
        private readonly ILogger<BorrowingService> _logger;

        public BorrowingService(
            IBorrowingRepository borrowingRepository,
            ICopyRepository copyRepository,
            IBookRepository bookRepository,
            IFineRepository fineRepository,
            IMongoDatabase database,
            RedisLockHelper lockHelper,
            ILogger<BorrowingService> logger)
        {
            _borrowingRepository = borrowingRepository;
            _copyRepository = copyRepository;
            _bookRepository = bookRepository;
            _fineRepository = fineRepository;
            _usersCollection = database.GetCollection<User>("users");
            _branchesCollection = database.GetCollection<LibraryBranch>("library_branches");
            _lockHelper = lockHelper;
            _logger = logger;
        }

        public async Task<BorrowingResponseDto> CreateBorrowingAsync(CreateBorrowingDto dto, string createdByUserId)
        {
            // 1. Check user validity
            var user = await _usersCollection.Find(u => u.Id == dto.UserId).FirstOrDefaultAsync();
            if (user == null)
            {
                throw new KeyNotFoundException("Không tìm thấy thông tin người dùng.");
            }

            if (user.Status != "ACTIVE")
            {
                throw new InvalidOperationException("Tài khoản người dùng đang bị khóa hoặc không ở trạng thái hoạt động.");
            }

            // 2. Check unpaid fines
            var totalUnpaidFine = await _fineRepository.GetTotalUnpaidAmountByUserIdAsync(dto.UserId);
            if (totalUnpaidFine > 0)
            {
                throw new InvalidOperationException($"Thành viên đang có khoản phạt chưa thanh toán ({totalUnpaidFine:N0} VNĐ). Vui lòng xử lý tiền phạt trước khi mượn mới.");
            }

            // 3. Check loan limit (max 5 active items)
            var activeItemsCount = await _borrowingRepository.CountActiveItemsByUserIdAsync(dto.UserId);
            if (activeItemsCount + dto.CopyIds.Count > 5)
            {
                throw new InvalidOperationException($"Người dùng hiện đang mượn {activeItemsCount} cuốn. Đợt mượn này ({dto.CopyIds.Count} cuốn) sẽ vượt quá hạn mức tối đa 5 cuốn.");
            }

            var acquiredLocks = new List<(string key, string val)>();
            try
            {
                // 4. Acquire distributed locks & validate copies
                var copiesToBorrow = new List<BookCopy>();
                foreach (var copyId in dto.CopyIds)
                {
                    var lockKey = $"borrow_lock:{copyId}";
                    var lockVal = Guid.NewGuid().ToString();

                    var locked = await _lockHelper.AcquireLockAsync(lockKey, lockVal, TimeSpan.FromSeconds(10));
                    if (!locked)
                    {
                        throw new InvalidOperationException($"Bản sao {copyId} đang được xử lý mượn bởi giao dịch khác. Vui lòng thử lại.");
                    }
                    acquiredLocks.Add((lockKey, lockVal));

                    var copy = await _copyRepository.GetByIdAsync(copyId);
                    if (copy == null)
                    {
                        throw new KeyNotFoundException($"Không tìm thấy bản sao sách có ID: {copyId}");
                    }

                    if (copy.Status != "AVAILABLE")
                    {
                        throw new InvalidOperationException($"Bản sao sách '{copy.Barcode}' không sẵn sàng để mượn (Trạng thái hiện tại: {copy.Status}).");
                    }

                    copiesToBorrow.Add(copy);
                }

                // 5. Create Borrowing transaction
                var borrowingCode = $"LOAN-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}";
                var dueAt = DateTime.UtcNow.AddDays(dto.DaysToBorrow);

                var borrowing = new Borrowing
                {
                    Code = borrowingCode,
                    UserId = dto.UserId,
                    BranchId = dto.BranchId,
                    Status = "OPEN",
                    BorrowedAt = DateTime.UtcNow,
                    ExpectedReturnAt = dueAt,
                    CreatedBy = createdByUserId,
                    Note = dto.Note
                };

                var borrowingItems = copiesToBorrow.Select(c => new BorrowingItem
                {
                    CopyId = c.Id,
                    DueAt = dueAt,
                    ConditionOut = c.Condition,
                    Status = "BORROWED",
                    RenewCount = 0
                }).ToList();

                // 6. Update copy statuses
                foreach (var copy in copiesToBorrow)
                {
                    copy.Status = "BORROWED";
                    copy.UpdatedAt = DateTime.UtcNow;
                    await _copyRepository.UpdateAsync(copy.Id, copy);
                }

                // 7. Save to DB
                await _borrowingRepository.InsertAsync(borrowing, borrowingItems);

                _logger.LogInformation("Successfully created borrowing {Code} for user {UserId}", borrowingCode, dto.UserId);

                return await BuildBorrowingResponseDtoAsync(borrowing, borrowingItems);
            }
            finally
            {
                // Release acquired locks
                foreach (var (key, val) in acquiredLocks)
                {
                    await _lockHelper.ReleaseLockAsync(key, val);
                }
            }
        }

        public async Task<(List<BorrowingResponseDto> Items, long Total)> GetBorrowingsAsync(string? userId, string? branchId, string? status, string? keyword, int page, int limit)
        {
            var (borrowings, total) = await _borrowingRepository.SearchAsync(userId, branchId, status, keyword, page, limit);

            var dtos = new List<BorrowingResponseDto>();
            foreach (var b in borrowings)
            {
                var items = await _borrowingRepository.GetItemsByBorrowingIdAsync(b.Id);
                var dto = await BuildBorrowingResponseDtoAsync(b, items);
                dtos.Add(dto);
            }

            return (dtos, total);
        }

        public async Task<BorrowingResponseDto?> GetBorrowingByIdAsync(string id)
        {
            var borrowing = await _borrowingRepository.GetByIdAsync(id);
            if (borrowing == null) return null;

            var items = await _borrowingRepository.GetItemsByBorrowingIdAsync(borrowing.Id);
            return await BuildBorrowingResponseDtoAsync(borrowing, items);
        }

        public async Task<BorrowingResponseDto> ReturnBorrowingItemsAsync(string borrowingId, ReturnItemsDto dto)
        {
            var borrowing = await _borrowingRepository.GetByIdAsync(borrowingId);
            if (borrowing == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy phiếu mượn có ID: {borrowingId}");
            }

            var items = await _borrowingRepository.GetItemsByBorrowingIdAsync(borrowingId);
            var now = DateTime.UtcNow;

            foreach (var reqItem in dto.ReturnedItems)
            {
                var item = items.FirstOrDefault(i => i.Id == reqItem.ItemId);
                if (item == null) continue;

                if (item.Status == "RETURNED") continue;

                item.ReturnedAt = now;
                item.ConditionIn = reqItem.ConditionIn;
                item.Status = "RETURNED";

                // Overdue calculation (5000 VND / day)
                if (now > item.DueAt)
                {
                    var overdueDays = Math.Max(1, (int)Math.Ceiling((now - item.DueAt).TotalDays));
                    var fineAmount = overdueDays * 5000m;

                    var fine = new Fine
                    {
                        UserId = borrowing.UserId,
                        BorrowingId = borrowing.Id,
                        BorrowingItemId = item.Id,
                        Amount = fineAmount,
                        Reason = "OVERDUE",
                        Status = "UNPAID",
                        CreatedAt = now,
                        Note = $"Trả sách quá hạn {overdueDays} ngày."
                    };
                    await _fineRepository.InsertAsync(fine);
                    _logger.LogInformation("Generated overdue fine {Amount} for borrowing item {ItemId}", fineAmount, item.Id);
                }

                await _borrowingRepository.UpdateBorrowingItemAsync(item.Id, item);

                // Update copy status back to AVAILABLE
                var copy = await _copyRepository.GetByIdAsync(item.CopyId);
                if (copy != null)
                {
                    copy.Status = "AVAILABLE";
                    copy.Condition = reqItem.ConditionIn;
                    copy.UpdatedAt = now;
                    await _copyRepository.UpdateAsync(copy.Id, copy);
                }
            }

            // Refresh items list
            var updatedItems = await _borrowingRepository.GetItemsByBorrowingIdAsync(borrowingId);
            var allReturned = updatedItems.All(i => i.Status == "RETURNED" || i.Status == "LOST");

            if (allReturned)
            {
                borrowing.Status = "RETURNED";
                borrowing.ClosedAt = now;
            }
            else
            {
                borrowing.Status = "PARTIALLY_RETURNED";
            }

            await _borrowingRepository.UpdateBorrowingAsync(borrowing.Id, borrowing);

            return await BuildBorrowingResponseDtoAsync(borrowing, updatedItems);
        }

        public async Task<BorrowingItemResponseDto> RenewBorrowingItemAsync(string itemId, RenewItemDto dto)
        {
            var item = await _borrowingRepository.GetItemByIdAsync(itemId);
            if (item == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy bản ghi mượn sách ID: {itemId}");
            }

            if (item.Status != "BORROWED")
            {
                throw new InvalidOperationException($"Chỉ có thể gia hạn khi sách đang ở trạng thái mượn (BORROWED). Trạng thái hiện tại: {item.Status}");
            }

            if (DateTime.UtcNow > item.DueAt)
            {
                throw new InvalidOperationException("Sách đã quá hạn mượn. Vui lòng làm thủ tục trả sách và nộp phạt trước khi mượn lại.");
            }

            if (item.RenewCount >= 2)
            {
                throw new InvalidOperationException("Sách này đã đạt hạn mức gia hạn tối đa (2 lần).");
            }

            item.RenewCount += 1;
            item.DueAt = item.DueAt.AddDays(dto.DaysToExtend);

            await _borrowingRepository.UpdateBorrowingItemAsync(item.Id, item);

            _logger.LogInformation("Successfully renewed borrowing item {ItemId}. New due date: {DueAt}", item.Id, item.DueAt);

            return await BuildBorrowingItemResponseDtoAsync(item);
        }

        public async Task<BorrowingItemResponseDto> MarkItemStatusAsync(string itemId, MarkItemStatusDto dto, string actorUserId)
        {
            var item = await _borrowingRepository.GetItemByIdAsync(itemId);
            if (item == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy bản ghi mượn sách ID: {itemId}");
            }

            var borrowing = await _borrowingRepository.GetByIdAsync(item.BorrowingId);
            if (borrowing == null)
            {
                throw new KeyNotFoundException("Không tìm thấy thông tin phiếu mượn tương ứng.");
            }

            var now = DateTime.UtcNow;
            item.Status = dto.Status;
            item.ConditionIn = dto.ConditionIn ?? dto.Status;

            await _borrowingRepository.UpdateBorrowingItemAsync(item.Id, item);

            // Update BookCopy status
            var copy = await _copyRepository.GetByIdAsync(item.CopyId);
            decimal fineAmount = 150000m; // Default fine amount if price not set

            if (copy != null)
            {
                copy.Status = dto.Status;
                copy.Condition = dto.ConditionIn ?? dto.Status;
                copy.UpdatedAt = now;
                await _copyRepository.UpdateAsync(copy.Id, copy);

                if (copy.Price is > 0)
                {
                    var baseFine = dto.Status == "LOST" ? copy.Price.Value : copy.Price.Value * 0.5m;
                    fineAmount = Math.Max(150000m, Math.Round(baseFine, 0));
                }
            }

            // Issue fine
            var fine = new Fine
            {
                UserId = borrowing.UserId,
                BorrowingId = borrowing.Id,
                BorrowingItemId = item.Id,
                Amount = fineAmount,
                Reason = dto.Status,
                Status = "UNPAID",
                CreatedAt = now,
                Note = dto.Note ?? $"Phạt do làm {dto.Status.ToLower()} sách."
            };
            await _fineRepository.InsertAsync(fine);

            _logger.LogWarning("Marked borrowing item {ItemId} as {Status}. Fine issued: {Amount}", item.Id, dto.Status, fineAmount);

            return await BuildBorrowingItemResponseDtoAsync(item);
        }

        #region Helper Mapping Methods

        private async Task<BorrowingResponseDto> BuildBorrowingResponseDtoAsync(Borrowing borrowing, List<BorrowingItem> items)
        {
            var user = await _usersCollection.Find(u => u.Id == borrowing.UserId).FirstOrDefaultAsync();
            var branch = await _branchesCollection.Find(b => b.Id == borrowing.BranchId).FirstOrDefaultAsync();

            var itemDtos = new List<BorrowingItemResponseDto>();
            foreach (var item in items)
            {
                var itemDto = await BuildBorrowingItemResponseDtoAsync(item);
                itemDtos.Add(itemDto);
            }

            return new BorrowingResponseDto
            {
                Id = borrowing.Id,
                Code = borrowing.Code,
                UserId = borrowing.UserId,
                UserName = user?.FullName,
                StudentCode = user?.StudentCode,
                BranchId = borrowing.BranchId,
                BranchName = branch?.Name,
                Status = borrowing.Status,
                BorrowedAt = borrowing.BorrowedAt,
                ExpectedReturnAt = borrowing.ExpectedReturnAt,
                ClosedAt = borrowing.ClosedAt,
                CreatedBy = borrowing.CreatedBy,
                Note = borrowing.Note,
                Items = itemDtos
            };
        }

        private async Task<BorrowingItemResponseDto> BuildBorrowingItemResponseDtoAsync(BorrowingItem item)
        {
            var copy = await _copyRepository.GetByIdAsync(item.CopyId);
            Book? book = null;
            if (copy != null)
            {
                book = await _bookRepository.GetByIdAsync(copy.BookId);
            }

            return new BorrowingItemResponseDto
            {
                Id = item.Id,
                BorrowingId = item.BorrowingId,
                CopyId = item.CopyId,
                Barcode = copy?.Barcode,
                BookTitle = book?.Title,
                ShelfCode = copy?.ShelfCode,
                DueAt = item.DueAt,
                ReturnedAt = item.ReturnedAt,
                RenewCount = item.RenewCount,
                ConditionOut = item.ConditionOut,
                ConditionIn = item.ConditionIn,
                Status = item.Status
            };
        }

        #endregion
    }
}
