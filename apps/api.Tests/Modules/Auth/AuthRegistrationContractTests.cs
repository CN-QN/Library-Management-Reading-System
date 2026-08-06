using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using api.Tests.TestSupport;
using FluentAssertions;
using Xunit;

namespace api.Tests.Modules.Auth;

public sealed class AuthRegistrationContractTests : IClassFixture<ApiWebApplicationFactory>
{
    private readonly ApiWebApplicationFactory _factory;

    public AuthRegistrationContractTests(ApiWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public void Register_request_contract_does_not_expose_student_code()
    {
        typeof(api.Auth.DTOs.RegisterRequest).GetProperties().Select(x => x.Name)
            .Should().BeEquivalentTo(["Email", "Password", "FullName"]);
    }

    [Fact]
    public void User_profile_contract_does_not_expose_student_code()
    {
        typeof(api.Auth.DTOs.UserProfileDto).GetProperties().Select(x => x.Name)
            .Should().NotContain("StudentCode");
    }

    [Fact]
    public async Task Register_succeeds_with_email_password_and_full_name_only()
    {
        using var client = _factory.CreateClient();
        var email = $"reader-{Guid.NewGuid():N}@gmail.com";

        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            email,
            password = "ReaderPass123!",
            fullName = "Reader Contract Test"
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = JsonNode.Parse(await response.Content.ReadAsStringAsync())!.AsObject();
        body["success"]!.GetValue<bool>().Should().BeTrue();
        body["data"]!["user"]!["email"]!.GetValue<string>().Should().Be(email);
        body["data"]!["user"]!["fullName"]!.GetValue<string>().Should().Be("Reader Contract Test");
        body["data"]!["user"]!["studentCode"].Should().BeNull();
    }

    [Fact]
    public async Task Register_rejects_password_shorter_than_eight_characters()
    {
        using var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            email = $"short-{Guid.NewGuid():N}@gmail.com",
            password = "Aa1!aa",
            fullName = "Short Password"
        });

        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);

        var body = JsonNode.Parse(await response.Content.ReadAsStringAsync())!.AsObject();
        body["message"]!.GetValue<string>().Should().Be("Validation failed");
        body["details"]!.AsArray()
            .Any(detail => detail!["field"]!.GetValue<string>() == "Password"
                        && detail["message"]!.GetValue<string>() == "Mật khẩu tối thiểu 8 ký tự.")
            .Should().BeTrue();
    }

    [Fact]
    public async Task Login_and_profile_responses_do_not_expose_student_code_for_self_registered_reader()
    {
        using var client = _factory.CreateClient(new() { HandleCookies = true });
        var email = $"profile-{Guid.NewGuid():N}@gmail.com";
        const string password = "ReaderPass123!";

        var registerResponse = await client.PostAsJsonAsync("/api/auth/register", new
        {
            email,
            password,
            fullName = "Profile Reader"
        });
        registerResponse.StatusCode.Should().Be(
            HttpStatusCode.OK,
            await registerResponse.Content.ReadAsStringAsync());

        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new
        {
            email,
            password
        });
        loginResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var loginBody = JsonNode.Parse(await loginResponse.Content.ReadAsStringAsync())!.AsObject();
        loginBody["data"]!["user"]!["studentCode"].Should().BeNull();
        client.DefaultRequestHeaders.Add(
            "Cookie",
            $"accessToken={loginBody["data"]!["accessToken"]!.GetValue<string>()}");

        var profileResponse = await client.GetAsync("/api/auth/profile");
        profileResponse.StatusCode.Should().Be(
            HttpStatusCode.OK,
            $"headers: {string.Join("; ", profileResponse.Headers.SelectMany(h => h.Value.Select(v => $"{h.Key}={v}")))}; body: {await profileResponse.Content.ReadAsStringAsync()}");

        var profileBody = JsonNode.Parse(await profileResponse.Content.ReadAsStringAsync())!.AsObject();
        profileBody["data"]!["studentCode"].Should().BeNull();
        profileBody["data"]!["email"]!.GetValue<string>().Should().Be(email);
    }
}
