using api.Database;
using api.Database.Entities;
using api.Repositories.Interfaces;
using StackExchange.Redis;

namespace api.Workers
{
    public class ReadingProgressSyncWorker : BackgroundService
    {
        private readonly RedisContext _redisContext;
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<ReadingProgressSyncWorker> _logger;

        public ReadingProgressSyncWorker(
            RedisContext redisContext,
            IServiceProvider serviceProvider,
            ILogger<ReadingProgressSyncWorker> logger)
        {
            _redisContext = redisContext;
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("ReadingProgressSyncWorker started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await SyncProgressesAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred during reading progress sync.");
                }

                // Run every 30 seconds
                try
                {
                    await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
                }
                catch (TaskCanceledException)
                {
                    break;
                }
            }

            _logger.LogInformation("ReadingProgressSyncWorker stopped.");
        }

        private async Task SyncProgressesAsync()
        {
            var db = _redisContext.GetDatabase();
            var dirtyKeySet = "reading_progress:dirty";

            // Get all dirty progress keys
            var dirtyKeys = await db.SetMembersAsync(dirtyKeySet);
            if (dirtyKeys == null || dirtyKeys.Length == 0)
            {
                return;
            }

            _logger.LogInformation("Found {Count} dirty reading progress keys to sync.", dirtyKeys.Length);

            var progressesToSync = new List<ReadingProgress>();
            var processedKeys = new List<RedisValue>();

            foreach (var redisKey in dirtyKeys)
            {
                var keyStr = redisKey.ToString();
                var parts = keyStr.Split(':');
                if (parts.Length != 3)
                {
                    _logger.LogWarning("Invalid reading progress key format: {Key}", keyStr);
                    await db.SetRemoveAsync(dirtyKeySet, redisKey);
                    continue;
                }

                var userId = parts[1];
                var bookId = parts[2];

                if (!await db.KeyExistsAsync(keyStr))
                {
                    // Cache expired but key marked as dirty, just clean up set
                    await db.SetRemoveAsync(dirtyKeySet, redisKey);
                    continue;
                }

                var chapterId = await db.HashGetAsync(keyStr, "chapterId");
                var chapterNumber = await db.HashGetAsync(keyStr, "chapterNumber");
                var scrollPosition = await db.HashGetAsync(keyStr, "scrollPosition");
                var percentage = await db.HashGetAsync(keyStr, "percentage");
                var status = await db.HashGetAsync(keyStr, "status");
                var lastReadAtStr = await db.HashGetAsync(keyStr, "lastReadAt");
                var version = await db.HashGetAsync(keyStr, "version");

                if (!chapterId.HasValue) continue;

                var progress = new ReadingProgress
                {
                    UserId = userId,
                    BookId = bookId,
                    ChapterId = chapterId.ToString(),
                    ChapterNumber = int.TryParse(chapterNumber, out var cNum) ? cNum : 0,
                    ScrollPosition = double.TryParse(scrollPosition, out var scroll) ? scroll : 0.0,
                    Percentage = double.TryParse(percentage, out var pct) ? pct : 0.0,
                    Status = status.HasValue ? status.ToString() : "READING",
                    LastReadAt = DateTime.TryParse(lastReadAtStr, out var readAt) ? readAt : DateTime.UtcNow,
                    Version = long.TryParse(version, out var ver) ? ver : 1
                };

                progressesToSync.Add(progress);
                processedKeys.Add(redisKey);
            }

            if (progressesToSync.Any())
            {
                using (var scope = _serviceProvider.CreateScope())
                {
                    var progressRepository = scope.ServiceProvider.GetRequiredService<IReadingProgressRepository>();
                    await progressRepository.BulkWriteAsync(progressesToSync);
                }

                _logger.LogInformation("Successfully synced {Count} progress records to MongoDB.", progressesToSync.Count);

                // Remove from dirty set
                foreach (var key in processedKeys)
                {
                    await db.SetRemoveAsync(dirtyKeySet, key);
                }
            }
        }
    }
}
