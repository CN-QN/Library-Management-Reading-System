using api.Common.Models;
using api.Database;
using api.Database.Entities;
using api.Modules.Catalog.DTOs;
using MongoDB.Bson;
using MongoDB.Driver;

namespace api.Modules.Catalog.Services
{
    public class ReviewService : IReviewService
    {
        private readonly MongoDbContext _context;
        private readonly RedisContext? _redisContext;
        private readonly ILogger<ReviewService> _logger;

        public ReviewService(MongoDbContext context, ILogger<ReviewService> logger, RedisContext? redisContext = null)
        {
            _context = context;
            _logger = logger;
            _redisContext = redisContext;
        }

        public async Task<PagedResult<ReviewResponseDto>> GetReviewsAsync(string bookId, int? ratingFilter, string sortBy = "newest", int page = 1, int pageSize = 10)
        {
            var filterBuilder = Builders<Review>.Filter;
            var filter = filterBuilder.Eq(r => r.BookId, bookId) & filterBuilder.Eq(r => r.Status, "APPROVED");

            if (ratingFilter.HasValue && ratingFilter.Value >= 1 && ratingFilter.Value <= 5)
            {
                filter &= filterBuilder.Eq(r => r.Rating, ratingFilter.Value);
            }

            var findFluent = _context.Reviews.Find(filter);

            findFluent = sortBy switch
            {
                "highest" => findFluent.SortByDescending(r => r.Rating).ThenByDescending(r => r.CreatedAt),
                "lowest" => findFluent.SortBy(r => r.Rating).ThenByDescending(r => r.CreatedAt),
                _ => findFluent.SortByDescending(r => r.CreatedAt),
            };

            var totalCount = await _context.Reviews.CountDocumentsAsync(filter);
            var reviews = await findFluent
                .Skip((page - 1) * pageSize)
                .Limit(pageSize)
                .ToListAsync();

            var items = reviews.Select(MapToDto).ToList();

            return new PagedResult<ReviewResponseDto>(items, page, pageSize, totalCount);
        }

        public async Task<ReviewStatsDto> GetReviewStatsAsync(string bookId)
        {
            var reviews = await _context.Reviews
                .Find(r => r.BookId == bookId && r.Status == "APPROVED")
                .ToListAsync();

            if (!reviews.Any())
            {
                return new ReviewStatsDto
                {
                    AverageRating = 0,
                    TotalReviews = 0,
                    Distribution = new Dictionary<int, int> { { 1, 0 }, { 2, 0 }, { 3, 0 }, { 4, 0 }, { 5, 0 } },
                    Percentages = new Dictionary<int, int> { { 1, 0 }, { 2, 0 }, { 3, 0 }, { 4, 0 }, { 5, 0 } }
                };
            }

            var totalReviews = reviews.Count;
            var sum = (double)reviews.Sum(r => r.Rating);
            var distribution = new Dictionary<int, int> { { 1, 0 }, { 2, 0 }, { 3, 0 }, { 4, 0 }, { 5, 0 } };

            foreach (var review in reviews)
            {
                if (distribution.ContainsKey(review.Rating))
                {
                    distribution[review.Rating]++;
                }
            }

            var percentages = new Dictionary<int, int>();
            foreach (var key in distribution.Keys)
            {
                percentages[key] = (int)Math.Round((double)distribution[key] / totalReviews * 100);
            }

            return new ReviewStatsDto
            {
                AverageRating = Math.Round(sum / totalReviews, 1),
                TotalReviews = totalReviews,
                Distribution = distribution,
                Percentages = percentages
            };
        }

        public async Task<ReviewResponseDto?> GetUserReviewAsync(string bookId, string userId)
        {
            var review = await _context.Reviews
                .Find(r => r.BookId == bookId && r.UserId == userId)
                .FirstOrDefaultAsync();

            return review == null ? null : MapToDto(review);
        }

