namespace api.Auth;

public sealed record VerifiedGoogleIdentity(string Subject, string Email, string Name, string? AvatarUrl);

public interface IGoogleTokenVerifier
{
    Task<VerifiedGoogleIdentity> VerifyAsync(string credential, CancellationToken cancellationToken = default);
}
