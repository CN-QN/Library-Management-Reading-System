using api.Common.Models;
using api.Modules.Catalog.DTOs;

namespace api.Modules.Catalog.Services
{
    public interface IReviewService
    {
        Task<PagedResult<ReviewResponseDto>> GetReviewsAsync(string bookId, int? ratingFilter, string sortBy = "newest", int page = 1, int pageSize = 10);
        Task<ReviewStatsDto> GetReviewStatsAsync(string bookId);
        Task<ReviewResponseDto?> GetUserReviewAsync(string bookId, string userId);
        Task<ReviewResponseDto> CreateReviewAsync(string userId, CreateReviewDto dto);
        Task<ReviewResponseDto?> UpdateReviewAsync(string reviewId, string userId, UpdateReviewDto dto);
        Task<bool> DeleteReviewAsync(string reviewId, string userId, bool isAdmin = false);
        Task<bool> ModerateReviewAsync(string reviewId, string status);
    }
}
