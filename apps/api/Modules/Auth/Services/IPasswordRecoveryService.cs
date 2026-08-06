namespace api.Auth;

public interface IPasswordRecoveryService
{
    Task RequestAsync(string email, CancellationToken cancellationToken = default);
    Task<bool> ResetAsync(string email, string token, string newPassword, CancellationToken cancellationToken = default);
}
