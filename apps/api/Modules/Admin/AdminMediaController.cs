using System.Security.Claims;
using api.Auth;
using api.Common.Constants;
using api.Common.Models;
using api.Database;
using api.Database.Entities;
using api.Modules.Media;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using SixLabors.ImageSharp;

namespace api.Modules.Admin;

[ApiController, Route("api/admin/media"), RequirePermission(Permissions.FileManage)]
public sealed class AdminMediaController : ControllerBase
{
    private readonly ILogger<AdminMediaController> _logger;
    private const long MaxInputBytes = 10 * 1024 * 1024;
    private readonly MongoDbContext _context;
    private readonly IMediaProcessor _processor;
    private readonly ICloudinaryClient _cloudinary;

    public AdminMediaController(
        MongoDbContext context,
        IMediaProcessor processor,
        ICloudinaryClient cloudinary,
        ILogger<AdminMediaController> logger)
    {
        _context = context;
        _processor = processor;
        _cloudinary = cloudinary;
        _logger = logger;
    }

    [HttpPost("upload"), RequestSizeLimit(MaxInputBytes)]
    public async Task<IActionResult> Upload(
        IFormFile file,
        [FromForm] string usageType = "generic-media",
        [FromForm] string category = "general",
        [FromForm] string? description = null,
        [FromForm] string? referenceId = null,
        CancellationToken cancellationToken = default)
    {
        if (file is null || file.Length == 0 || file.Length > MaxInputBytes)
            return BadRequest(ApiResponse.ErrorResponse(400, "Tệp ảnh rỗng hoặc vượt quá 10 MB."));

        ProcessedMedia processed;
        try
        {
            await using var stream = file.OpenReadStream();
            processed = await _processor.ProcessAsync(stream, usageType, cancellationToken);
        }
        catch (Exception ex) when (ex is ArgumentException or UnknownImageFormatException or InvalidImageContentException)
        {
            return BadRequest(ApiResponse.ErrorResponse(400, "Tệp không phải ảnh hợp lệ."));
        }

        CloudinaryUploadResult uploaded;
        try
        {
            uploaded = await _cloudinary.UploadAsync(processed, file.FileName, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Cloudinary upload failed. Falling back to local storage.");

            var localFileName = "local_" + global::System.Guid.NewGuid().ToString() + processed.Extension;
            var localPath = global::System.IO.Path.Combine(global::System.IO.Directory.GetCurrentDirectory(), "uploads", localFileName);
            var directory = global::System.IO.Path.GetDirectoryName(localPath);
            if (!global::System.IO.Directory.Exists(directory))
            {
                global::System.IO.Directory.CreateDirectory(directory!);
            }

            await global::System.IO.File.WriteAllBytesAsync(localPath, processed.Bytes, cancellationToken);

            var request = HttpContext.Request;
            var host = request.Host.Value;
            var scheme = request.Scheme;
            var localUrl = $"{scheme}://{host}/uploads/{localFileName}";

            uploaded = new CloudinaryUploadResult(localFileName, localUrl);
        }

        var asset = new FileAsset
        {
            FileName = global::System.IO.Path.GetFileNameWithoutExtension(file.FileName) + processed.Extension,
            OriginalFileName = global::System.IO.Path.GetFileName(file.FileName),
            FilePath = uploaded.PublicId,
            FileUrl = uploaded.SecureUrl,
            CloudinaryPublicId = uploaded.PublicId,
            FileType = usageType == "book-cover" ? "COVER" : usageType == "avatar" ? "AVATAR" : "IMAGE",
            MimeType = processed.MimeType,
            Format = processed.Format,
            FileSize = processed.Bytes.LongLength,
            Width = processed.Width,
            Height = processed.Height,
            Category = category.Trim().ToLowerInvariant(),
            UsageType = usageType.Trim().ToLowerInvariant(),
            Description = description,
            BookId = usageType == "book-cover" ? referenceId : null,
            UserId = usageType == "avatar" ? referenceId : null,
            CreatedBy = User.FindFirstValue(ClaimTypes.NameIdentifier)
        };

        try
        {
            await _context.FileAssets.InsertOneAsync(asset, cancellationToken: cancellationToken);
        }
        catch
        {
            await _cloudinary.DeleteAsync(uploaded.PublicId, cancellationToken);
            throw;
        }

        if (usageType == "book-cover" && !string.IsNullOrWhiteSpace(referenceId))
        {
            await _context.Books.UpdateOneAsync(
                x => x.Id == referenceId,
                Builders<Book>.Update
                    .Set(x => x.CoverAssetId, asset.Id)
                    .Set(x => x.UpdatedAt, DateTime.UtcNow),
                cancellationToken: cancellationToken);
        }

        return Ok(ApiResponse<FileAsset>.SuccessResponse(asset));
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? category, [FromQuery] string? usageType, [FromQuery] int page = 1, [FromQuery] int pageSize = 24)
    {
        page = Math.Max(1, page); pageSize = Math.Clamp(pageSize, 1, 100); var f = Builders<FileAsset>.Filter.Empty;
        if (!string.IsNullOrWhiteSpace(category)) f &= Builders<FileAsset>.Filter.Eq(x => x.Category, category.ToLowerInvariant());
        if (!string.IsNullOrWhiteSpace(usageType)) f &= Builders<FileAsset>.Filter.Eq(x => x.UsageType, usageType.ToLowerInvariant());
        var total = await _context.FileAssets.CountDocumentsAsync(f); var items = await _context.FileAssets.Find(f).SortByDescending(x => x.CreatedAt).Skip((page - 1) * pageSize).Limit(pageSize).ToListAsync();
        return Ok(ApiResponse<PagedResult<FileAsset>>.SuccessResponse(new(items, page, pageSize, total)));
    }

    [HttpGet("{id}")] public async Task<IActionResult> Get(string id) { var asset = await _context.FileAssets.Find(x => x.Id == id).FirstOrDefaultAsync(); return asset is null ? NotFound(ApiResponse.ErrorResponse(404, "Không tìm thấy media.")) : Ok(ApiResponse<FileAsset>.SuccessResponse(asset)); }
    [HttpDelete("{id}")] public async Task<IActionResult> Delete(string id, CancellationToken cancellationToken)
    {
        var asset = await _context.FileAssets.Find(x => x.Id == id).FirstOrDefaultAsync(cancellationToken); if (asset is null) return NotFound(ApiResponse.ErrorResponse(404, "Không tìm thấy media."));
        if (await _context.Banners.Find(x => x.MediaId == id).AnyAsync(cancellationToken)
            || await _context.Books.Find(x => x.CoverAssetId == id).AnyAsync(cancellationToken))
            return Conflict(ApiResponse.ErrorResponse(409, "Media đang được sử dụng; hãy gỡ liên kết trước khi xóa."));
        await _cloudinary.DeleteAsync(asset.CloudinaryPublicId, cancellationToken); await _context.FileAssets.DeleteOneAsync(x => x.Id == id, cancellationToken); return Ok(ApiResponse.SuccessResponse());
    }
}
