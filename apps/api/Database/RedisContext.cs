using api.Configuration;
using Microsoft.Extensions.Options;
using StackExchange.Redis;

namespace api.Database;

public class RedisContext
{
    private readonly IConnectionMultiplexer _connection;

    public RedisContext(IOptions<RedisSettings> settings)
    {
        _connection = ConnectionMultiplexer.Connect(settings.Value.ConnectionString);
    }

    public IDatabase GetDatabase() => _connection.GetDatabase();
    public IServer GetServer() => _connection.GetServer(_connection.GetEndPoints().First());
    public IConnectionMultiplexer Connection => _connection;
}
