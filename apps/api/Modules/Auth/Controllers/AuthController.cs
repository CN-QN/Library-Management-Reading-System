using Microsoft.AspNetCore.Mvc;
using api.Auth.DTOs;
using api.Common.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using api.Database.Entities;
using api.Database;
using MongoDB.Driver;

namespace api.Auth;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;
    private readonly MongoDbContext _context;

    public AuthController(AuthService authService, MongoDbContext context)
    {
        _authService = authService;
        _context = context;
    }

    private string GetDeviceNameFromUserAgent()
    {
        var userAgent = Request.Headers["User-Agent"].ToString();
        if (string.IsNullOrEmpty(userAgent)) return "Thiết bị không xác định";

        if (userAgent.Contains("PostmanRuntime") || userAgent.Contains("Postman")) return "Postman";
        if (userAgent.Contains("iPhone")) return "iPhone";
        if (userAgent.Contains("iPad")) return "iPad";
        if (userAgent.Contains("Android")) return "Android Mobile";

        var browser = "Browser";
        if (userAgent.Contains("Edg/")) browser = "Edge";
        else if (userAgent.Contains("Chrome/")) browser = "Chrome";
        else if (userAgent.Contains("Safari/")) browser = "Safari";
        else if (userAgent.Contains("Firefox/")) browser = "Firefox";

        var os = "Unknown OS";
        if (userAgent.Contains("Windows")) os = "Windows";
        else if (userAgent.Contains("Macintosh")) os = "macOS";
        else if (userAgent.Contains("Linux")) os = "Linux";

        return $"{browser} ({os})";
    }

    private void SetRefreshTokenCookie(string token)
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = false, // Set to true if using HTTPS in prod, false is fine for localhost HTTP development
            SameSite = SameSiteMode.Lax,
            Expires = DateTime.UtcNow.AddDays(7),
            Path = "/api/auth"
        };
        Response.Cookies.Append("refreshToken", token, cookieOptions);
    }

    private void SetAccessTokenCookie(string token)
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = false, // Set to true if using HTTPS in prod, false is fine for localhost HTTP development
            SameSite = SameSiteMode.Lax,
            Expires = DateTime.UtcNow.AddMinutes(15),
            Path = "/"
        };
        Response.Cookies.Append("accessToken", token, cookieOptions);
    }

    private void ClearAccessTokenCookie()
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            SameSite = SameSiteMode.Lax,
            Path = "/"
        };
        Response.Cookies.Delete("accessToken", cookieOptions);
    }

    private void ClearRefreshTokenCookie()
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            SameSite = SameSiteMode.Lax,
            Path = "/api/auth"
        };
        Response.Cookies.Delete("refreshToken", cookieOptions);
    }

    [HttpPost("register")]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> Register([FromBody] RegisterRequest request)
    {
        var result = await _authService.RegisterAsync(request);
        SetAccessTokenCookie(result.AccessToken);
        SetRefreshTokenCookie(result.RefreshToken);
        return Ok(ApiResponse<LoginResponse>.SuccessResponse(result, "Registration successful."));
    }

    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> Login([FromBody] LoginRequest request)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0";
        var device = GetDeviceNameFromUserAgent();
        var result = await _authService.LoginAsync(request, device, ipAddress);
        SetAccessTokenCookie(result.AccessToken);
        SetRefreshTokenCookie(result.RefreshToken);
        return Ok(ApiResponse<LoginResponse>.SuccessResponse(result, "Login successful."));
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> Refresh([FromBody] RefreshRequest request)
    {
        var token = request.RefreshToken;
        if (string.IsNullOrEmpty(token))
        {
            token = Request.Cookies["refreshToken"];
        }

        if (string.IsNullOrEmpty(token))
        {
            return UnprocessableEntity(ApiResponse.ErrorResponse(422, "Refresh token là bắt buộc."));
        }

        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0";
        var result = await _authService.RefreshAsync(new RefreshRequest { RefreshToken = token }, ipAddress);
        SetAccessTokenCookie(result.AccessToken);
        SetRefreshTokenCookie(result.RefreshToken);
        return Ok(ApiResponse<LoginResponse>.SuccessResponse(result, "Token refreshed successfully."));
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<ActionResult<ApiResponse>> Logout([FromBody] RefreshRequest request)
    {
        var token = request.RefreshToken;
        if (string.IsNullOrEmpty(token))
        {
            token = Request.Cookies["refreshToken"];
        }

        if (string.IsNullOrEmpty(token))
        {
            return UnprocessableEntity(ApiResponse.ErrorResponse(422, "Refresh token là bắt buộc."));
        }

        await _authService.LogoutAsync(token);
        ClearAccessTokenCookie();
        ClearRefreshTokenCookie();
        return Ok(ApiResponse.SuccessResponse("Logged out successfully."));
    }

    [Authorize]
    [HttpGet("profile")]
    public async Task<ActionResult<ApiResponse<UserProfileDto>>> GetProfile()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(ApiResponse.ErrorResponse(401, "Invalid identity."));
        }

        var profile = await _authService.GetProfileAsync(userId);
        return Ok(ApiResponse<UserProfileDto>.SuccessResponse(profile, "Profile retrieved successfully."));
    }

    [Authorize]
    [HttpGet("sessions")]
    public async Task<ActionResult<ApiResponse<List<AuthSession>>>> GetSessions()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(ApiResponse.ErrorResponse(401, "Invalid identity."));
        }

        var sessions = await _context.AuthSessions
            .Find(s => s.UserId == userId && s.RevokedAt == null && s.ExpiresAt > DateTime.UtcNow)
            .SortByDescending(s => s.CreatedAt)
            .ToListAsync();

        return Ok(ApiResponse<List<AuthSession>>.SuccessResponse(sessions, "Active sessions retrieved."));
    }

    [Authorize]
    [HttpDelete("sessions/{id}")]
    public async Task<ActionResult<ApiResponse>> RevokeSession(string id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(ApiResponse.ErrorResponse(401, "Invalid identity."));
        }

        var session = await _context.AuthSessions.Find(s => s.Id == id && s.UserId == userId).FirstOrDefaultAsync();
        if (session == null)
        {
            return NotFound(ApiResponse.ErrorResponse(404, "Session not found."));
        }

        var update = Builders<AuthSession>.Update.Set(s => s.RevokedAt, DateTime.UtcNow);
        await _context.AuthSessions.UpdateOneAsync(s => s.Id == id, update);

        return Ok(ApiResponse.SuccessResponse("Session revoked successfully."));
    }
}
