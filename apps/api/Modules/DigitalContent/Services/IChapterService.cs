using api.Modules.DigitalContent.DTOs;

namespace api.Modules.DigitalContent.Services
{
    public interface IChapterService
    {
        /// <summary>
        /// Lấy thông tin chapter theo ID
        /// </summary>
        Task<ChapterResponseDto?> GetByIdAsync(string id);

        /// <summary>
        /// Lấy danh sách chapter của một sách
        /// </summary>
        Task<List<ChapterResponseDto>> GetByBookIdAsync(string bookId);

        /// <summary>
        /// Lấy nội dung chapter
        /// </summary>
        Task<ChapterContentDto?> GetContentAsync(string id);

        /// <summary>
        /// Lấy số chapter tiếp theo
        /// </summary>
        Task<int> GetNextChapterNumberAsync(string bookId);

        /// <summary>
        /// Tạo chapter mới
        /// </summary>
        Task<ChapterResponseDto> CreateAsync(CreateChapterDto dto, string userId);

        /// <summary>
        /// Cập nhật chapter
        /// </summary>
        Task<ChapterResponseDto?> UpdateAsync(string id, UpdateChapterDto dto, string userId);

        /// <summary>
        /// Xuất bản chapter
        /// </summary>
        Task<ChapterResponseDto?> PublishAsync(string id, string userId);

        /// <summary>
        /// Xóa chapter (archive)
        /// </summary>
        Task<bool> DeleteAsync(string id);

        /// <summary>
        /// Đổi thứ tự các chapter
        /// </summary>
        Task<bool> ReorderChaptersAsync(string bookId, List<string> orderedChapterIds);
    }
}