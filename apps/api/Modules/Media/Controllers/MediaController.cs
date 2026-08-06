using System.Security.Cryptography;
using System.Text;
using api.Common.Models;
using api.Configuration;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace api.Modules.Media.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MediaController : ControllerBase
{
    private readonly CloudinarySettings _cloudinarySettings;
    private readonly ILogger<MediaController> _logger;
    private static readonly HttpClient _httpClient = new();

    public MediaController(IOptions<CloudinarySettings> options, ILogger<MediaController> logger)
    {
        _cloudinarySettings = options.Value;
        _logger = logger;
    }

    /// <summary>
    /// Lấy cấu hình Cloudinary hiện tại cho Frontend
    /// </summary>
    [HttpGet("config")]
    public IActionResult GetConfig()
    {
        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            cloudName = _cloudinarySettings.CloudName,
            uploadPreset = _cloudinarySettings.UploadPreset,
            apiKey = _cloudinarySettings.ApiKey
        }));
    }

    /// <summary>
    /// Xóa ảnh trực tiếp trên hệ thống Cloudinary bằng REST API và chữ ký SHA-1
    /// </summary>
    [HttpPost("delete-cloudinary")]
    public async Task<IActionResult> DeleteCloudinaryImage([FromBody] DeleteImageRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.PublicId))
        {
            return BadRequest(ApiResponse<object>.ErrorResponse(400, "Vui lòng cung cấp public_id hoặc URL ảnh"));
        }

        var publicId = ExtractPublicId(request.PublicId);

        if (string.IsNullOrWhiteSpace(_cloudinarySettings.ApiKey) || string.IsNullOrWhiteSpace(_cloudinarySettings.ApiSecret))
        {
            _logger.LogWarning("Cloudinary ApiKey hoặc ApiSecret chưa được cấu hình trong appsettings.json");
            return Ok(ApiResponse<object>.SuccessResponse(new { message = "Đã xóa ảnh khỏi danh sách (Chưa cấu hình API Key/Secret Cloudinary để xóa trên server Cloudinary)" }));
        }

        try
        {
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
            var stringToSign = $"public_id={publicId}&timestamp={timestamp}{_cloudinarySettings.ApiSecret}";
            var signature = ComputeSha1Hash(stringToSign);

            var content = new FormUrlEncodedContent(new[]
            {
                new KeyValuePair<string, string>("public_id", publicId),
                new KeyValuePair<string, string>("api_key", _cloudinarySettings.ApiKey),
                new KeyValuePair<string, string>("timestamp", timestamp),
                new KeyValuePair<string, string>("signature", signature)
            });

            var url = $"https://api.cloudinary.com/v1_1/{_cloudinarySettings.CloudName}/image/destroy";
            var response = await _httpClient.PostAsync(url, content);
            var responseString = await response.Content.ReadAsStringAsync();

            _logger.LogInformation("Cloudinary delete response: {Response}", responseString);
            return Ok(ApiResponse<object>.SuccessResponse(new { message = "Đã gửi yêu cầu xóa ảnh lên Cloudinary thành công", details = responseString }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi gửi yêu cầu xóa ảnh trên Cloudinary");
            return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Không thể xóa ảnh trên Cloudinary"));
        }
    }

    private static string ExtractPublicId(string input)
    {
        if (!input.Contains("/")) return input;

        try {
            var uri = new Uri(input);
            var segments = uri.AbsolutePath.Split('/');
            var fileName = segments[^1];
            var dotIndex = fileName.LastIndexOf('.');
            return dotIndex > 0 ? fileName[..dotIndex] : fileName;
        } catch {
            return input;
        }
    }

    private static string ComputeSha1Hash(string input)
    {
        using var sha1 = SHA1.Create();
        var hashBytes = sha1.ComputeHash(Encoding.UTF8.GetBytes(input));
        return BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();
    }
}

public class DeleteImageRequest
{
    public string PublicId { get; set; } = string.Empty;
}
