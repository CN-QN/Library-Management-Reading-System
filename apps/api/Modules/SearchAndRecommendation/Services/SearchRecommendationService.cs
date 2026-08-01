using api.Common.Models;
using api.Database;
using api.Database.Entities;
using api.Modules.SearchAndRecommendation.DTOs;
using api.Repositories.Interfaces;
using StackExchange.Redis;
using System.Text.Json;

namespace api.Modules.SearchAndRecommendation.Services
{
    public class SearchRecommendationService : ISearchRecommendationService
    {
        private readonly ISearchRecommendationRepository _repository;
        private readonly IDatabase _redisDb;

        public SearchRecommendationService(ISearchRecommendationRepository repository, RedisContext redisContext)
        {
            _repository = repository;
            _redisDb = redisContext.GetDatabase();
        }

        public async Task<PagedResult<BookSearchDto>> SearchBooksAsync(BookSearchFilterDto filter)
        {
            return await _repository.SearchBooksAsync(filter);
        }

        public async Task<List<SearchSuggestionDto>> GetSearchSuggestionsAsync(string query)
        {
            return await _repository.GetSearchSuggestionsAsync(query);
        }

        public async Task<List<BookSearchDto>> GetTrendingBooksAsync(int limit)
        {
            string cacheKey = "trending_books";
            
            // 1. Kiểm tra cache Redis
            try
            {
                var cachedValue = await _redisDb.StringGetAsync(cacheKey);
                if (cachedValue.HasValue)
                {
                    return JsonSerializer.Deserialize<List<BookSearchDto>>(cachedValue!) ?? new List<BookSearchDto>();
                }
            }
            catch
            {
                // Bỏ qua lỗi Redis, tiếp tục query DB
            }

            // 2. Tính toán điểm thịnh hành
            var startDate = DateTime.UtcNow.AddDays(-7);
            var viewEvents = await _repository.GetViewEventsSinceAsync(startDate);
            var borrowings = await _repository.GetBorrowingsSinceAsync(startDate);

            var bookScores = new Dictionary<string, double>();

            // Tính điểm ViewEvent
            foreach (var ve in viewEvents)
            {
                if (string.IsNullOrEmpty(ve.BookId)) continue;
                double weight = ve.EventType == "READ" ? 2.0 : 1.0;
                bookScores[ve.BookId] = bookScores.GetValueOrDefault(ve.BookId) + weight;
            }

            // Tính điểm Borrowings
            if (borrowings.Any())
            {
                var borrowingIds = borrowings.Select(b => b.Id).ToList();
                var items = await _repository.GetBorrowingItemsByBorrowingIdsAsync(borrowingIds);
                if (items.Any())
                {
                    var copyIds = items.Select(i => i.CopyId).Distinct().ToList();
                    var copies = await _repository.GetCopiesByIdsAsync(copyIds);
                    var copyToBookMap = copies.ToDictionary(c => c.Id, c => c.BookId);

                    foreach (var item in items)
                    {
                        if (copyToBookMap.TryGetValue(item.CopyId, out var bookId))
                        {
                            bookScores[bookId] = bookScores.GetValueOrDefault(bookId) + 5.0; // 5 points per borrow
                        }
                    }
                }
            }

            var trendingBookIds = bookScores
                .OrderByDescending(x => x.Value)
                .Select(x => x.Key)
                .Take(limit)
                .ToList();

            // 3. Fallback nếu DB trống sự kiện
            if (trendingBookIds.Count < limit)
            {
                var allBooks = await _repository.GetGeneralRecommendationsAsync(50);
                var fallbackBooks = allBooks
                    .Select(b => new { BookId = b.Id, Score = (b.Stats?.ViewCount ?? 0) * 1.0 + (b.Stats?.ReadingCount ?? 0) * 2.0 })
                    .OrderByDescending(x => x.Score)
                    .Select(x => x.BookId)
                    .ToList();

                foreach (var fid in fallbackBooks)
                {
                    if (!trendingBookIds.Contains(fid))
                    {
                        trendingBookIds.Add(fid);
                        if (trendingBookIds.Count >= limit) break;
                    }
                }
            }

            // 4. Lấy chi tiết sách
            var trendingBooks = await _repository.GetBookDetailsByIdsAsync(trendingBookIds);

            // 5. Lưu vào cache Redis (TTL 10 phút)
            try
            {
                await _redisDb.StringSetAsync(cacheKey, JsonSerializer.Serialize(trendingBooks), TimeSpan.FromMinutes(10));
            }
            catch
            {
                // Bỏ qua lỗi Redis
            }

            return trendingBooks;
        }

        public async Task<List<BookSearchDto>> GetRecommendationsAsync(string? userId, int limit)
        {
            string cacheKey = string.IsNullOrEmpty(userId) ? "recommendations:guest" : $"recommendations:{userId}";

            // 1. Kiểm tra cache Redis
            try
            {
                var cachedValue = await _redisDb.StringGetAsync(cacheKey);
                if (cachedValue.HasValue)
                {
                    return JsonSerializer.Deserialize<List<BookSearchDto>>(cachedValue!) ?? new List<BookSearchDto>();
                }
            }
            catch
            {
                // Bỏ qua lỗi Redis
            }

            List<BookSearchDto> recommendations;

            if (string.IsNullOrEmpty(userId))
            {
                // Khách vãng lai -> Lấy sách đề xuất chung
                var generalBooks = await _repository.GetGeneralRecommendationsAsync(limit);
                recommendations = await _repository.GetBookDetailsByIdsAsync(generalBooks.Select(b => b.Id).ToList());
            }
            else
            {
                // Người dùng đã đăng nhập -> Đề xuất cá nhân hóa
                var readBookIds = await _repository.GetUserReadBookIdsAsync(userId);
                
                if (readBookIds.Any())
                {
                    var authorIds = await _repository.GetBookAuthorIdsAsync(readBookIds);
                    var categoryIds = await _repository.GetBookCategoryIdsAsync(readBookIds);

                    var similarBooks = await _repository.GetSimilarBooksAsync(authorIds, categoryIds, readBookIds, limit);
                    var recommendedBookIds = similarBooks.Select(b => b.Id).ToList();

                    // Nếu chưa đủ số lượng đề xuất, điền thêm bằng sách đề xuất chung
                    if (recommendedBookIds.Count < limit)
                    {
                        var generalBooks = await _repository.GetGeneralRecommendationsAsync(limit * 2);
                        foreach (var b in generalBooks)
                        {
                            if (!readBookIds.Contains(b.Id) && !recommendedBookIds.Contains(b.Id))
                            {
                                recommendedBookIds.Add(b.Id);
                                if (recommendedBookIds.Count >= limit) break;
                            }
                        }
                    }

                    recommendations = await _repository.GetBookDetailsByIdsAsync(recommendedBookIds);
                }
                else
                {
                    // Chưa đọc cuốn nào -> Gợi ý chung
                    var generalBooks = await _repository.GetGeneralRecommendationsAsync(limit);
                    recommendations = await _repository.GetBookDetailsByIdsAsync(generalBooks.Select(b => b.Id).ToList());
                }
            }

            // 2. Lưu vào cache Redis (TTL 10 phút)
            try
            {
                await _redisDb.StringSetAsync(cacheKey, JsonSerializer.Serialize(recommendations), TimeSpan.FromMinutes(10));
            }
            catch
            {
                // Bỏ qua lỗi Redis
            }

            return recommendations;
        }
    }
}
