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
        private readonly ILogger<ReviewService> _logger;

        public ReviewService(MongoDbContext context, ILogger<ReviewService> logger)
        {
            _context = context;
            _logger = logger;
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

            var totalReviews = reviews.Count;
            var distribution = new Dictionary<int, int> { { 1, 0 }, { 2, 0 }, { 3, 0 }, { 4, 0 }, { 5, 0 } };
            var percentages = new Dictionary<int, int> { { 1, 0 }, { 2, 0 }, { 3, 0 }, { 4, 0 }, { 5, 0 } };

            if (totalReviews == 0)
            {
                return new ReviewStatsDto
                {
                    AverageRating = 0,
                    TotalReviews = 0,
                    Distribution = distribution,
                    Percentages = percentages
                };
            }

            double sum = 0;
            foreach (var r in reviews)
            {
                var star = Math.Clamp(r.Rating, 1, 5);
                distribution[star]++;
                sum += r.Rating;
            }

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
            return result.DeletedCount > 0;
        }

        public async Task<bool> ModerateReviewAsync(string reviewId, string status)
        {
            var update = Builders<Review>.Update
                .Set(r => r.Status, status)
                .Set(r => r.UpdatedAt, DateTime.UtcNow);

            var result = await _context.Reviews.UpdateOneAsync(r => r.Id == reviewId, update);
            return result.ModifiedCount > 0;
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
