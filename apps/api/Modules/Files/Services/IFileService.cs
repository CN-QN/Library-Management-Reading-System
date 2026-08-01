using api.Modules.Files.DTOs;
using Microsoft.AspNetCore.Http;

namespace api.Modules.Files.Services
{
    public interface IFileService
    {
        /// <summary>
        /// Upload file
        /// </summary>
        Task<FileUploadResponseDto> UploadFileAsync(
            IFormFile file,
            FileUploadRequestDto request,
            string userId);

        /// <summary>
        /// Upload nhiều file
        /// </summary>
        Task<List<FileUploadResponseDto>> UploadMultipleFilesAsync(
            List<IFormFile> files,
            FileUploadRequestDto request,
            string userId);

        /// <summary>
        /// Lấy thông tin file theo ID
        /// </summary>
        Task<FileUploadResponseDto?> GetFileByIdAsync(string fileId);

        /// <summary>
        /// Lấy danh sách file của sách
        /// </summary>
        Task<List<FileUploadResponseDto>> GetFilesByBookIdAsync(string bookId);

        /// <summary>
        /// Lấy danh sách file của chapter
        /// </summary>
        Task<List<FileUploadResponseDto>> GetFilesByChapterIdAsync(string chapterId);

        /// <summary>
        /// Xóa file
        /// </summary>
        Task<bool> DeleteFileAsync(string fileId, string userId);

        /// <summary>
        /// Cập nhật thông tin file
        /// </summary>
        Task<FileUploadResponseDto?> UpdateFileInfoAsync(
            string fileId,
            string? description,
            bool? isPublic,
            string userId);

        /// <summary>
        /// Lấy cover của sách
        /// </summary>
        Task<FileUploadResponseDto?> GetBookCoverAsync(string bookId);

        /// <summary>
        /// Lấy nội dung số của sách (PDF/EPUB)
        /// </summary>
        Task<FileUploadResponseDto?> GetBookContentAsync(string bookId, string contentType);

        /// <summary>
        /// Kiểm tra file có tồn tại không
        /// </summary>
        Task<bool> FileExistsAsync(string fileId);
    }
}