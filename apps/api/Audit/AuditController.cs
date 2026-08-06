using Microsoft.AspNetCore.Mvc;
using api.Auth;
using api.Common.Models;
using api.Common.Constants;
using api.Database;
using api.Database.Entities;
using MongoDB.Bson;
using MongoDB.Driver;

namespace api.Audit;

[ApiController]
[Route("api/audit-logs")]
public class AuditController : ControllerBase
{
    private readonly MongoDbContext _context;

    public AuditController(MongoDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [RequirePermission(Permissions.AuditRead)]
    public async Task<ActionResult<ApiResponse<PagedResult<AuditLog>>>> GetAuditLogs(
        [FromQuery] string? actorId,
        [FromQuery] string? action,
        [FromQuery] string? resource,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20)
    {
        page = page < 1 ? 1 : page;
        limit = limit < 1 ? 20 : limit > 100 ? 100 : limit;

        var builder = Builders<AuditLog>.Filter;
        var filter = builder.Empty;

        if (!string.IsNullOrWhiteSpace(actorId))
        {
            var actorLookup = actorId.Trim();
            string? resolvedActorId = null;

            if (ObjectId.TryParse(actorLookup, out _))
            {
                resolvedActorId = actorLookup;
            }
            else
            {
                var actor = await _context.Users
                    .Find(user => user.Email == actorLookup || user.StudentCode == actorLookup)
                    .FirstOrDefaultAsync();
                resolvedActorId = actor?.Id;
            }

            if (resolvedActorId == null)
            {
                return Ok(ApiResponse<PagedResult<AuditLog>>.SuccessResponse(
                    new PagedResult<AuditLog>([], page, limit, 0),
                    "Không tìm thấy người thực hiện phù hợp."));
            }

            filter &= builder.Eq(al => al.ActorId, resolvedActorId);
        }

        if (!string.IsNullOrEmpty(action))
        {
            filter &= builder.Eq(al => al.Action, action.ToUpperInvariant());
        }

        if (!string.IsNullOrEmpty(resource))
        {
            filter &= builder.Eq(al => al.Resource, resource);
        }

        if (fromDate.HasValue)
        {
            filter &= builder.Gte(al => al.CreatedAt, fromDate.Value);
        }

        if (toDate.HasValue)
        {
            filter &= builder.Lte(al => al.CreatedAt, toDate.Value);
        }

        var totalItems = await _context.AuditLogs.CountDocumentsAsync(filter);
        var logs = await _context.AuditLogs.Find(filter)
            .SortByDescending(al => al.CreatedAt)
            .Skip((page - 1) * limit)
            .Limit(limit)
            .ToListAsync();

        var pagedResult = new PagedResult<AuditLog>(logs, page, limit, totalItems);
        return Ok(ApiResponse<PagedResult<AuditLog>>.SuccessResponse(pagedResult, "Lấy lịch sử nhật ký hệ thống thành công."));
    }
}
