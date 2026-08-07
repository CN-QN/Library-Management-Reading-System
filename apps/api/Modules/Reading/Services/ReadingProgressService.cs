using api.Database;
using api.Database.Entities;
using api.Modules.Reading.DTOs;
using api.Repositories.Interfaces;
using StackExchange.Redis;

namespace api.Modules.Reading.Services
{
    public class ReadingProgressService : IReadingProgressService
    {
        private readonly IReadingProgressRepository _progressRepository;
        private readonly IReadingSessionRepository _sessionRepository;
        private readonly IBookRepository _bookRepository;

        private readonly RedisContext _redisContext;
        private readonly ILogger<ReadingProgressService> _logger;

        public ReadingProgressService(
            IReadingProgressRepository progressRepository,
            IReadingSessionRepository sessionRepository,
            IBookRepository bookRepository,
            RedisContext redisContext,
            ILogger<ReadingProgressService> logger)
        {
            _progressRepository = progressRepository;
            _sessionRepository = sessionRepository;
            _bookRepository = bookRepository;
            _redisContext = redisContext;
            _logger = logger;
        }

        public async Task<ReadingProgressResponseDto> SaveProgressAsync(string userId, SaveReadingProgressDto dto)
        {
            // Validate Book
            var book = await _bookRepository.GetByIdAsync(dto.BookId);
            if (book == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy sách có ID: {dto.BookId}");
            }

            // Validate Chapter
            var chapter = await _bookRepository.GetChapterByIdAsync(dto.BookId, dto.ChapterId);
            if (chapter == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy chương có ID: {dto.ChapterId}");
            }



            var db = _redisContext.GetDatabase();
            var hashKey = $"reading_progress:{userId}:{dto.BookId}";

            // Version checks on Redis
            var existingVersionVal = await db.HashGetAsync(hashKey, "version");
            if (existingVersionVal.HasValue && long.TryParse(existingVersionVal, out var redisVersion))
            {
                if (dto.Version < redisVersion)
                {
                    _logger.LogWarning("Conflict detected on Redis for key {HashKey}. Incoming version {InVersion} < Redis version {RedisVersion}. Returning Redis version.", hashKey, dto.Version, redisVersion);
                    return await ParseProgressFromRedisHashAsync(db, hashKey, userId, dto.BookId);
                }
            }

            // Version checks on MongoDB (in case Redis cache missed but MongoDB has newer version)
            var mongoProgress = await _progressRepository.GetByUserIdAndBookIdAsync(userId, dto.BookId);
            if (mongoProgress != null && dto.Version < mongoProgress.Version)
            {
                _logger.LogWarning("Conflict detected on MongoDB for user {UserId}, book {BookId}. Incoming version {InVersion} < DB version {DbVersion}. Synced to Redis and returning DB version.", userId, dto.BookId, dto.Version, mongoProgress.Version);
                
                // Write DB version back to Redis cache to keep them synced
                await SaveProgressToRedisCacheAsync(db, hashKey, mongoProgress);
                
                return MapToResponse(mongoProgress);
            }

            // Save to Redis Hash
            var entries = new HashEntry[]
            {
                new HashEntry("chapterId", dto.ChapterId),
                new HashEntry("chapterNumber", dto.ChapterNumber),
                new HashEntry("scrollPosition", dto.ScrollPosition.ToString()),
                new HashEntry("percentage", dto.Percentage.ToString()),
                new HashEntry("status", dto.Status),
                new HashEntry("lastReadAt", DateTime.UtcNow.ToString("O")),
                new HashEntry("version", dto.Version.ToString())
            };

            await db.HashSetAsync(hashKey, entries);
            await db.KeyExpireAsync(hashKey, TimeSpan.FromDays(7));

            // Mark key as dirty
            await db.SetAddAsync("reading_progress:dirty", hashKey);

            return new ReadingProgressResponseDto
            {
                Id = mongoProgress?.Id ?? string.Empty,
                UserId = userId,
                BookId = dto.BookId,
                ChapterId = dto.ChapterId,
                ChapterNumber = dto.ChapterNumber,
                ScrollPosition = dto.ScrollPosition,
                Percentage = dto.Percentage,
                Status = dto.Status,
                LastReadAt = DateTime.UtcNow,
                Version = dto.Version
            };
        }

        public async Task<ReadingProgressResponseDto?> GetProgressAsync(string userId, string bookId)
        {
            var db = _redisContext.GetDatabase();
            var hashKey = $"reading_progress:{userId}:{bookId}";

            // Cache Hit
            if (await db.KeyExistsAsync(hashKey))
            {
                return await ParseProgressFromRedisHashAsync(db, hashKey, userId, bookId);
            }

            // Cache Miss -> MongoDB
            var progress = await _progressRepository.GetByUserIdAndBookIdAsync(userId, bookId);
            if (progress != null)
            {
                // Write back to Redis cache
                await SaveProgressToRedisCacheAsync(db, hashKey, progress);
                return MapToResponse(progress);
            }

            return null;
        }

        public async Task<ReadingSessionResponseDto> StartReadingSessionAsync(string userId, StartReadingSessionDto dto)
        {
            // Validate Book
            var book = await _bookRepository.GetByIdAsync(dto.BookId);
            if (book == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy sách có ID: {dto.BookId}");
            }

            // Validate Chapter
            var chapter = await _bookRepository.GetChapterByIdAsync(dto.BookId, dto.ChapterId);
            if (chapter == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy chương có ID: {dto.ChapterId}");
            }

            var sessionId = Guid.NewGuid().ToString();
            var session = new ReadingSession
            {
                UserId = userId,
                SessionId = sessionId,
                BookId = dto.BookId,
                ChapterId = dto.ChapterId,
                StartedAt = DateTime.UtcNow,
                LastHeartbeatAt = DateTime.UtcNow,
                EndedAt = null,
                DurationSeconds = 0,
                Device = dto.Device
            };

            await _sessionRepository.InsertAsync(session);

            return MapToResponse(session);
        }