        public async Task<ReviewResponseDto> CreateReviewAsync(string userId, CreateReviewDto dto)
        {
            // 1. Check ReadingProgresses in Mongo
            var hasRead = await _context.ReadingProgresses
                .Find(p => p.UserId == userId && p.BookId == dto.BookId)
                .AnyAsync();

            // 2. Check ReadingSessions in Mongo
            if (!hasRead)
            {
                hasRead = await _context.ReadingSessions
                    .Find(s => s.UserId == userId && s.BookId == dto.BookId)
                    .AnyAsync();
            }

            // 3. Check UserBookAccesses in Mongo
            if (!hasRead)
            {
                hasRead = await _context.UserBookAccesses
                    .Find(a => a.UserId == userId && a.BookId == dto.BookId)
                    .AnyAsync();
            }

            // 4. Check Redis cache/buffer
            if (!hasRead && _redisContext != null)
            {
                try
                {
                    var db = _redisContext.GetDatabase();
                    var key1 = $"reading_progress:{userId}:{dto.BookId}";
                    var key2 = $"reading_buffer:{userId}:{dto.BookId}";
                    hasRead = await db.KeyExistsAsync(key1) || await db.KeyExistsAsync(key2);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Lỗi kiểm tra Redis key cho user {UserId}, book {BookId}", userId, dto.BookId);
                }
            }

            // 5. Check if book is FREE or zero-price
            var book = await _context.Books.Find(b => b.Id == dto.BookId).FirstOrDefaultAsync();
            if (!hasRead && book != null)
            {
                if (string.Equals(book.AccessType, "FREE", StringComparison.OrdinalIgnoreCase) || book.Price == 0)
                {
                    hasRead = true;
                }
            }

            if (!hasRead)
            {
                throw new InvalidOperationException("Bạn cần bắt đầu đọc cuốn sách này trước khi gửi nhận xét & đánh giá.");
            }

            // Upsert ReadingProgress to Mongo if not present yet
            var progressExists = await _context.ReadingProgresses
                .Find(p => p.UserId == userId && p.BookId == dto.BookId)
                .AnyAsync();

            if (!progressExists)
            {
                try
                {
                    var newProgress = new ReadingProgress
                    {
                        UserId = userId,
                        BookId = dto.BookId,
                        ChapterId = "",
                        ChapterNumber = 1,
                        ScrollPosition = 0,
                        Percentage = 100,
                        Status = "COMPLETED",
                        Version = 1,
                        LastReadAt = DateTime.UtcNow
                    };
                    await _context.ReadingProgresses.InsertOneAsync(newProgress);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Lỗi khi tự tạo tiến độ đọc cho user {UserId}, book {BookId}", userId, dto.BookId);
                }
            }

            // Check if user already reviewed this book
            var existing = await _context.Reviews
                .Find(r => r.BookId == dto.BookId && r.UserId == userId)
                .FirstOrDefaultAsync();

            if (existing != null)
            {
                throw new InvalidOperationException("Bạn đã đánh giá cuốn sách này rồi. Vui lòng sử dụng chức năng chỉnh sửa.");
            }

            // Get user info
            var user = await _context.Users.Find(u => u.Id == userId).FirstOrDefaultAsync();
            var userFullName = !string.IsNullOrWhiteSpace(user?.FullName) ? user.FullName.Trim() : "Độc giả";
            var userEmail = user?.Email ?? "";

            var review = new Review
            {
                BookId = dto.BookId,
                UserId = userId,
                UserFullName = userFullName,
                UserEmail = userEmail,
                UserAvatarUrl = user?.Avatar,
                Rating = Math.Clamp(dto.Rating, 1, 5),
                Comment = dto.Comment.Trim(),
                Status = "APPROVED",
                IsEdited = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _context.Reviews.InsertOneAsync(review);
            _logger.LogInformation("User {UserId} created review for book {BookId}", userId, dto.BookId);

            // Sync rating stats back to Book document
            await UpdateBookRatingStatsAsync(dto.BookId);

            return MapToDto(review);
        }

        public async Task<ReviewResponseDto?> UpdateReviewAsync(string reviewId, string userId, UpdateReviewDto dto)
        {
            var review = await _context.Reviews.Find(r => r.Id == reviewId).FirstOrDefaultAsync();
            if (review == null) return null;

            if (review.UserId != userId)
            {
                throw new UnauthorizedAccessException("Bạn không có quyền chỉnh sửa bài đánh giá này.");
            }

            review.Rating = Math.Clamp(dto.Rating, 1, 5);
            review.Comment = dto.Comment.Trim();
            review.IsEdited = true;
            review.UpdatedAt = DateTime.UtcNow;

            await _context.Reviews.ReplaceOneAsync(r => r.Id == reviewId, review);
            _logger.LogInformation("User {UserId} updated review {ReviewId}", userId, reviewId);

            await UpdateBookRatingStatsAsync(review.BookId);

            return MapToDto(review);
        }

        public async Task<bool> DeleteReviewAsync(string reviewId, string userId, bool isAdmin = false)
        {
            var review = await _context.Reviews.Find(r => r.Id == reviewId).FirstOrDefaultAsync();
            if (review == null) return false;

            if (!isAdmin && review.UserId != userId)
            {
                throw new UnauthorizedAccessException("Bạn không có quyền xóa bài đánh giá này.");
            }

            var result = await _context.Reviews.DeleteOneAsync(r => r.Id == reviewId);
            if (result.DeletedCount > 0)
            {
                await UpdateBookRatingStatsAsync(review.BookId);
                return true;
            }
            return false;
        }

        public async Task<bool> ModerateReviewAsync(string reviewId, string status)
        {
            var review = await _context.Reviews.Find(r => r.Id == reviewId).FirstOrDefaultAsync();
            if (review == null) return false;

            var update = Builders<Review>.Update
                .Set(r => r.Status, status)
                .Set(r => r.UpdatedAt, DateTime.UtcNow);

            var result = await _context.Reviews.UpdateOneAsync(r => r.Id == reviewId, update);
            if (result.ModifiedCount > 0)
            {
                await UpdateBookRatingStatsAsync(review.BookId);
                return true;
            }
            return false;
        }

        public async Task<PagedResult<ReviewResponseDto>> GetAllReviewsAsync(string? status, int page = 1, int pageSize = 20)
        {
            var filterBuilder = Builders<Review>.Filter;
            var filter = filterBuilder.Empty;

            if (!string.IsNullOrWhiteSpace(status))
            {
                filter &= filterBuilder.Eq(r => r.Status, status.ToUpper());
            }

            var totalCount = await _context.Reviews.CountDocumentsAsync(filter);
            var reviews = await _context.Reviews
                .Find(filter)
                .SortByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Limit(pageSize)
                .ToListAsync();

            var dtos = reviews.Select(MapToDto).ToList();
            return new PagedResult<ReviewResponseDto>(dtos, page, pageSize, totalCount);
        }

        private async Task UpdateBookRatingStatsAsync(string bookId)
        {
            var reviews = await _context.Reviews.Find(r => r.BookId == bookId && r.Status == "APPROVED").ToListAsync();
            var ratingCount = reviews.Count;
            var rating = ratingCount > 0 ? Math.Round(reviews.Average(r => r.Rating), 1) : 0.0;

            var update = Builders<Book>.Update
                .Set(b => b.Stats.Rating, rating)
                .Set(b => b.Stats.RatingCount, ratingCount);

            await _context.Books.UpdateOneAsync(b => b.Id == bookId, update);
        }

        private static ReviewResponseDto MapToDto(Review r)
        {
            return new ReviewResponseDto
            {
                Id = r.Id,
                BookId = r.BookId,
                UserId = r.UserId,
                UserFullName = r.UserFullName,
                UserEmail = r.UserEmail,
                UserAvatarUrl = r.UserAvatarUrl,
                Rating = r.Rating,
                Comment = r.Comment,
                Status = r.Status,
                IsEdited = r.IsEdited,
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt
            };
        }
    }
}
