using api.Database.Entities;
using api.Repositories.Interfaces;
using MongoDB.Driver;

namespace api.Repositories.Implementations
{
    public class ReservationRepository : IReservationRepository
    {
        private readonly IMongoCollection<Reservation> _collection;

        public ReservationRepository(IMongoDatabase database)
        {
            _collection = database.GetCollection<Reservation>("reservations");
        }

        public async Task<Reservation?> GetByIdAsync(string id)
        {
            var filter = Builders<Reservation>.Filter.Eq(r => r.Id, id);
            return await _collection.Find(filter).FirstOrDefaultAsync();
        }

        public async Task<List<Reservation>> GetActiveByBookIdAsync(string bookId)
        {
            var filter = Builders<Reservation>.Filter.And(
                Builders<Reservation>.Filter.Eq(r => r.BookId, bookId),
                Builders<Reservation>.Filter.In(r => r.Status, new[] { "WAITING", "READY" })
            );
            return await _collection.Find(filter)
                .Sort(Builders<Reservation>.Sort.Ascending(r => r.QueuePosition))
                .ToListAsync();
        }

        public async Task<Reservation?> GetActiveByUserIdAndBookIdAsync(string userId, string bookId)
        {
            var filter = Builders<Reservation>.Filter.And(
                Builders<Reservation>.Filter.Eq(r => r.UserId, userId),
                Builders<Reservation>.Filter.Eq(r => r.BookId, bookId),
                Builders<Reservation>.Filter.In(r => r.Status, new[] { "WAITING", "READY" })
            );
            return await _collection.Find(filter).FirstOrDefaultAsync();
        }

        public async Task<int> GetNextQueuePositionAsync(string bookId)
        {
            var activeReservations = await GetActiveByBookIdAsync(bookId);
            return activeReservations.Any() ? activeReservations.Max(r => r.QueuePosition) + 1 : 1;
        }

        public async Task<(List<Reservation> Items, long Total)> SearchAsync(string? userId, string? bookId, string? branchId, string? status, int page, int limit)
        {
            var builder = Builders<Reservation>.Filter;
            var filter = builder.Empty;

            if (!string.IsNullOrEmpty(userId))
            {
                filter &= builder.Eq(r => r.UserId, userId);
            }

            if (!string.IsNullOrEmpty(bookId))
            {
                filter &= builder.Eq(r => r.BookId, bookId);
            }

            if (!string.IsNullOrEmpty(branchId))
            {
                filter &= builder.Eq(r => r.BranchId, branchId);
            }

            if (!string.IsNullOrEmpty(status))
            {
                filter &= builder.Eq(r => r.Status, status);
            }

            var total = await _collection.CountDocumentsAsync(filter);
            var skip = (page - 1) * limit;
            var items = await _collection.Find(filter)
                .Skip(skip)
                .Limit(limit)
                .Sort(Builders<Reservation>.Sort.Descending(r => r.ReservedAt))
                .ToListAsync();

            return (items, total);
        }

        public async Task InsertAsync(Reservation reservation)
        {
            await _collection.InsertOneAsync(reservation);
        }

        public async Task UpdateAsync(string id, Reservation reservation)
        {
            var filter = Builders<Reservation>.Filter.Eq(r => r.Id, id);
            await _collection.ReplaceOneAsync(filter, reservation);
        }

        public async Task UpdateQueuePositionsAsync(string bookId)
        {
            var active = await GetActiveByBookIdAsync(bookId);
            for (int i = 0; i < active.Count; i++)
            {
                var item = active[i];
                if (item.QueuePosition != i + 1)
                {
                    item.QueuePosition = i + 1;
                    await UpdateAsync(item.Id, item);
                }
            }
        }

        public async Task<List<Reservation>> GetExpiredReadyReservationsAsync()
        {
            var now = DateTime.UtcNow;
            var filter = Builders<Reservation>.Filter.And(
                Builders<Reservation>.Filter.Eq(r => r.Status, "READY"),
                Builders<Reservation>.Filter.Lt(r => r.ReadyUntil, now)
            );
            return await _collection.Find(filter).ToListAsync();
        }
    }
}
