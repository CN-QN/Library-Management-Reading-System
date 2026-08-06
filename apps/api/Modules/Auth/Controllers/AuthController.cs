using Microsoft.AspNetCore.Mvc;
using api.Auth.DTOs;
using api.Common.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using api.Database.Entities;
using api.Database;
using MongoDB.Driver;
using api.Configuration;
using Microsoft.Extensions.Options;

namespace api.Auth;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;
    private readonly MongoDbContext _context;
    private readonly IConfiguration _config;
    private readonly IGoogleTokenVerifier _googleTokenVerifier;
    private readonly IPasswordRecoveryService _passwordRecovery;
    private readonly IWebHostEnvironment _environment;
    private readonly string _googleClientId;

    public AuthController(AuthService authService, MongoDbContext context, IConfiguration config,
        IGoogleTokenVerifier googleTokenVerifier, IPasswordRecoveryService passwordRecovery, IWebHostEnvironment environment,
        IOptions<GoogleSettings> googleSettings)
    {
        _authService = authService;
        _context = context;
        _config = config;
        _googleTokenVerifier = googleTokenVerifier;
        _passwordRecovery = passwordRecovery;
        _environment = environment;
        _googleClientId = googleSettings.Value.ClientId;
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
            Secure = !_environment.IsDevelopment(),
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
            Secure = !_environment.IsDevelopment(),
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
            Secure = !_environment.IsDevelopment(),
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
            Secure = !_environment.IsDevelopment(),
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
    [HttpPut("profile")]
    public async Task<ActionResult<ApiResponse<UserProfileDto>>> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(ApiResponse.ErrorResponse(401, "Invalid identity."));
        }

        var updatedProfile = await _authService.UpdateProfileAsync(userId, dto);
        return Ok(ApiResponse<UserProfileDto>.SuccessResponse(updatedProfile, "Cập nhật thông tin cá nhân thành công."));
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

    /// <summary>
    /// Yêu cầu quên mật khẩu và gửi liên kết dùng một lần qua email.
    /// </summary>
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest dto, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.Email))
        {
            return BadRequest(ApiResponse.ErrorResponse(400, "Vui lòng nhập Email."));
        }

        await _passwordRecovery.RequestAsync(dto.Email, cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Nếu email tồn tại, LibraryHub đã gửi hướng dẫn đặt lại mật khẩu."));
    }

    /// <summary>
    /// Kiểm tra token dùng một lần và đặt lại mật khẩu mới.
    /// </summary>
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest dto, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Token) || string.IsNullOrWhiteSpace(dto.NewPassword))
        {
            return BadRequest(ApiResponse.ErrorResponse(400, "Email, token và mật khẩu mới là bắt buộc."));
        }

        if (!await _passwordRecovery.ResetAsync(dto.Email, dto.Token, dto.NewPassword, cancellationToken))
            return BadRequest(ApiResponse.ErrorResponse(400, "Token không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu liên kết mới."));

        return Ok(ApiResponse.SuccessResponse("Đặt lại mật khẩu mới thành công! Bạn có thể đăng nhập ngay bằng mật khẩu mới."));
    }

    /// <summary>
    /// Trả cấu hình công khai cần thiết để Google Identity Services hiển thị nút đăng nhập.
    /// Client ID là metadata OAuth công khai; client secret không bao giờ được trả về.
    /// </summary>
    [HttpGet("google/config")]
    public IActionResult GetGoogleConfig()
    {
        if (string.IsNullOrWhiteSpace(_googleClientId))
            return StatusCode(503, ApiResponse.ErrorResponse(503, "Google login chưa được cấu hình."));

        return Ok(ApiResponse<object>.SuccessResponse(new { clientId = _googleClientId }));
    }

    /// <summary>
    /// Đăng nhập bằng Google OAuth2
    /// </summary>
    [HttpPost("google")]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest dto, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.Credential))
        {
            return BadRequest(ApiResponse.ErrorResponse(400, "Thông tin Google không hợp lệ."));
        }

        VerifiedGoogleIdentity identity;
        try { identity = await _googleTokenVerifier.VerifyAsync(dto.Credential, cancellationToken); }
        catch (UnauthorizedAccessException) { return Unauthorized(ApiResponse.ErrorResponse(401, "Google credential không hợp lệ.")); }

        var user = await _context.Users.Find(u => u.GoogleSubject == identity.Subject || u.Email == identity.Email).FirstOrDefaultAsync(cancellationToken);
        if (user == null)
        {
            user = new User
            {
                Email = identity.Email,
                StudentCode = $"GOOGLE-{identity.Subject}",
                FullName = identity.Name,
                Avatar = identity.AvatarUrl,
                GoogleSubject = identity.Subject,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()),
                Status = "ACTIVE",
                CreatedAt = DateTime.UtcNow
            };
            await _context.Users.InsertOneAsync(user, cancellationToken: cancellationToken);

            // Assign MEMBER_READER role
            var readerRole = await _context.Roles.Find(r => r.Code == "MEMBER_READER").FirstOrDefaultAsync();
            if (readerRole != null)
            {
                await _context.UserRoles.InsertOneAsync(new UserRole
                {
                    UserId = user.Id,
                    RoleId = readerRole.Id
                });
            }
        }
        else if (string.IsNullOrWhiteSpace(user.GoogleSubject))
        {
            await _context.Users.UpdateOneAsync(u => u.Id == user.Id,
                Builders<User>.Update.Set(u => u.GoogleSubject, identity.Subject), cancellationToken: cancellationToken);
        }

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "::1";
        var deviceName = GetDeviceNameFromUserAgent();
        var result = await _authService.LoginWithoutPasswordAsync(user, ip, deviceName);

        SetAccessTokenCookie(result.AccessToken);
        SetRefreshTokenCookie(result.RefreshToken);

        return Ok(ApiResponse<LoginResponse>.SuccessResponse(result, "Đăng nhập Google thành công."));
    }
}
