using System.Security.Claims;
using api.Common.Models;
using api.Database;
using api.Database.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using SixLabors.ImageSharp;

namespace api.Modules.Media;

[ApiController, Route("api/media"), Authorize]
public sealed class UserMediaController : ControllerBase
{
    private readonly MongoDbContext _context; private readonly IMediaProcessor _processor; private readonly ICloudinaryClient _cloudinary;
    public UserMediaController(MongoDbContext context, IMediaProcessor processor, ICloudinaryClient cloudinary) { _context = context; _processor = processor; _cloudinary = cloudinary; }
    [HttpPost("avatar"), RequestSizeLimit(5 * 1024 * 1024)]
    public async Task<IActionResult> Avatar(IFormFile file, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier); if (string.IsNullOrWhiteSpace(userId)) return Unauthorized(ApiResponse.ErrorResponse(401, "Chưa đăng nhập."));
        if (file is null || file.Length == 0 || file.Length > 5 * 1024 * 1024) return BadRequest(ApiResponse.ErrorResponse(400, "Ảnh đại diện không hợp lệ."));
        ProcessedMedia media; try { await using var stream = file.OpenReadStream(); media = await _processor.ProcessAsync(stream, "avatar", cancellationToken); } catch (Exception ex) when (ex is ArgumentException or UnknownImageFormatException or InvalidImageContentException) { return BadRequest(ApiResponse.ErrorResponse(400, "Tệp không phải ảnh hợp lệ.")); }
        CloudinaryUploadResult uploaded;
        try 
        {
            uploaded = await _cloudinary.UploadAsync(media, file.FileName, cancellationToken);
        }
        catch (Exception)
        {
            return StatusCode(500, ApiResponse.ErrorResponse(500, "Chức năng thay đổi ảnh đại diện đang bị lỗi! Vui lòng thử lại sau!"));
        }
        var asset = new FileAsset { FileName = Path.GetFileNameWithoutExtension(file.FileName) + media.Extension, OriginalFileName = Path.GetFileName(file.FileName), FilePath = uploaded.PublicId, FileUrl = uploaded.SecureUrl, CloudinaryPublicId = uploaded.PublicId, FileType = "AVATAR", MimeType = media.MimeType, Format = media.Format, FileSize = media.Bytes.LongLength, Width = media.Width, Height = media.Height, Category = "avatar", UsageType = "avatar", UserId = userId, CreatedBy = userId };
        try { await _context.FileAssets.InsertOneAsync(asset, cancellationToken: cancellationToken); await _context.Users.UpdateOneAsync(x => x.Id == userId, Builders<User>.Update.Set(x => x.Avatar, asset.FileUrl).Set(x => x.UpdatedAt, DateTime.UtcNow), cancellationToken: cancellationToken); } catch { await _cloudinary.DeleteAsync(uploaded.PublicId, cancellationToken); return StatusCode(500, ApiResponse.ErrorResponse(500, "Chức năng thay đổi ảnh đại diện đang bị lỗi! Vui lòng thử lại sau!")); }
        return Ok(ApiResponse<FileAsset>.SuccessResponse(asset));
    }
}
