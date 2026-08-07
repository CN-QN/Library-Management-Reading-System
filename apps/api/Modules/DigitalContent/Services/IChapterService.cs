using api.Database.Entities;
using api.Modules.DigitalContent.DTOs;

namespace api.Modules.DigitalContent.Services
{
    public interface IChapterService
    {
        /// <summary>
        /// Lấy thông tin chapter theo ID
        /// </summary>
        Task<BookChapter?> GetByIdAsync(string bookId, string chapterId);

        /// <summary>
        /// Lấy danh sách chapter của một sách
        /// </summary>
        Task<List<BookChapter>> GetByBookIdAsync(string bookId);

        /// <summary>
        /// Lấy số thứ tự đề xuất cho chapter mới của một sách.
        /// </summary>
        Task<int> GetNextNumberAsync(string bookId);

        /// <summary>
        /// Lấy nội dung chapter
        /// </summary>
        Task<ChapterContentDto?> GetContentAsync(string bookId, string chapterId);

        /// <summary>
        /// Tạo chapter mới
        /// </summary>
        Task<BookChapter> CreateAsync(string bookId, CreateChapterDto dto, string userId);

        /// <summary>
        /// Cập nhật chapter
        /// </summary>
        Task<BookChapter?> UpdateAsync(string bookId, string chapterId, UpdateChapterDto dto, string userId);

        /// <summary>
        /// Xuất bản chapter
        /// </summary>
        Task<BookChapter?> PublishAsync(string bookId, string chapterId, string userId);

        /// <summary>
        /// Xóa chapter (archive)
        /// </summary>
        Task<bool> DeleteAsync(string bookId, string chapterId);

        /// <summary>
        /// Đổi thứ tự các chapter
        /// </summary>
        Task<bool> ReorderChaptersAsync(string bookId, List<string> orderedChapterIds);
    }
}
