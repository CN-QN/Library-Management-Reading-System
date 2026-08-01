using api.Common.Models;
using api.Database;
using api.Database.Entities;
using api.Repositories.Interfaces;
using MongoDB.Driver;

namespace api.Repositories.Implementations
{
    public class NotificationRepository : INotificationRepository
    {
        private readonly IMongoCollection<Notification> _notifications;

        public NotificationRepository(MongoDbContext dbContext)
        {
            _notifications = dbContext.Notifications;
        }

        public async Task<PagedResult<Notification>> GetUserNotificationsAsync(string userId, int page, int limit, bool? isRead = null)
        {
            var builder = Builders<Notification>.Filter;
            var filter = builder.Eq(n => n.UserId, userId);

            if (isRead.HasValue)
            {
                filter = builder.And(filter, builder.Eq(n => n.IsRead, isRead.Value));
            }

            var totalItems = await _notifications.CountDocumentsAsync(filter);
            
            var items = await _notifications.Find(filter)
                .SortByDescending(n => n.CreatedAt)
                .Skip((page - 1) * limit)
                .Limit(limit)
                .ToListAsync();

            return new PagedResult<Notification>(items, page, limit, totalItems);
        }

        public async Task<int> GetUnreadCountAsync(string userId)
        {
            var builder = Builders<Notification>.Filter;
            var filter = builder.And(
                builder.Eq(n => n.UserId, userId),
                builder.Eq(n => n.IsRead, false)
            );
            var count = await _notifications.CountDocumentsAsync(filter);
            return (int)count;
        }

        public async Task<Notification?> GetByIdAsync(string id)
        {
            return await _notifications.Find(n => n.Id == id).FirstOrDefaultAsync();
        }

        public async Task CreateAsync(Notification notification)
        {
            await _notifications.InsertOneAsync(notification);
        }

        public async Task CreateManyAsync(List<Notification> notifications)
        {
            if (notifications == null || !notifications.Any()) return;
            await _notifications.InsertManyAsync(notifications);
        }

        public async Task UpdateAsync(Notification notification)
        {
            await _notifications.ReplaceOneAsync(n => n.Id == notification.Id, notification);
        }

        public async Task MarkAllAsReadAsync(string userId)
        {
            var filter = Builders<Notification>.Filter.And(
                Builders<Notification>.Filter.Eq(n => n.UserId, userId),
                Builders<Notification>.Filter.Eq(n => n.IsRead, false)
            );

            var update = Builders<Notification>.Update
                .Set(n => n.IsRead, true)
                .Set(n => n.ReadAt, DateTime.UtcNow);

            await _notifications.UpdateManyAsync(filter, update);
        }

        public async Task DeleteAsync(string id)
        {
            await _notifications.DeleteOneAsync(n => n.Id == id);
        }
    }
}
