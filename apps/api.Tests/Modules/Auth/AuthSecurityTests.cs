using System.Net;
using System.Text;
using api.Auth;
using api.Auth.DTOs;
using api.Configuration;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Xunit;

namespace api.Tests.Modules.Auth;

public sealed class AuthSecurityTests
{
    [Fact]
    public void Google_login_contract_accepts_only_provider_credential()
    {
        typeof(GoogleLoginRequest).GetProperties().Select(x => x.Name)
            .Should().BeEquivalentTo([nameof(GoogleLoginRequest.Credential)]);
    }

    [Fact]
    public async Task Google_verifier_rejects_wrong_audience()
    {
        var payload = """{"sub":"google-sub","email":"reader@example.com","email_verified":"true","aud":"wrong-client","iss":"https://accounts.google.com","exp":"4102444800","name":"Reader"}""";
        var verifier = new GoogleTokenVerifier(new HttpClient(new StubHandler(payload)),
            Options.Create(new GoogleSettings { ClientId = "libraryhub-client" }));

        var action = () => verifier.VerifyAsync("credential");
        await action.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task Google_verifier_uses_verified_provider_identity()
    {
        var payload = """{"sub":"google-sub","email":"Reader@Example.com","email_verified":"true","aud":"libraryhub-client","iss":"https://accounts.google.com","exp":"4102444800","name":"Reader"}""";
        var verifier = new GoogleTokenVerifier(new HttpClient(new StubHandler(payload)),
            Options.Create(new GoogleSettings { ClientId = "libraryhub-client" }));

        var identity = await verifier.VerifyAsync("credential");
        identity.Subject.Should().Be("google-sub");
        identity.Email.Should().Be("reader@example.com");
    }

    private sealed class StubHandler(string json) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent(json, Encoding.UTF8, "application/json") });
    }
}
