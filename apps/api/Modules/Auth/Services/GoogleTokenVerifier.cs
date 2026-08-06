using System.Net.Http.Json;
using System.Text.Json.Serialization;
using api.Configuration;
using Microsoft.Extensions.Options;

namespace api.Auth;

public sealed class GoogleTokenVerifier : IGoogleTokenVerifier
{
    private readonly HttpClient _httpClient;
    private readonly GoogleSettings _settings;

    public GoogleTokenVerifier(HttpClient httpClient, IOptions<GoogleSettings> settings)
    {
        _httpClient = httpClient;
        _settings = settings.Value;
    }

    public async Task<VerifiedGoogleIdentity> VerifyAsync(string credential, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_settings.ClientId))
            throw new InvalidOperationException("Google authentication is not configured.");
        if (string.IsNullOrWhiteSpace(credential))
            throw new UnauthorizedAccessException("Google credential is required.");

        using var response = await _httpClient.GetAsync(
            $"https://oauth2.googleapis.com/tokeninfo?id_token={Uri.EscapeDataString(credential)}",
            cancellationToken);
        if (!response.IsSuccessStatusCode)
            throw new UnauthorizedAccessException("Google credential is invalid.");

        var payload = await response.Content.ReadFromJsonAsync<GoogleTokenInfo>(cancellationToken: cancellationToken)
            ?? throw new UnauthorizedAccessException("Google credential payload is invalid.");

        var validIssuer = payload.Issuer is "accounts.google.com" or "https://accounts.google.com";
        var validEmail = string.Equals(payload.EmailVerified, "true", StringComparison.OrdinalIgnoreCase);
        var validExpiry = long.TryParse(payload.ExpiresAt, out var expiry)
            && expiry > DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        if (!validIssuer || !validEmail || !validExpiry || payload.Audience != _settings.ClientId
            || string.IsNullOrWhiteSpace(payload.Subject) || string.IsNullOrWhiteSpace(payload.Email))
        {
            throw new UnauthorizedAccessException("Google credential could not be verified.");
        }

        return new VerifiedGoogleIdentity(
            payload.Subject,
            payload.Email.Trim().ToLowerInvariant(),
            string.IsNullOrWhiteSpace(payload.Name) ? "Độc giả Google" : payload.Name,
            payload.Picture);
    }

    private sealed class GoogleTokenInfo
    {
        [JsonPropertyName("sub")] public string Subject { get; set; } = string.Empty;
        [JsonPropertyName("email")] public string Email { get; set; } = string.Empty;
        [JsonPropertyName("email_verified")] public string EmailVerified { get; set; } = string.Empty;
        [JsonPropertyName("aud")] public string Audience { get; set; } = string.Empty;
        [JsonPropertyName("iss")] public string Issuer { get; set; } = string.Empty;
        [JsonPropertyName("exp")] public string ExpiresAt { get; set; } = string.Empty;
        [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
        [JsonPropertyName("picture")] public string? Picture { get; set; }
    }
}
