using System.Net;
using System.Net.Mail;
using api.Configuration;
using Microsoft.Extensions.Options;
using api.Database;
using api.Database.Entities;
using MongoDB.Driver;

namespace api.Auth;

public sealed class SmtpEmailSender : IEmailSender
{
    private readonly EmailSettings _settings;
    private readonly MongoDbContext _context;

    public SmtpEmailSender(IOptions<EmailSettings> settings, MongoDbContext context) { _settings = settings.Value; _context = context; }

    public async Task SendAsync(string recipient, string subject, string htmlBody, CancellationToken cancellationToken = default)
    {
        var stored = await _context.SystemSettings.Find(x => x.Scope == "EMAIL").ToListAsync(cancellationToken);
        string Value(string key, string fallback) => stored.FirstOrDefault(x => x.Key == key)?.Value is { Length: > 0 } value ? value : fallback;
        var host = Value("EMAIL_HOST", _settings.Host); var fromAddress = Value("EMAIL_FROM_ADDRESS", _settings.FromAddress);
        var fromName = Value("EMAIL_FROM_NAME", _settings.FromName); var username = Value("EMAIL_USERNAME", _settings.Username);
        var password = Value("EMAIL_PASSWORD", _settings.Password); var port = int.TryParse(Value("EMAIL_PORT", _settings.Port.ToString()), out var parsedPort) ? parsedPort : _settings.Port;
        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(fromAddress))
            throw new InvalidOperationException("Email delivery is not configured.");

        using var message = new MailMessage
        {
            From = new MailAddress(fromAddress, fromName),
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true,
        };
        message.To.Add(recipient);

        using var client = new SmtpClient(host, port)
        {
            EnableSsl = _settings.EnableSsl,
            Credentials = string.IsNullOrWhiteSpace(username)
                ? CredentialCache.DefaultNetworkCredentials
                : new NetworkCredential(username, password),
        };
        cancellationToken.ThrowIfCancellationRequested();
        await client.SendMailAsync(message, cancellationToken);
    }
}
