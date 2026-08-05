using MongoDB.Driver;
using Xunit;

namespace api.Tests.TestSupport;

public sealed class MongoFixture : IAsyncLifetime
{
    private readonly MongoClient? _client;
    public IMongoDatabase? Database { get; }
    public string DatabaseName { get; } = $"libraryhub_tests_{Guid.NewGuid():N}";

    public MongoFixture()
    {
        var connectionString = Environment.GetEnvironmentVariable("MONGODB_TEST_CONNECTION_STRING");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            return;
        }

        _client = new MongoClient(connectionString);
        Database = _client.GetDatabase(DatabaseName);
    }

    public Task InitializeAsync()
    {
        if (_client is null)
        {
            Console.WriteLine("Assumption: MONGODB_TEST_CONNECTION_STRING is not configured; MongoDB integration operations are skipped.");
        }

        return Task.CompletedTask;
    }

    public async Task DisposeAsync()
    {
        if (_client is not null)
        {
            await _client.DropDatabaseAsync(DatabaseName);
        }
    }
}
