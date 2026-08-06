using System.Security.Claims;
using api.Auth;
using api.Common.Constants;
using api.Common.Models;
using api.Database;
using api.Database.Entities;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

namespace api.Modules.Admin;

[ApiController, Route("api/admin/settings")]
public sealed class AdminSettingsController : ControllerBase
{
    private static readonly HashSet<string> SecretKeys = new(StringComparer.OrdinalIgnoreCase)
        { "EMAIL_PASSWORD", "SEPAY_API_KEY", "CLOUDINARY_API_SECRET", "CLOUDINARY_API_KEY" };
    private readonly MongoDbContext _context;
    public AdminSettingsController(MongoDbContext context) => _context = context;

    [HttpGet, RequirePermission(Permissions.SettingRead)]
    public async Task<IActionResult> Get([FromQuery] string? scope)
    {
        var filter = string.IsNullOrWhiteSpace(scope)
            ? Builders<SystemSetting>.Filter.Empty
            : Builders<SystemSetting>.Filter.Eq(x => x.Scope, scope.ToUpperInvariant());
        var values = await _context.SystemSettings.Find(filter).SortBy(x => x.Scope).ThenBy(x => x.Key).ToListAsync();
        return Ok(ApiResponse<List<AdminSettingDto>>.SuccessResponse(values.Select(Map).ToList()));
    }

    [HttpPut, RequirePermission(Permissions.SettingUpdate)]
    public async Task<IActionResult> Put([FromBody] List<AdminSettingUpdate> updates)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "SYSTEM";
        foreach (var input in updates)
        {
            var key = input.Key.Trim().ToUpperInvariant();
            if (string.IsNullOrWhiteSpace(key)) return BadRequest(ApiResponse.ErrorResponse(400, "Setting key is required."));
            var existing = await _context.SystemSettings.Find(x => x.Key == key).FirstOrDefaultAsync();
            if (SecretKeys.Contains(key) && string.IsNullOrWhiteSpace(input.Value) && existing is not null) continue;
            var update = Builders<SystemSetting>.Update
                .Set(x => x.Value, input.Value)
                .Set(x => x.Scope, input.Scope.Trim().ToUpperInvariant())
                .Set(x => x.Description, input.Description)
                .Set(x => x.UpdatedBy, userId)
                .Set(x => x.UpdatedAt, DateTime.UtcNow);
            await _context.SystemSettings.UpdateOneAsync(x => x.Key == key, update, new UpdateOptions { IsUpsert = true });
        }
        return await Get(null);
    }

    private static AdminSettingDto Map(SystemSetting x) => new(x.Id, x.Key,
        SecretKeys.Contains(x.Key) ? string.Empty : x.Value, x.Scope, x.Description,
        SecretKeys.Contains(x.Key) && !string.IsNullOrWhiteSpace(x.Value), x.UpdatedAt);
}

public sealed record AdminSettingDto(string Id, string Key, string Value, string Scope, string? Description, bool IsConfigured, DateTime UpdatedAt);
public sealed record AdminSettingUpdate(string Key, string Value, string Scope, string? Description);
