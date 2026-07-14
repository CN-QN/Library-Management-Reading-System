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

    [HttpPost("register")]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> Register([FromBody] RegisterRequest request)
    {
        var result = await _authService.RegisterAsync(request);
        return Ok(ApiResponse<LoginResponse>.SuccessResponse(result, "Registration successful."));
    }

    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> Login([FromBody] LoginRequest request)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0";
        var result = await _authService.LoginAsync(request, ipAddress);
        return Ok(ApiResponse<LoginResponse>.SuccessResponse(result, "Login successful."));
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> Refresh([FromBody] RefreshRequest request)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0";
        var result = await _authService.RefreshAsync(request, ipAddress);
        return Ok(ApiResponse<LoginResponse>.SuccessResponse(result, "Token refreshed successfully."));
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<ActionResult<ApiResponse>> Logout([FromBody] RefreshRequest request)
    {
        await _authService.LogoutAsync(request.RefreshToken);
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
