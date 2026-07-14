namespace api.Configuration;

public class JwtSettings
{
    public string Secret { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public int AccessExpiryMinutes { get; set; } = 15;
    public int RefreshExpiryDays { get; set; } = 7;
}
