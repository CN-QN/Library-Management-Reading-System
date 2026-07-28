using api.Modules.DigitalContent.DTOs;

namespace api.Modules.DigitalContent.Services
{
    public interface IChapterService
    {
        Task<ChapterResponseDto?> GetByIdAsync(string id);
        Task<List<ChapterResponseDto>> GetByBookIdAsync(string bookId);
        Task<ChapterContentDto?> GetContentAsync(string id);
        Task<ChapterResponseDto> CreateAsync(CreateChapterDto dto, string userId);
        Task<ChapterResponseDto?> UpdateAsync(string id, UpdateChapterDto dto, string userId);
        Task<ChapterResponseDto?> PublishAsync(string id, string userId);
        Task<bool> DeleteAsync(string id);
        Task<int> GetNextChapterNumberAsync(string bookId);
    }
}