namespace api.Auth;

public interface IPasswordRecoveryService
{
    Task<string?> RequestAsync(string email, CancellationToken cancellationToken = default);
    Task<bool> ResetAsync(string email, string token, string newPassword, CancellationToken cancellationToken = default);
}
