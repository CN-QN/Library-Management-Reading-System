using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using api.Modules.Files.DTOs;
using api.Modules.Files.Services;
using api.Common.Models;
using System.Security.Claims;
using api.Auth;             
using api.Common.Constants;  
namespace api.Modules.Files.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class FilesController : ControllerBase
    {
        private readonly IFileService _fileService;
        private readonly ILogger<FilesController> _logger;

        public FilesController(
            IFileService fileService,
            ILogger<FilesController> logger)
        {
            _fileService = fileService;
            _logger = logger;
        }

        /// <summary>
        /// Upload file
        /// </summary>
        [HttpPost("upload")]
        [RequirePermission(Permissions.FileManage)]  
        public async Task<IActionResult> UploadFile(
            IFormFile file,
            [FromForm] string? bookId,
            [FromForm] string? chapterId,
            [FromForm] string fileType,
            [FromForm] string? description,
            [FromForm] bool isPublic = true)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";

                var request = new FileUploadRequestDto
                {
                    BookId = bookId,
                    ChapterId = chapterId,
                    FileType = fileType,
                    Description = description,
                    IsPublic = isPublic
                };

                var result = await _fileService.UploadFileAsync(file, request, userId);

                return Ok(ApiResponse<FileUploadResponseDto>.SuccessResponse(
                    result,
                    "File uploaded successfully"
                ));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(400, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading file");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while uploading the file"));
            }
        }

        /// <summary>
        /// Upload nhiều file
        /// </summary>
        [HttpPost("upload-multiple")]
        [RequirePermission(Permissions.FileManage)]  
        public async Task<IActionResult> UploadMultipleFiles(
            List<IFormFile> files,
            [FromForm] string? bookId,
            [FromForm] string? chapterId,
            [FromForm] string fileType,
            [FromForm] string? description,
            [FromForm] bool isPublic = true)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";

                var request = new FileUploadRequestDto
                {
                    BookId = bookId,
                    ChapterId = chapterId,
                    FileType = fileType,
                    Description = description,
                    IsPublic = isPublic
                };

                var results = await _fileService.UploadMultipleFilesAsync(files, request, userId);

                return Ok(ApiResponse<List<FileUploadResponseDto>>.SuccessResponse(
                    results,
                    $"{results.Count} files uploaded successfully"
                ));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(400, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading multiple files");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while uploading files"));
            }
        }

        /// <summary>
        /// Upload ảnh bìa cho sách
        /// </summary>
        [HttpPost("upload-cover/{bookId}")]
        [RequirePermission(Permissions.FileManage)]  
        public async Task<IActionResult> UploadCover(
            string bookId,
            IFormFile file)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";

                var request = new FileUploadRequestDto
                {
                    BookId = bookId,
                    FileType = "COVER",
                    Description = $"Cover image for book {bookId}",
                    IsPublic = true
                };

                var result = await _fileService.UploadFileAsync(file, request, userId);

                return Ok(ApiResponse<FileUploadResponseDto>.SuccessResponse(
                    result,
                    "Cover uploaded successfully"
                ));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(400, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error uploading cover for book {bookId}");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while uploading the cover"));
            }
        }

        /// <summary>
        /// Upload nội dung số cho sách (PDF/EPUB)
        /// </summary>
        [HttpPost("upload-content/{bookId}")]
        [RequirePermission(Permissions.FileManage)] 
        public async Task<IActionResult> UploadContent(
            string bookId,
            IFormFile file,
            [FromForm] string contentType = "PDF") // PDF hoặc EPUB
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";

                var request = new FileUploadRequestDto
                {
                    BookId = bookId,
                    FileType = contentType,
                    Description = $"{contentType} content for book {bookId}",
                    IsPublic = true
                };

                var result = await _fileService.UploadFileAsync(file, request, userId);

                return Ok(ApiResponse<FileUploadResponseDto>.SuccessResponse(
                    result,
                    $"{contentType} uploaded successfully"
                ));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(400, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error uploading {contentType} for book {bookId}");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, $"An error occurred while uploading the {contentType}"));
            }
        }

        /// <summary>
        /// Lấy thông tin file
        /// </summary>
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetFile(string id)
        {
            try
            {
                var file = await _fileService.GetFileByIdAsync(id);
                if (file == null)
                    return NotFound(ApiResponse<object>.ErrorResponse(404, "File not found"));

                return Ok(ApiResponse<FileUploadResponseDto>.SuccessResponse(
                    file,
                    "File info retrieved successfully"
                ));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting file {id}");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while retrieving the file"));
            }
        }

        /// <summary>
        /// Lấy danh sách file của sách
        /// </summary>
        [HttpGet("book/{bookId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetFilesByBook(string bookId)
        {
            try
            {
                var files = await _fileService.GetFilesByBookIdAsync(bookId);

                return Ok(ApiResponse<List<FileUploadResponseDto>>.SuccessResponse(
                    files,
                    "Files retrieved successfully"
                ));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting files for book {bookId}");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while retrieving files"));
            }
        }

        /// <summary>
        /// Lấy ảnh bìa của sách
        /// </summary>
        [HttpGet("book/{bookId}/cover")]
        [AllowAnonymous]
        public async Task<IActionResult> GetBookCover(string bookId)
        {
            try
            {
                var cover = await _fileService.GetBookCoverAsync(bookId);
                if (cover == null)
                    return NotFound(ApiResponse<object>.ErrorResponse(404, "Cover not found"));

                return Ok(ApiResponse<FileUploadResponseDto>.SuccessResponse(
                    cover,
                    "Cover retrieved successfully"
                ));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting cover for book {bookId}");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while retrieving the cover"));
            }
        }

        /// <summary>
        /// Lấy nội dung số của sách (PDF/EPUB)
        /// </summary>
        [HttpGet("book/{bookId}/content")]
        [AllowAnonymous]
        public async Task<IActionResult> GetBookContent(
            string bookId,
            [FromQuery] string contentType = "PDF")
        {
            try
            {
                var content = await _fileService.GetBookContentAsync(bookId, contentType);
                if (content == null)
                    return NotFound(ApiResponse<object>.ErrorResponse(404, $"{contentType} not found"));

                return Ok(ApiResponse<FileUploadResponseDto>.SuccessResponse(
                    content,
                    $"{contentType} retrieved successfully"
                ));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting {contentType} for book {bookId}");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, $"An error occurred while retrieving the {contentType}"));
            }
        }

        /// <summary>
        /// Cập nhật thông tin file
        /// </summary>
        [HttpPatch("{id}")]
        [RequirePermission(Permissions.FileManage)] 
        public async Task<IActionResult> UpdateFile(
            string id,
            [FromBody] UpdateFileRequestDto request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
                var file = await _fileService.UpdateFileInfoAsync(
                    id,
                    request.Description,
                    request.IsPublic,
                    userId
                );

                if (file == null)
                    return NotFound(ApiResponse<object>.ErrorResponse(404, "File not found"));

                return Ok(ApiResponse<FileUploadResponseDto>.SuccessResponse(
                    file,
                    "File updated successfully"
                ));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating file {id}");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while updating the file"));
            }
        }

        /// <summary>
        /// Xóa file
        /// </summary>
        [HttpDelete("{id}")]
        [RequirePermission(Permissions.FileManage)]  
        public async Task<IActionResult> DeleteFile(string id)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
                var result = await _fileService.DeleteFileAsync(id, userId);

                if (!result)
                    return NotFound(ApiResponse<object>.ErrorResponse(404, "File not found"));

                return Ok(ApiResponse.SuccessResponse("File deleted successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting file {id}");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while deleting the file"));
            }
        }
    }
}