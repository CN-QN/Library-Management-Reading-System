namespace api.Configuration;

public sealed class EmailSettings
{
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FromAddress { get; set; } = string.Empty;
    public string FromName { get; set; } = "LibraryHub";
    public bool EnableSsl { get; set; } = true;
    public string WebBaseUrl { get; set; } = "http://localhost:3000";
}
