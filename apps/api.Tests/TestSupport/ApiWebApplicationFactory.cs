using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace api.Tests.TestSupport;

public sealed class ApiWebApplicationFactory : WebApplicationFactory<Program>
{
    private const string TestJwtSecret = "TestSecretKeyForLibraryHubAdminApiFirstRemediation2026!";

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
                ["Jwt:Secret"] = TestJwtSecret,
                ["Jwt:Issuer"] = "LibraryHub",
                ["Jwt:Audience"] = "LibraryHubUsers",
                ["Jwt:AccessExpiryMinutes"] = "15",
                ["Jwt:RefreshExpiryDays"] = "7",
                ["GoogleAuth:ClientId"] = "test-google-client-id.apps.googleusercontent.com",
            });
        });

        builder.ConfigureServices(services =>
        {
            services.PostConfigure<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme, options =>
            {
                options.TokenValidationParameters.IssuerSigningKey =
                    new SymmetricSecurityKey(Encoding.ASCII.GetBytes(TestJwtSecret));
            });
        });
    }
}