        public async Task<ReadingSessionResponseDto> HeartbeatSessionAsync(string sessionId)
        {
            var session = await _sessionRepository.GetBySessionIdAsync(sessionId);
            if (session == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy phiên đọc với SessionId: {sessionId}");
            }

            if (session.EndedAt.HasValue)
            {
                throw new InvalidOperationException("Phiên đọc này đã kết thúc.");
            }

            session.LastHeartbeatAt = DateTime.UtcNow;
            session.DurationSeconds = (int)(session.LastHeartbeatAt - session.StartedAt).TotalSeconds;

            await _sessionRepository.UpdateAsync(session);

            return MapToResponse(session);
        }

        public async Task<ReadingSessionResponseDto> EndReadingSessionAsync(string sessionId)
        {
            var session = await _sessionRepository.GetBySessionIdAsync(sessionId);
            if (session == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy phiên đọc với SessionId: {sessionId}");
            }

            if (!session.EndedAt.HasValue)
            {
                session.EndedAt = DateTime.UtcNow;
                session.LastHeartbeatAt = session.EndedAt.Value;
                session.DurationSeconds = (int)(session.EndedAt.Value - session.StartedAt).TotalSeconds;

                await _sessionRepository.UpdateAsync(session);
            }

            return MapToResponse(session);
        }

        #region Helpers

        private async Task<ReadingProgressResponseDto> ParseProgressFromRedisHashAsync(IDatabase db, string hashKey, string userId, string bookId)
        {
            var chapterId = await db.HashGetAsync(hashKey, "chapterId");
            var chapterNumber = await db.HashGetAsync(hashKey, "chapterNumber");
            var scrollPosition = await db.HashGetAsync(hashKey, "scrollPosition");
            var percentage = await db.HashGetAsync(hashKey, "percentage");
            var status = await db.HashGetAsync(hashKey, "status");
            var lastReadAtStr = await db.HashGetAsync(hashKey, "lastReadAt");
            var version = await db.HashGetAsync(hashKey, "version");

            return new ReadingProgressResponseDto
            {
                UserId = userId,
                BookId = bookId,
                ChapterId = chapterId.ToString(),
                ChapterNumber = int.TryParse(chapterNumber, out var cNum) ? cNum : 0,
                ScrollPosition = double.TryParse(scrollPosition, out var scroll) ? scroll : 0.0,
                Percentage = double.TryParse(percentage, out var pct) ? pct : 0.0,
                Status = status.ToString(),
                LastReadAt = DateTime.TryParse(lastReadAtStr, out var readAt) ? readAt : DateTime.UtcNow,
                Version = long.TryParse(version, out var ver) ? ver : 1
            };
        }

        private async Task SaveProgressToRedisCacheAsync(IDatabase db, string hashKey, ReadingProgress progress)
        {
            var entries = new HashEntry[]
            {
                new HashEntry("chapterId", progress.ChapterId),
                new HashEntry("chapterNumber", progress.ChapterNumber),
                new HashEntry("scrollPosition", progress.ScrollPosition.ToString()),
                new HashEntry("percentage", progress.Percentage.ToString()),
                new HashEntry("status", progress.Status),
                new HashEntry("lastReadAt", progress.LastReadAt.ToString("O")),
                new HashEntry("version", progress.Version.ToString())
            };

            await db.HashSetAsync(hashKey, entries);
            await db.KeyExpireAsync(hashKey, TimeSpan.FromDays(7));
        }

        private ReadingProgressResponseDto MapToResponse(ReadingProgress progress)
        {
            return new ReadingProgressResponseDto
            {
                Id = progress.Id,
                UserId = progress.UserId,
                BookId = progress.BookId,
                ChapterId = progress.ChapterId,
                ChapterNumber = progress.ChapterNumber,
                ScrollPosition = progress.ScrollPosition,
                Percentage = progress.Percentage,
                Status = progress.Status,
                LastReadAt = progress.LastReadAt,
                Version = progress.Version
            };
        }

        private ReadingSessionResponseDto MapToResponse(ReadingSession session)
        {
            return new ReadingSessionResponseDto
            {
                Id = session.Id,
                UserId = session.UserId,
                SessionId = session.SessionId,
                BookId = session.BookId,
                ChapterId = session.ChapterId,
                StartedAt = session.StartedAt,
                LastHeartbeatAt = session.LastHeartbeatAt,
                EndedAt = session.EndedAt,
                DurationSeconds = session.DurationSeconds,
                Device = session.Device
            };
        }

        #endregion

        public async Task DeleteProgressAsync(string userId, string bookId)
        {
            // Delete from MongoDB
            await _progressRepository.DeleteByUserIdAndBookIdAsync(userId, bookId);

            // Delete from Redis Cache
            var db = _redisContext.GetDatabase();
            var hashKey = $"reading_progress:{userId}:{bookId}";
            await db.KeyDeleteAsync(hashKey);

            // Remove from dirty set
            await db.SetRemoveAsync("reading_progress:dirty", hashKey);
        }
    }
}
