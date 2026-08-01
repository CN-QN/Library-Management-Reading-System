using api.Common.Models;
using api.Database;
using api.Database.Entities;
using api.Modules.Notifications.DTOs;
using api.Repositories.Interfaces;
using MongoDB.Driver;

namespace api.Modules.Notifications.Services
{
    public class NotificationService : INotificationService
    {
        private readonly INotificationRepository _repository;
        private readonly IMongoCollection<User> _users;

        public NotificationService(INotificationRepository repository, MongoDbContext dbContext)
        {
            _repository = repository;
            _users = dbContext.Users;
        }

        public async Task<PagedResult<NotificationResponseDto>> GetUserNotificationsAsync(string userId, int page, int limit, bool? isRead = null)
        {
            var result = await _repository.GetUserNotificationsAsync(userId, page, limit, isRead);
            
            var dtos = result.Items.Select(MapToResponseDto).ToList();
            
            return new PagedResult<NotificationResponseDto>(dtos, result.Page, result.Limit, result.TotalItems);
        }

        public async Task<int> GetUnreadCountAsync(string userId)
        {
            return await _repository.GetUnreadCountAsync(userId);
        }

        public async Task<NotificationResponseDto> MarkAsReadAsync(string userId, string id)
        {
            var notification = await _repository.GetByIdAsync(id);
            if (notification == null)
            {
                throw new KeyNotFoundException("Không tìm thấy thông báo.");
            }

            if (notification.UserId != userId)
            {
                throw new UnauthorizedAccessException("Bạn không có quyền thao tác trên thông báo này.");
            }

            if (!notification.IsRead)
            {
                notification.IsRead = true;
                notification.ReadAt = DateTime.UtcNow;
                await _repository.UpdateAsync(notification);
            }

            return MapToResponseDto(notification);
        }

        public async Task MarkAllAsReadAsync(string userId)
        {
            await _repository.MarkAllAsReadAsync(userId);
        }

        public async Task<NotificationResponseDto> SendNotificationAsync(SendNotificationDto dto)
        {
            // Kiểm tra xem User nhận có tồn tại không
            var userExists = await _users.Find(u => u.Id == dto.UserId).AnyAsync();
            if (!userExists)
            {
                throw new KeyNotFoundException("Người nhận thông báo không tồn tại trong hệ thống.");
            }

            var notification = new Notification
            {
                UserId = dto.UserId,
                Title = dto.Title,
                Message = dto.Message,
                Type = dto.Type,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            await _repository.CreateAsync(notification);
            return MapToResponseDto(notification);
        }

        public async Task BroadcastNotificationAsync(BroadcastNotificationDto dto)
        {
            // Lấy danh sách ID của tất cả người dùng đang hoạt động (ACTIVE)
            var userIds = await _users.Find(u => u.Status == "ACTIVE")
                .Project(u => u.Id)
                .ToListAsync();

            if (!userIds.Any()) return;

            var notifications = userIds.Select(userId => new Notification
            {
                UserId = userId,
                Title = dto.Title,
                Message = dto.Message,
                Type = dto.Type,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            }).ToList();

            await _repository.CreateManyAsync(notifications);
        }

        public async Task DeleteNotificationAsync(string userId, string id)
        {
            var notification = await _repository.GetByIdAsync(id);
            if (notification == null)
            {
                throw new KeyNotFoundException("Không tìm thấy thông báo.");
            }

            if (notification.UserId != userId)
            {
                throw new UnauthorizedAccessException("Bạn không có quyền xóa thông báo này.");
            }

            await _repository.DeleteAsync(id);
        }

        private NotificationResponseDto MapToResponseDto(Notification n)
        {
            return new NotificationResponseDto
            {
                Id = n.Id,
                Title = n.Title,
                Message = n.Message,
                Type = n.Type,
                IsRead = n.IsRead,
                CreatedAt = n.CreatedAt,
                ReadAt = n.ReadAt
            };
        }
    }
}
