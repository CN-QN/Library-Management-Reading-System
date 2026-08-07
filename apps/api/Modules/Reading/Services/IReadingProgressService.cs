using api.Modules.Reading.DTOs;

namespace api.Modules.Reading.Services
{
    public interface IReadingProgressService
    {
        Task<ReadingProgressResponseDto> SaveProgressAsync(string userId, SaveReadingProgressDto dto);
        Task<ReadingProgressResponseDto?> GetProgressAsync(string userId, string bookId);
        Task<ReadingSessionResponseDto> StartReadingSessionAsync(string userId, StartReadingSessionDto dto);
        Task<ReadingSessionResponseDto> HeartbeatSessionAsync(string sessionId);
        Task<ReadingSessionResponseDto> EndReadingSessionAsync(string sessionId);
        Task DeleteProgressAsync(string userId, string bookId);
    }
}
