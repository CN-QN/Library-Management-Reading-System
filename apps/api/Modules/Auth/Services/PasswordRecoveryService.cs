using System.Security.Cryptography;
using System.Text;
using api.Configuration;
using api.Database;
using api.Database.Entities;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace api.Auth;

public sealed class PasswordRecoveryService : IPasswordRecoveryService
{
    private readonly MongoDbContext _context;
    private readonly IEmailSender _emailSender;
    private readonly EmailSettings _emailSettings;
    private readonly ILogger<PasswordRecoveryService> _logger;

    public PasswordRecoveryService(MongoDbContext context, IEmailSender emailSender, IOptions<EmailSettings> emailSettings, ILogger<PasswordRecoveryService> logger)
    {
        _context = context;
        _emailSender = emailSender;
        _emailSettings = emailSettings.Value;
        _logger = logger;
    }

    public async Task<string?> RequestAsync(string email, CancellationToken cancellationToken = default)
    {
        var normalized = email.Trim().ToLowerInvariant();
        var user = await _context.Users.Find(u => u.Email == normalized).FirstOrDefaultAsync(cancellationToken);
        if (user is null) return null;

        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();
        var update = Builders<User>.Update
            .Set(u => u.ResetToken, Hash(token))
            .Set(u => u.ResetTokenExpires, DateTime.UtcNow.AddMinutes(15));
        await _context.Users.UpdateOneAsync(u => u.Id == user.Id, update, cancellationToken: cancellationToken);

        var resetUrl = $"{_emailSettings.WebBaseUrl.TrimEnd('/')}/login?resetEmail={Uri.EscapeDataString(normalized)}&resetToken={Uri.EscapeDataString(token)}";

        _logger.LogInformation("[PASSWORD RECOVERY] Email: {Email} | Reset Token: {Token} | URL: {ResetUrl}", normalized, token, resetUrl);

        try
        {
            await _emailSender.SendAsync(normalized, "Khôi phục mật khẩu LibraryHub",
                $"<p>Bạn đã yêu cầu đặt lại mật khẩu.</p><p><a href=\"{resetUrl}\">Đặt lại mật khẩu</a></p><p>Liên kết hết hạn sau 15 phút. Mã token: <strong>{token}</strong></p>", cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[PASSWORD RECOVERY] Email delivery failed, but token remains valid for reset. Reset URL: {ResetUrl}", resetUrl);
        }

        return token;
    }

    public async Task<bool> ResetAsync(string email, string token, string newPassword, CancellationToken cancellationToken = default)
    {
        var normalized = email.Trim().ToLowerInvariant();
        var now = DateTime.UtcNow;
        var tokenHash = Hash(token.Trim());
        var filter = Builders<User>.Filter.And(
            Builders<User>.Filter.Eq(u => u.Email, normalized),
            Builders<User>.Filter.Eq(u => u.ResetToken, tokenHash),
            Builders<User>.Filter.Gt(u => u.ResetTokenExpires, now));
        var update = Builders<User>.Update
            .Set(u => u.PasswordHash, BCrypt.Net.BCrypt.HashPassword(newPassword))
            .Set(u => u.UpdatedAt, now)
            .Unset(u => u.ResetToken)
            .Unset(u => u.ResetTokenExpires);
        var user = await _context.Users.FindOneAndUpdateAsync(filter, update,
            new FindOneAndUpdateOptions<User> { ReturnDocument = ReturnDocument.After }, cancellationToken);
        if (user is null) return false;

        await _context.AuthSessions.UpdateManyAsync(
            s => s.UserId == user.Id && s.RevokedAt == null,
            Builders<AuthSession>.Update.Set(s => s.RevokedAt, now),
            cancellationToken: cancellationToken);
        return true;
    }

    private static string Hash(string value) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value))).ToLowerInvariant();
}
