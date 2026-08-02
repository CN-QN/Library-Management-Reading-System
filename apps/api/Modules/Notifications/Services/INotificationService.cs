using api.Common.Models;
using api.Modules.Notifications.DTOs;

namespace api.Modules.Notifications.Services
{
    public interface INotificationService
    {
        Task<PagedResult<NotificationResponseDto>> GetUserNotificationsAsync(string userId, int page, int limit, bool? isRead = null);
        Task<int> GetUnreadCountAsync(string userId);
        Task<NotificationResponseDto> MarkAsReadAsync(string userId, string id);
        Task MarkAllAsReadAsync(string userId);
        Task<NotificationResponseDto> SendNotificationAsync(SendNotificationDto dto);
        Task BroadcastNotificationAsync(BroadcastNotificationDto dto);
        Task DeleteNotificationAsync(string userId, string id);
    }
}
