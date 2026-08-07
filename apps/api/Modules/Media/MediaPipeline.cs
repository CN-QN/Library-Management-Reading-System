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
        ["banner"] = (1920, 1080, 84),
        ["book-cover"] = (1200, 1800, 86),
        ["avatar"] = (512, 512, 82),
        ["generic-media"] = (2048, 2048, 84),
    };

    public async Task<ProcessedMedia> ProcessAsync(Stream input, string usageType, CancellationToken cancellationToken)
    {
        if (!Profiles.TryGetValue(usageType, out var profile))
            throw new ArgumentException($"Usage type '{usageType}' không hợp lệ.");

        using var image = await Image.LoadAsync(input, cancellationToken);
        if (image.Width < 1 || image.Height < 1 || image.Width > 12000 || image.Height > 12000)
            throw new ArgumentException("Kích thước ảnh không hợp lệ.");

        image.Mutate(x => x.AutoOrient().Resize(new ResizeOptions
        {
            Mode = ResizeMode.Max,
            Size = new Size(profile.Width, profile.Height)
        }));

        image.Metadata.ExifProfile = null;
        image.Metadata.IccProfile = null;
        image.Metadata.XmpProfile = null;

        await using var output = new MemoryStream();
        await image.SaveAsJpegAsync(output, new JpegEncoder { Quality = profile.Quality }, cancellationToken);
        return new ProcessedMedia(output.ToArray(), image.Width, image.Height, "image/jpeg", "jpeg", ".jpg");
    }
}

public sealed class CloudinaryClient : ICloudinaryClient
{
    private readonly HttpClient _http;
    private readonly CloudinarySettings _settings;
    private readonly MongoDbContext _context;

    public CloudinaryClient(HttpClient http, IOptions<CloudinarySettings> settings, MongoDbContext context)
    {
        _http = http;
        _settings = settings.Value;
        _context = context;
    }

    public async Task<CloudinaryUploadResult> UploadAsync(
        ProcessedMedia media,
        string fileName,
        CancellationToken cancellationToken)
    {
        var settings = await EffectiveSettings(cancellationToken);
        EnsureConfigured(settings);

        using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        cts.CancelAfter(TimeSpan.FromSeconds(25));

        var uploadPreset = !string.IsNullOrWhiteSpace(settings.UploadPreset) ? settings.UploadPreset : "ml_default";
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();

        Exception? signedException = null;

        // 1. Thử Signed Upload đầu tiên
        try
        {
            var signature = Sign($"timestamp={timestamp}", settings.ApiSecret);

            using var form = new MultipartFormDataContent();
            var bytes = new ByteArrayContent(media.Bytes);
            bytes.Headers.ContentType = new MediaTypeHeaderValue(media.MimeType);
            form.Add(bytes, "file", Path.GetFileNameWithoutExtension(fileName) + media.Extension);
            form.Add(new StringContent(settings.ApiKey), "api_key");
            form.Add(new StringContent(timestamp), "timestamp");
            form.Add(new StringContent(signature), "signature");

            using var response = await _http.PostAsync(
                $"https://api.cloudinary.com/v1_1/{settings.CloudName}/image/upload",
                form,
                cts.Token);

            var body = await response.Content.ReadAsStringAsync(cts.Token);

            if (response.IsSuccessStatusCode)
            {
                using var json = JsonDocument.Parse(body);
                var publicId = json.RootElement.GetProperty("public_id").GetString()!;
                var secureUrl = json.RootElement.GetProperty("secure_url").GetString()!;
                return new CloudinaryUploadResult(publicId, secureUrl);
            }

            signedException = new InvalidOperationException($"Signed Upload thất bại ({(int)response.StatusCode}): {body}");
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            throw new InvalidOperationException("Kết nối tới Cloudinary bị quá thời gian (Timeout 25s). Vui lòng kiểm tra lại kết nối mạng.");
        }
        catch (Exception ex)
        {
            signedException = ex;
            // Bỏ qua lỗi Signed để thử Unsigned fallback bên dưới
        }

        // 2. Fallback sang Unsigned Upload với UploadPreset
        try
        {
            using var form2 = new MultipartFormDataContent();
            var bytes2 = new ByteArrayContent(media.Bytes);
            bytes2.Headers.ContentType = new MediaTypeHeaderValue(media.MimeType);
            form2.Add(bytes2, "file", Path.GetFileNameWithoutExtension(fileName) + media.Extension);
            form2.Add(new StringContent(uploadPreset), "upload_preset");

            using var response2 = await _http.PostAsync(
                $"https://api.cloudinary.com/v1_1/{settings.CloudName}/image/upload",
                form2,
                cts.Token);

            var body2 = await response2.Content.ReadAsStringAsync(cts.Token);

            if (response2.IsSuccessStatusCode)
            {
                using var json2 = JsonDocument.Parse(body2);
                var publicId = json2.RootElement.GetProperty("public_id").GetString()!;
                var secureUrl = json2.RootElement.GetProperty("secure_url").GetString()!;
                return new CloudinaryUploadResult(publicId, secureUrl);
            }

            var signedErrMsg = signedException != null ? $"; Signed Error: {signedException.Message}" : "";
            throw new InvalidOperationException($"Cloudinary upload thất bại ({(int)response2.StatusCode}): {body2}{signedErrMsg}");
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            throw new InvalidOperationException("Kết nối tới Cloudinary bị quá thời gian (Timeout 25s). Vui lòng kiểm tra kết nối mạng.");
        }
        catch (Exception ex)
        {
            var signedErrMsg = signedException != null ? $"; Signed Error: {signedException.Message}" : "";
            throw new InvalidOperationException($"Cloudinary upload thất bại: {ex.Message}{signedErrMsg}", ex);
        }
    }

