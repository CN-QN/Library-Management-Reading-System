using api.Modules.Catalog.DTOs.Requests;
using api.Modules.Catalog.DTOs.Responses;
using api.Common.Models;

namespace api.Modules.Catalog.Services
{
    public interface IBookService
    {
        Task<BookResponseDto?> GetByIdAsync(string id);
        Task<BookResponseDto?> GetBySlugAsync(string slug);
        Task<PagedResult<BookResponseDto>> SearchAsync(BookQueryDto query);
        Task<List<BookResponseDto>> GetTrendingAsync(int limit);
        Task<List<BookResponseDto>> GetNewReleasesAsync(int limit);
        Task<BookResponseDto> CreateAsync(CreateBookDto dto, string userId);
        Task<BookResponseDto?> UpdateAsync(string id, UpdateBookDto dto, string userId);
        Task<BookResponseDto?> UpdateStatusAsync(string id, string status, string userId);
        Task<bool> DeleteAsync(string id);
        Task IncrementViewAsync(string id);
        Task<bool> ValidateSlugAsync(string slug);
        Task<bool> ValidateISBNAsync(string isbn);
    }
}