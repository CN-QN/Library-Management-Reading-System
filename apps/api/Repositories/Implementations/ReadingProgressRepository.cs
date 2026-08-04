using api.Database.Entities;
using api.Repositories.Interfaces;
using MongoDB.Driver;

namespace api.Repositories.Implementations
{
    public class ReadingProgressRepository : IReadingProgressRepository
    {
        private readonly IMongoCollection<ReadingProgress> _progressesCollection;

        public ReadingProgressRepository(IMongoDatabase database)
        {
            _progressesCollection = database.GetCollection<ReadingProgress>("reading_progress");
        }

        public async Task<ReadingProgress?> GetByUserIdAndBookIdAsync(string userId, string bookId)
        {
            var filter = Builders<ReadingProgress>.Filter.And(
                Builders<ReadingProgress>.Filter.Eq(p => p.UserId, userId),
                Builders<ReadingProgress>.Filter.Eq(p => p.BookId, bookId)
            );
            return await _progressesCollection.Find(filter).FirstOrDefaultAsync();
        }

        public async Task<List<ReadingProgress>> GetByUserIdAsync(string userId)
        {
            var filter = Builders<ReadingProgress>.Filter.Eq(p => p.UserId, userId);
            return await _progressesCollection.Find(filter)
                .Sort(Builders<ReadingProgress>.Sort.Descending(p => p.LastReadAt))
                .ToListAsync();
        }

        public async Task UpsertAsync(ReadingProgress progress)
        {
            var filter = Builders<ReadingProgress>.Filter.And(
                Builders<ReadingProgress>.Filter.Eq(p => p.UserId, progress.UserId),
                Builders<ReadingProgress>.Filter.Eq(p => p.BookId, progress.BookId)
            );
            
            var update = Builders<ReadingProgress>.Update
                .Set(p => p.ChapterId, progress.ChapterId)
                .Set(p => p.ChapterNumber, progress.ChapterNumber)
                .Set(p => p.ScrollPosition, progress.ScrollPosition)
                .Set(p => p.Percentage, progress.Percentage)
                .Set(p => p.Status, progress.Status)
                .Set(p => p.Version, progress.Version)
                .Set(p => p.LastReadAt, progress.LastReadAt);

            await _progressesCollection.UpdateOneAsync(
                filter,
                update,
                new UpdateOptions { IsUpsert = true }
            );
        }

        public async Task BulkWriteAsync(List<ReadingProgress> progresses)
        {
            if (progresses == null || !progresses.Any()) return;

            var writes = new List<WriteModel<ReadingProgress>>();
            foreach (var progress in progresses)
            {
                var filter = Builders<ReadingProgress>.Filter.And(
                    Builders<ReadingProgress>.Filter.Eq(p => p.UserId, progress.UserId),
                    Builders<ReadingProgress>.Filter.Eq(p => p.BookId, progress.BookId)
                );

                var update = Builders<ReadingProgress>.Update
                    .Set(p => p.ChapterId, progress.ChapterId)
                    .Set(p => p.ChapterNumber, progress.ChapterNumber)
                    .Set(p => p.ScrollPosition, progress.ScrollPosition)
                    .Set(p => p.Percentage, progress.Percentage)
                    .Set(p => p.Status, progress.Status)
                    .Set(p => p.Version, progress.Version)
                    .Set(p => p.LastReadAt, progress.LastReadAt);

                writes.Add(new UpdateOneModel<ReadingProgress>(filter, update)
                {
                    IsUpsert = true
                });
            }

            await _progressesCollection.BulkWriteAsync(writes);
        }
    }
}
