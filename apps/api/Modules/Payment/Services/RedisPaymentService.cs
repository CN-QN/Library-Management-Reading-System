using System.Text.Json;
using api.Modules.Payment.Hubs;
using Microsoft.AspNetCore.SignalR;
using StackExchange.Redis;

namespace api.Modules.Payment.Services;

public class RedisPaymentService : IRedisPaymentService
{
    private readonly IConnectionMultiplexer? _redis;
    private readonly IHubContext<PaymentHub> _hubContext;
    private readonly ILogger<RedisPaymentService> _logger;

    public RedisPaymentService(
        IHubContext<PaymentHub> hubContext,
        ILogger<RedisPaymentService> logger,
        IConnectionMultiplexer? redis = null)
    {
        _hubContext = hubContext;
        _logger = logger;
        _redis = redis;
    }

    public async Task PublishPaymentSuccessAsync(string orderCode, object payload)
    {
        var channel = $"payment:{orderCode}";
        var jsonPayload = JsonSerializer.Serialize(payload);

        _logger.LogInformation("Publishing PaymentSuccess for OrderCode {OrderCode} via Redis Pub/Sub & SignalR...", orderCode);

        // 1. Broadcast via SignalR to connected clients
        try
        {
            await _hubContext.Clients.Group($"order_{orderCode}").SendAsync("PaymentSuccess", payload);
            _logger.LogInformation("SignalR notification sent to group order_{OrderCode}", orderCode);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to send SignalR message to group order_{OrderCode}", orderCode);
        }

        // 2. Publish to Redis Pub/Sub channel
        if (_redis != null && _redis.IsConnected)
        {
            try
            {
                var subscriber = _redis.GetSubscriber();
                await subscriber.PublishAsync(RedisChannel.Literal(channel), jsonPayload);
                _logger.LogInformation("Published Redis Pub/Sub message to channel {Channel}", channel);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to publish to Redis Pub/Sub channel {Channel}", channel);
            }
        }
    }
}
