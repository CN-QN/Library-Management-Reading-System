using api.Database.Entities;
using api.Repositories.Interfaces;
using MongoDB.Driver;

namespace api.Repositories.Implementations
{
    public class ReadingSessionRepository : IReadingSessionRepository
    {
        private readonly IMongoCollection<ReadingSession> _sessionsCollection;

        public ReadingSessionRepository(IMongoDatabase database)
        {
            _sessionsCollection = database.GetCollection<ReadingSession>("reading_sessions");
        }

        public async Task<ReadingSession?> GetBySessionIdAsync(string sessionId)
        {
            var filter = Builders<ReadingSession>.Filter.Eq(s => s.SessionId, sessionId);
            return await _sessionsCollection.Find(filter).FirstOrDefaultAsync();
        }

        public async Task InsertAsync(ReadingSession session)
        {
            if (string.IsNullOrEmpty(session.Id))
            {
                session.Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
            }
            await _sessionsCollection.InsertOneAsync(session);
        }

        public async Task UpdateAsync(ReadingSession session)
        {
            var filter = Builders<ReadingSession>.Filter.Eq(s => s.Id, session.Id);
            await _sessionsCollection.ReplaceOneAsync(filter, session);
        }
    }
}
