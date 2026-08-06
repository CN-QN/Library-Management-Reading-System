using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace api.Tests.TestSupport;

public sealed class ApiWebApplicationFactory : WebApplicationFactory<Program>
{
    public string? TestDatabaseName { get; private set; }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        TestDatabaseName = $"libraryhub_api_tests_{Guid.NewGuid():N}";

        builder.UseEnvironment("Development");
        builder.ConfigureAppConfiguration((_, config) =>
        {
            var mongoConn = Environment.GetEnvironmentVariable("MONGODB_TEST_CONNECTION_STRING")
                ?? "mongodb://localhost:27017";

            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["MongoDb:ConnectionString"] = mongoConn,
                ["MongoDb:DatabaseName"] = TestDatabaseName,
                ["Redis:ConnectionString"] = Environment.GetEnvironmentVariable("REDIS_TEST_CONNECTION_STRING")
                    ?? "localhost:6379",
                ["Jwt:Secret"] = "TestSecretKeyForLibraryHubAdminApiFirstRemediation2026!",
                ["Jwt:Issuer"] = "LibraryHub",
                ["Jwt:Audience"] = "LibraryHubUsers",
                ["Jwt:AccessExpiryMinutes"] = "15",
                ["Jwt:RefreshExpiryDays"] = "7",
                ["GoogleAuth:ClientId"] = "test-google-client-id.apps.googleusercontent.com",
            });
        });
    }
}
