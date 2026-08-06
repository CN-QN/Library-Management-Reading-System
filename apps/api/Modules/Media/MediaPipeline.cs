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

namespace api.Modules.Media;

public sealed record ProcessedMedia(byte[] Bytes, int Width, int Height, string MimeType, string Format, string Extension);
public sealed record CloudinaryUploadResult(string PublicId, string SecureUrl);

public interface IMediaProcessor { Task<ProcessedMedia> ProcessAsync(Stream input, string usageType, CancellationToken cancellationToken); }
public interface ICloudinaryClient
{
    Task<CloudinaryUploadResult> UploadAsync(ProcessedMedia media, string fileName, CancellationToken cancellationToken);
    Task DeleteAsync(string publicId, CancellationToken cancellationToken);
}

public sealed class ImageSharpMediaProcessor : IMediaProcessor
{
    private static readonly Dictionary<string, (int Width, int Height, int Quality)> Profiles = new(StringComparer.OrdinalIgnoreCase)
    {
        ["banner"] = (1920, 1080, 84), ["book-cover"] = (1200, 1800, 86),
        ["avatar"] = (512, 512, 82), ["generic-media"] = (2048, 2048, 84),
    };

    public async Task<ProcessedMedia> ProcessAsync(Stream input, string usageType, CancellationToken cancellationToken)
    {
        if (!Profiles.TryGetValue(usageType, out var profile)) throw new ArgumentException("Usage type không hợp lệ.");
        using var image = await Image.LoadAsync(input, cancellationToken);
        if (image.Width < 1 || image.Height < 1 || image.Width > 12000 || image.Height > 12000) throw new ArgumentException("Kích thước ảnh không hợp lệ.");
        image.Mutate(x => x.AutoOrient().Resize(new ResizeOptions { Mode = ResizeMode.Max, Size = new Size(profile.Width, profile.Height) }));
        image.Metadata.ExifProfile = null; image.Metadata.IccProfile = null; image.Metadata.XmpProfile = null;
        await using var output = new MemoryStream();
        await image.SaveAsJpegAsync(output, new JpegEncoder { Quality = profile.Quality }, cancellationToken);
        return new ProcessedMedia(output.ToArray(), image.Width, image.Height, "image/jpeg", "jpeg", ".jpg");
    }
}

public sealed class CloudinaryClient : ICloudinaryClient
{
    private readonly HttpClient _http; private readonly CloudinarySettings _settings; private readonly MongoDbContext _context;
    public CloudinaryClient(HttpClient http, IOptions<CloudinarySettings> settings, MongoDbContext context) { _http = http; _settings = settings.Value; _context = context; }
    public async Task<CloudinaryUploadResult> UploadAsync(ProcessedMedia media, string fileName, CancellationToken cancellationToken)
    {
        var settings = await EffectiveSettings(cancellationToken); EnsureConfigured(settings); var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(); var signature = Sign($"timestamp={timestamp}", settings.ApiSecret);
        using var form = new MultipartFormDataContent();
        var bytes = new ByteArrayContent(media.Bytes); bytes.Headers.ContentType = new(media.MimeType); form.Add(bytes, "file", Path.GetFileNameWithoutExtension(fileName) + media.Extension);
        form.Add(new StringContent(settings.ApiKey), "api_key"); form.Add(new StringContent(timestamp), "timestamp"); form.Add(new StringContent(signature), "signature");
        using var response = await _http.PostAsync($"https://api.cloudinary.com/v1_1/{settings.CloudName}/image/upload", form, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken); if (!response.IsSuccessStatusCode) throw new InvalidOperationException("Cloudinary upload failed.");
        using var json = JsonDocument.Parse(body); return new(json.RootElement.GetProperty("public_id").GetString()!, json.RootElement.GetProperty("secure_url").GetString()!);
    }
    public async Task DeleteAsync(string publicId, CancellationToken cancellationToken)
    {
        var settings = await EffectiveSettings(cancellationToken); EnsureConfigured(settings); var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(); var signature = Sign($"public_id={publicId}&timestamp={timestamp}", settings.ApiSecret);
        using var form = new FormUrlEncodedContent(new Dictionary<string, string> { ["public_id"] = publicId, ["api_key"] = settings.ApiKey, ["timestamp"] = timestamp, ["signature"] = signature });
        using var response = await _http.PostAsync($"https://api.cloudinary.com/v1_1/{settings.CloudName}/image/destroy", form, cancellationToken); if (!response.IsSuccessStatusCode) throw new InvalidOperationException("Cloudinary delete failed.");
    }
    private async Task<CloudinarySettings> EffectiveSettings(CancellationToken cancellationToken)
    {
        var stored = await _context.SystemSettings.Find(x => x.Scope == "CLOUDINARY").ToListAsync(cancellationToken);
        string Value(string key, string fallback) => stored.FirstOrDefault(x => x.Key == key)?.Value is { Length: > 0 } value ? value : fallback;
        return new CloudinarySettings { CloudName = Value("CLOUDINARY_CLOUD_NAME", _settings.CloudName), ApiKey = Value("CLOUDINARY_API_KEY", _settings.ApiKey), ApiSecret = Value("CLOUDINARY_API_SECRET", _settings.ApiSecret), UploadPreset = _settings.UploadPreset };
    }
    private static void EnsureConfigured(CloudinarySettings settings) { if (string.IsNullOrWhiteSpace(settings.CloudName) || string.IsNullOrWhiteSpace(settings.ApiKey) || string.IsNullOrWhiteSpace(settings.ApiSecret)) throw new InvalidOperationException("Cloudinary is not configured."); }
    private static string Sign(string value, string secret) => Convert.ToHexString(SHA1.HashData(Encoding.UTF8.GetBytes(value + secret))).ToLowerInvariant();
}
