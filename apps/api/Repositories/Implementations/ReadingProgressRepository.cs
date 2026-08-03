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
            
            // Generate id if it's new
            if (string.IsNullOrEmpty(progress.Id))
            {
                progress.Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
            }

            await _progressesCollection.ReplaceOneAsync(
                filter,
                progress,
                new ReplaceOptions { IsUpsert = true }
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

                if (string.IsNullOrEmpty(progress.Id))
                {
                    progress.Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
                }

                writes.Add(new ReplaceOneModel<ReadingProgress>(filter, progress)
                {
                    IsUpsert = true
                });
            }

            await _progressesCollection.BulkWriteAsync(writes);
        }
    }
}
