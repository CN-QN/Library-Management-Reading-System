using System.Text.Json;
using api.Database;
using api.Database.Entities;
using MongoDB.Driver;
using StackExchange.Redis;

namespace api.Modules.DigitalContent.Services;

public class ReadingProgressBufferDto
{
    public string BookId { get; set; } = string.Empty;
    public string ChapterId { get; set; } = string.Empty;
    public double ScrollPosition { get; set; }
    public double Percentage { get; set; }
    public DateTime LastReadAt { get; set; } = DateTime.UtcNow;
}

public interface IRedisReadingBufferService
{
    Task SaveProgressToBufferAsync(string userId, string bookId, ReadingProgressBufferDto progress);
    Task<ReadingProgressBufferDto?> GetProgressFromBufferAsync(string userId, string bookId);
    Task<bool> FlushBufferToMongoAsync(string userId, string bookId);
}

public class RedisReadingBufferService : IRedisReadingBufferService
{
    private readonly RedisContext _redisContext;
    private readonly MongoDbContext _mongoContext;
    private readonly ILogger<RedisReadingBufferService> _logger;

    public RedisReadingBufferService(
        RedisContext redisContext,
        MongoDbContext mongoContext,
        ILogger<RedisReadingBufferService> logger)
    {
        _redisContext = redisContext;
        _mongoContext = mongoContext;
        _logger = logger;
    }

    public async Task SaveProgressToBufferAsync(string userId, string bookId, ReadingProgressBufferDto progress)
    {
        var key = $"reading_buffer:{userId}:{bookId}";
        progress.LastReadAt = DateTime.UtcNow;

        try
        {
            var db = _redisContext.GetDatabase();
            var jsonPayload = JsonSerializer.Serialize(progress);

            // Ghi tức thì vào Redis RAM với tốc độ < 1ms, giữ trong 24 giờ
            await db.StringSetAsync(key, jsonPayload, TimeSpan.FromHours(24));
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Lỗi khi lưu tiến độ đọc sách vào Redis Buffer cho user {UserId}, book {BookId}", userId, bookId);
        }
    }

    public async Task<ReadingProgressBufferDto?> GetProgressFromBufferAsync(string userId, string bookId)
    {
        var key = $"reading_buffer:{userId}:{bookId}";

        try
        {
            var db = _redisContext.GetDatabase();
            var cachedData = await db.StringGetAsync(key);

            // 1. CACHE HIT: Tìm thấy tiến độ tạm trong Redis RAM (< 1ms)
            if (!cachedData.IsNull)
            {
                return JsonSerializer.Deserialize<ReadingProgressBufferDto>(cachedData!);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Lỗi khi đọc Redis Buffer cho user {UserId}, book {BookId}", userId, bookId);
        }

        // 2. CACHE MISS: Đọc từ CSDL MongoDB
        var mongoRecord = await _mongoContext.ReadingProgresses
            .Find(p => p.UserId == userId && p.BookId == bookId)
            .FirstOrDefaultAsync();

        if (mongoRecord == null) return null;

        return new ReadingProgressBufferDto
        {
            BookId = mongoRecord.BookId,
            ChapterId = mongoRecord.ChapterId,
            ScrollPosition = mongoRecord.ScrollPosition,
            Percentage = mongoRecord.Percentage,
            LastReadAt = mongoRecord.LastReadAt
        };
    }

    public async Task<bool> FlushBufferToMongoAsync(string userId, string bookId)
    {
        var key = $"reading_buffer:{userId}:{bookId}";

        try
        {
            var db = _redisContext.GetDatabase();
            var cachedData = await db.StringGetAsync(key);

            if (cachedData.IsNull)
            {
                return false;
            }

            var progress = JsonSerializer.Deserialize<ReadingProgressBufferDto>(cachedData!);
            if (progress == null) return false;

            // Đồng bộ (Flush) bản ghi mới nhất từ Redis RAM xuống MongoDB
            var filter = Builders<ReadingProgress>.Filter.Where(p => p.UserId == userId && p.BookId == bookId);
            var update = Builders<ReadingProgress>.Update
                .Set(p => p.ChapterId, progress.ChapterId)
                .Set(p => p.ScrollPosition, progress.ScrollPosition)
                .Set(p => p.Percentage, progress.Percentage)
                .Set(p => p.LastReadAt, DateTime.UtcNow)
                .SetOnInsert(p => p.UserId, userId)
                .SetOnInsert(p => p.BookId, bookId);

            var options = new UpdateOptions { IsUpsert = true };
            await _mongoContext.ReadingProgresses.UpdateOneAsync(filter, update, options);

            _logger.LogInformation("Đã Flush thành công tiến độ đọc sách từ Redis RAM xuống MongoDB cho user {UserId}, book {BookId}", userId, bookId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi Flush tiến độ từ Redis RAM xuống MongoDB cho user {UserId}, book {BookId}", userId, bookId);
            return false;
        }
    }
}
