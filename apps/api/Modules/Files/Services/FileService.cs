using api.Database.Entities;
using api.Modules.Files.DTOs;
using api.Modules.Files.Services;
using api.Repositories.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;

namespace api.Modules.Files.Services
{
    public class FileService : IFileService
    {
        private readonly IMongoCollection<FileAsset> _fileCollection;
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<FileService> _logger;
        private readonly IBookRepository _bookRepository;

        // Cấu hình
        private const long MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
        private readonly string[] ALLOWED_IMAGE_EXTENSIONS = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        private readonly string[] ALLOWED_DOCUMENT_EXTENSIONS = { ".pdf", ".epub" };

        public FileService(
            IMongoDatabase database,
            IWebHostEnvironment environment,
            ILogger<FileService> logger,
            IBookRepository bookRepository)
        {
            _fileCollection = database.GetCollection<FileAsset>("fileAssets");
            _environment = environment;
            _logger = logger;
            _bookRepository = bookRepository;
        }

        public async Task<FileUploadResponseDto> UploadFileAsync(
            IFormFile file,
            FileUploadRequestDto request,
            string userId)
        {
            // 1. Validate file
            ValidateFile(file, request.FileType);

            // 2. Tạo tên file unique
            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
            var relativePath = GetStoragePath(request.FileType, uniqueFileName);
            var absolutePath = Path.Combine(_environment.WebRootPath, relativePath);

            // 3. Đảm bảo thư mục tồn tại
            var directory = Path.GetDirectoryName(absolutePath);
            if (!Directory.Exists(directory))
            {
                Directory.CreateDirectory(directory!);
            }

            // 4. Lưu file
            using (var stream = new FileStream(absolutePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // 5. Tạo URL
            var fileUrl = $"/{relativePath.Replace("\\", "/")}";

            // 6. Tạo entity
            var fileAsset = new FileAsset
            {
                FileName = uniqueFileName,
                OriginalFileName = file.FileName,
                FilePath = absolutePath,
                FileUrl = fileUrl,
                FileType = request.FileType,
                MimeType = file.ContentType,
                FileSize = file.Length,
                BookId = request.BookId,
                ChapterId = request.ChapterId,
                IsPublic = request.IsPublic,
                Description = request.Description,
                CreatedBy = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Metadata = new Dictionary<string, string>
                {
                    ["originalName"] = file.FileName,
                    ["extension"] = fileExtension
                }
            };

            await _fileCollection.InsertOneAsync(fileAsset);

            // 7. Cập nhật Book entity nếu là cover
            if (request.FileType == "COVER" && !string.IsNullOrEmpty(request.BookId))
            {
                await UpdateBookCoverAsync(request.BookId, fileUrl);
            }

            _logger.LogInformation($"File uploaded: {file.FileName} by user {userId}");

            return MapToResponseDto(fileAsset);
        }

        public async Task<List<FileUploadResponseDto>> UploadMultipleFilesAsync(
            List<IFormFile> files,
            FileUploadRequestDto request,
            string userId)
        {
            var results = new List<FileUploadResponseDto>();
            var errors = new List<string>();

            foreach (var file in files)
            {
                try
                {
                    var result = await UploadFileAsync(file, request, userId);
                    results.Add(result);
                }
                catch (Exception ex)
                {
                    errors.Add($"Failed to upload {file.FileName}: {ex.Message}");
                    _logger.LogError(ex, $"Error uploading file {file.FileName}");
                }
            }

            if (errors.Any())
            {
                _logger.LogWarning($"Some files failed to upload: {string.Join(", ", errors)}");
            }

            return results;
        }

        public async Task<FileUploadResponseDto?> GetFileByIdAsync(string fileId)
        {
            var file = await _fileCollection
                .Find(f => f.Id == fileId)
                .FirstOrDefaultAsync();

            return file == null ? null : MapToResponseDto(file);
        }

        public async Task<List<FileUploadResponseDto>> GetFilesByBookIdAsync(string bookId)
        {
            var files = await _fileCollection
                .Find(f => f.BookId == bookId)
                .Sort(Builders<FileAsset>.Sort.Descending(f => f.CreatedAt))
                .ToListAsync();

            return files.Select(MapToResponseDto).ToList();
        }

        public async Task<List<FileUploadResponseDto>> GetFilesByChapterIdAsync(string chapterId)
        {
            var files = await _fileCollection
                .Find(f => f.ChapterId == chapterId)
                .Sort(Builders<FileAsset>.Sort.Descending(f => f.CreatedAt))
                .ToListAsync();

            return files.Select(MapToResponseDto).ToList();
        }

        public async Task<bool> DeleteFileAsync(string fileId, string userId)
        {
            var file = await _fileCollection
                .Find(f => f.Id == fileId)
                .FirstOrDefaultAsync();

            if (file == null)
                return false;

            // Xóa file vật lý
            try
            {
                if (File.Exists(file.FilePath))
                {
                    File.Delete(file.FilePath);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to delete physical file: {file.FilePath}");
            }

            // Xóa trong database
            var result = await _fileCollection.DeleteOneAsync(f => f.Id == fileId);

            // Nếu là cover của sách, cập nhật Book entity
            if (file.FileType == "COVER" && !string.IsNullOrEmpty(file.BookId))
            {
                await RemoveBookCoverAsync(file.BookId);
            }

            _logger.LogInformation($"File deleted: {file.OriginalFileName} by user {userId}");

            return result.DeletedCount > 0;
        }

        public async Task<FileUploadResponseDto?> UpdateFileInfoAsync(
            string fileId,
            string? description,
            bool? isPublic,
            string userId)
        {
            var file = await _fileCollection
                .Find(f => f.Id == fileId)
                .FirstOrDefaultAsync();

            if (file == null)
                return null;

            if (description != null)
                file.Description = description;

            if (isPublic.HasValue)
                file.IsPublic = isPublic.Value;

            file.UpdatedAt = DateTime.UtcNow;

            await _fileCollection.ReplaceOneAsync(
                f => f.Id == fileId,
                file
            );

            _logger.LogInformation($"File info updated: {fileId} by user {userId}");

            return MapToResponseDto(file);
        }

        public async Task<FileUploadResponseDto?> GetBookCoverAsync(string bookId)
        {
            var file = await _fileCollection
                .Find(f => f.BookId == bookId && f.FileType == "COVER")
                .Sort(Builders<FileAsset>.Sort.Descending(f => f.CreatedAt))
                .FirstOrDefaultAsync();

            return file == null ? null : MapToResponseDto(file);
        }

        public async Task<FileUploadResponseDto?> GetBookContentAsync(string bookId, string contentType)
        {
            var file = await _fileCollection
                .Find(f => f.BookId == bookId && f.FileType == contentType)
                .Sort(Builders<FileAsset>.Sort.Descending(f => f.CreatedAt))
                .FirstOrDefaultAsync();

            return file == null ? null : MapToResponseDto(file);
        }

        public async Task<bool> FileExistsAsync(string fileId)
        {
            var count = await _fileCollection
                .CountDocumentsAsync(f => f.Id == fileId);

            return count > 0;
        }

        // ============== Private Methods ==============

        private void ValidateFile(IFormFile file, string fileType)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("No file uploaded.");

            if (file.Length > MAX_FILE_SIZE)
                throw new ArgumentException($"File size exceeds maximum limit of {MAX_FILE_SIZE / 1024 / 1024}MB.");

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

            if (fileType == "COVER" || fileType == "AVATAR")
            {
                if (!ALLOWED_IMAGE_EXTENSIONS.Contains(extension))
                    throw new ArgumentException($"Only image files ({string.Join(", ", ALLOWED_IMAGE_EXTENSIONS)}) are allowed.");
            }
            else if (fileType == "PDF" || fileType == "EPUB" || fileType == "CONTENT")
            {
                if (!ALLOWED_DOCUMENT_EXTENSIONS.Contains(extension))
                    throw new ArgumentException($"Only {string.Join(", ", ALLOWED_DOCUMENT_EXTENSIONS)} files are allowed.");
            }
        }

        private string GetStoragePath(string fileType, string fileName)
        {
            var subFolder = fileType.ToLowerInvariant();

            if (fileType == "COVER")
                subFolder = "covers";
            else if (fileType == "PDF" || fileType == "EPUB" || fileType == "CONTENT")
                subFolder = "contents";
            else if (fileType == "AVATAR")
                subFolder = "avatars";
            else
                subFolder = "attachments";

            var dateFolder = DateTime.UtcNow.ToString("yyyy-MM");
            return Path.Combine("uploads", subFolder, dateFolder, fileName);
        }

        private async Task UpdateBookCoverAsync(string bookId, string coverUrl)
        {
            try
            {
                var book = await _bookRepository.GetByIdAsync(bookId);
                if (book != null)
                {
                    // Giả sử Book entity có property CoverUrl
                    // Cần thêm vào Book entity: public string? CoverUrl { get; set; }
                    // book.CoverUrl = coverUrl;
                    // await _bookRepository.UpdateAsync(bookId, book);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to update book cover for {bookId}");
            }
        }

        private async Task RemoveBookCoverAsync(string bookId)
        {
            try
            {
                var book = await _bookRepository.GetByIdAsync(bookId);
                if (book != null)
                {
                    // book.CoverUrl = null;
                    // await _bookRepository.UpdateAsync(bookId, book);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to remove book cover for {bookId}");
            }
        }

        private FileUploadResponseDto MapToResponseDto(FileAsset file)
        {
            return new FileUploadResponseDto
            {
                FileId = file.Id,
                FileName = file.OriginalFileName,
                FileUrl = file.FileUrl,
                FileType = file.FileType,
                FileSize = file.FileSize,
                BookId = file.BookId,
                UploadedAt = file.CreatedAt
            };
        }
    }
}