    public async Task DeleteAsync(string publicId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(publicId))
            return;

        if (publicId.StartsWith("local_") || publicId.Contains("."))
        {
            var localPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads", publicId);
            if (File.Exists(localPath))
            {
                File.Delete(localPath);
            }
            return;
        }

        var settings = await EffectiveSettings(cancellationToken);
        EnsureConfigured(settings);

        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
        var signature = Sign($"public_id={publicId}&timestamp={timestamp}", settings.ApiSecret);

        using var form = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["public_id"] = publicId,
            ["api_key"] = settings.ApiKey,
            ["timestamp"] = timestamp,
            ["signature"] = signature
        });

        using var response = await _http.PostAsync(
            $"https://api.cloudinary.com/v1_1/{settings.CloudName}/image/destroy",
            form,
            cancellationToken);

        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException("Cloudinary delete failed.");
    }

    private async Task<CloudinarySettings> EffectiveSettings(CancellationToken cancellationToken)
    {
        var stored = await _context.SystemSettings
            .Find(x => x.Scope == "CLOUDINARY")
            .ToListAsync(cancellationToken);

        string Value(string key, string fallback)
        {
            var item = stored.FirstOrDefault(x => x.Key == key);
            return item?.Value is { Length: > 0 } val ? val : fallback;
        }

        return new CloudinarySettings
        {
            CloudName = Value("CLOUDINARY_CLOUD_NAME", _settings.CloudName),
            ApiKey = Value("CLOUDINARY_API_KEY", _settings.ApiKey),
            ApiSecret = Value("CLOUDINARY_API_SECRET", _settings.ApiSecret),
            UploadPreset = _settings.UploadPreset
        };
    }

    private static void EnsureConfigured(CloudinarySettings settings)
    {
        if (string.IsNullOrWhiteSpace(settings.CloudName) ||
            string.IsNullOrWhiteSpace(settings.ApiKey) ||
            string.IsNullOrWhiteSpace(settings.ApiSecret))
        {
            throw new InvalidOperationException("Cloudinary chưa được cấu hình đầy đủ (thiếu CloudName, ApiKey hoặc ApiSecret).");
        }
    }

    private static string Sign(string value, string secret)
    {
        var hashBytes = SHA1.HashData(Encoding.UTF8.GetBytes(value + secret));
        return Convert.ToHexString(hashBytes).ToLowerInvariant();
    }
}
