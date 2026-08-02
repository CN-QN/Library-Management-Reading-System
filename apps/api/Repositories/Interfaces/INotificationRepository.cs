using api.Common.Models;
using api.Database.Entities;

namespace api.Repositories.Interfaces
{
    public interface INotificationRepository
    {
        Task<PagedResult<Notification>> GetUserNotificationsAsync(string userId, int page, int limit, bool? isRead = null);
        Task<int> GetUnreadCountAsync(string userId);
        Task<Notification?> GetByIdAsync(string id);
        Task CreateAsync(Notification notification);
        Task CreateManyAsync(List<Notification> notifications);
        Task UpdateAsync(Notification notification);
        Task MarkAllAsReadAsync(string userId);
        Task DeleteAsync(string id);
    }
}
