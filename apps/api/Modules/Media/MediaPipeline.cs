using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using api.Configuration;
using Microsoft.Extensions.Options;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Processing;
using api.Database;
using MongoDB.Driver;
using Microsoft.AspNetCore.Http;

namespace api.Modules.Media;

public sealed record ProcessedMedia(byte[] Bytes, int Width, int Height, string MimeType, string Format, string Extension);
public sealed record CloudinaryUploadResult(string PublicId, string SecureUrl);

public interface IMediaProcessor
{
    Task<ProcessedMedia> ProcessAsync(
        Stream input,
        string usageType,
        CancellationToken cancellationToken);
}

public interface ICloudinaryClient
{
    Task<CloudinaryUploadResult> UploadAsync(
        ProcessedMedia media,
        string fileName,
        CancellationToken cancellationToken);

    Task DeleteAsync(string publicId, CancellationToken cancellationToken);
}

public sealed class ImageSharpMediaProcessor : IMediaProcessor
{
    private static readonly Dictionary<string, (int Width, int Height, int Quality)> Profiles = new(StringComparer.OrdinalIgnoreCase)
    {
        ["banner"]        = (1920, 1080, 84),
        ["book-cover"]    = (1200, 1800, 86),
        ["chapter-image"] = (2048, 2048, 86),
        ["avatar"]        = (512,  512,  82),
        ["generic-media"] = (2048, 2048, 84),
    };

    public async Task<ProcessedMedia> ProcessAsync(Stream input, string usageType, CancellationToken cancellationToken)
    {
        if (!Profiles.TryGetValue(usageType, out var profile))
            throw new ArgumentException($"Usage type '{usageType}' khong hop le.");

        using var image = await Image.LoadAsync(input, cancellationToken);
        if (image.Width < 1 || image.Height < 1 || image.Width > 12000 || image.Height > 12000)
            throw new ArgumentException("Kich thuoc anh khong hop le.");

        image.Mutate(x => x.AutoOrient().Resize(new ResizeOptions
        {
            Mode = ResizeMode.Max,
            Size = new Size(profile.Width, profile.Height)
        }));

        image.Metadata.ExifProfile = null;
        image.Metadata.IccProfile  = null;
        image.Metadata.XmpProfile  = null;

        await using var output = new MemoryStream();
        await image.SaveAsJpegAsync(output, new JpegEncoder { Quality = profile.Quality }, cancellationToken);
        return new ProcessedMedia(output.ToArray(), image.Width, image.Height, "image/jpeg", "jpeg", ".jpg");
    }
}

// =========================================================================
// MOCK CloudinaryClient - Thực tế lưu file cục bộ (Local Storage) thay vì Cloudinary
// =========================================================================
public sealed class CloudinaryClient : ICloudinaryClient
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<CloudinaryClient> _logger;

    public CloudinaryClient(IHttpContextAccessor httpContextAccessor, ILogger<CloudinaryClient> logger)
    {
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    public async Task<CloudinaryUploadResult> UploadAsync(
        ProcessedMedia media,
        string fileName,
        CancellationToken cancellationToken)
    {
        var uniqueFileName = "local_" + Guid.NewGuid().ToString() + media.Extension;
        var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
        
        if (!Directory.Exists(uploadsFolder))
        {
            Directory.CreateDirectory(uploadsFolder);
        }

        var filePath = Path.Combine(uploadsFolder, uniqueFileName);
        await File.WriteAllBytesAsync(filePath, media.Bytes, cancellationToken);

        // Sinh URL local dựa trên HTTP request hiện tại hoặc fallback về localhost:5210
        string scheme = "http";
        string host = "localhost:5210";

        var context = _httpContextAccessor.HttpContext;
        if (context != null)
        {
            scheme = context.Request.Scheme;
            host = context.Request.Host.Value;
        }

        var secureUrl = $"{scheme}://{host}/uploads/{uniqueFileName}";
        _logger.LogInformation("Saved media file locally: {Path} -> {Url}", filePath, secureUrl);

        return new CloudinaryUploadResult(uniqueFileName, secureUrl);
    }

    public async Task DeleteAsync(string publicId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(publicId))
            return;

        var filePath = Path.Combine(Directory.GetCurrentDirectory(), "uploads", publicId);
        if (File.Exists(filePath))
        {
            try
            {
                File.Delete(filePath);
                _logger.LogInformation("Deleted local media file: {Path}", filePath);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete local file: {Path}", filePath);
            }
        }
        await Task.CompletedTask;
    }
}
