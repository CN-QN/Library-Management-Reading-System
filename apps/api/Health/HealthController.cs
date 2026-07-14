using Microsoft.AspNetCore.Mvc;
using api.Database;
using api.Common.Models;
using MongoDB.Driver;
using MongoDB.Bson;

namespace api.Health;

[ApiController]
[Route("api/health")]
public class HealthController : ControllerBase
{
    private readonly MongoDbContext _mongoContext;
    private readonly RedisContext _redisContext;
    private readonly ILogger<HealthController> _logger;

    public HealthController(MongoDbContext mongoContext, RedisContext redisContext, ILogger<HealthController> logger)
    {
        _mongoContext = mongoContext;
        _redisContext = redisContext;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<object>>> CheckHealth()
    {
        var mongoOk = false;
        var redisOk = false;

        try
        {
            // Ping MongoDB
            var command = new BsonDocument("ping", 1);
            await _mongoContext.Database.RunCommandAsync<BsonDocument>(command);
            mongoOk = true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "MongoDB health check failed.");
        }

        try
        {
            // Ping Redis
            var db = _redisContext.GetDatabase();
            await db.PingAsync();
            redisOk = true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Redis health check failed.");
        }

        var healthData = new
        {
            Status = (mongoOk && redisOk) ? "Healthy" : "Degraded",
            Services = new
            {
                MongoDB = mongoOk ? "OK" : "Offline",
                Redis = redisOk ? "OK" : "Offline"
            },
            Timestamp = DateTime.UtcNow
        };

        if (mongoOk && redisOk)
        {
            return Ok(ApiResponse<object>.SuccessResponse(healthData, "System is healthy."));
        }

        return StatusCode(503, ApiResponse<object>.SuccessResponse(healthData, "System is degraded."));
    }
}
