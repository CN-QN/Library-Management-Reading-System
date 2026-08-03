namespace api.Configuration;

/// <summary>
/// Hỗ trợ tìm và nạp file .env từ thư mục gốc dự án vào biến môi trường khi chạy cục bộ.
/// </summary>
public static class EnvLoader
{
    public static void Load()
    {
        var currentDir = new DirectoryInfo(Directory.GetCurrentDirectory());
        string? envFilePath = null;

        // Tìm kiếm file .env ngược lên tối đa 5 cấp thư mục
        for (int i = 0; i < 5 && currentDir != null; i++)
        {
            var candidate = Path.Combine(currentDir.FullName, ".env");
            if (File.Exists(candidate))
            {
                envFilePath = candidate;
                break;
            }
            currentDir = currentDir.Parent;
        }

        if (string.IsNullOrEmpty(envFilePath))
        {
            return;
        }

        var envMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        foreach (var rawLine in File.ReadAllLines(envFilePath))
        {
            var line = rawLine.Trim();
            if (string.IsNullOrEmpty(line) || line.StartsWith('#'))
            {
                continue;
            }

            var separatorIndex = line.IndexOf('=');
            if (separatorIndex <= 0)
            {
                continue;
            }

            var key = line[..separatorIndex].Trim();
            var val = line[(separatorIndex + 1)..].Trim();

            // Loại bỏ dấu nháy bọc quanh giá trị nếu có
            if (val.Length >= 2 && ((val.StartsWith('"') && val.EndsWith('"')) || (val.StartsWith('\'') && val.EndsWith('\''))))
            {
                val = val[1..^1];
            }

            envMap[key] = val;

            // Nạp trực tiếp vào biến môi trường hệ thống nếu chưa có
            if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable(key)))
            {
                Environment.SetEnvironmentVariable(key, val);
            }
        }

        // Tự động map các biến định dạng chuẩn .env sang format cấu hình của ASP.NET Core (Section__Key)
        BridgeAspNetCoreConfiguration(envMap);
    }

    private static void BridgeAspNetCoreConfiguration(Dictionary<string, string> env)
    {
        // 1. Cấu hình MongoDB
        env.TryGetValue("MONGODB_DATABASE", out var database);
        database = string.IsNullOrWhiteSpace(database) ? "libraryhub" : database;

        env.TryGetValue("MONGODB_USER", out var user);
        env.TryGetValue("MONGODB_PASSWORD", out var pass);

        if (!string.IsNullOrEmpty(user) && !string.IsNullOrEmpty(pass))
        {
            // Trích xuất host từ MONGODB_URI nếu có (ví dụ: mongodb://localhost:27017 -> localhost:27017)
            var host = "localhost:27017";
            if (env.TryGetValue("MONGODB_URI", out var uri) && !string.IsNullOrWhiteSpace(uri))
            {
                host = uri.Replace("mongodb://", string.Empty).TrimEnd('/');
            }

            var authMongoConn = $"mongodb://{user}:{pass}@{host}/{database}?authSource={database}";
            SetIfEmpty("MongoDb__ConnectionString", authMongoConn);
            SetIfEmpty("ConnectionStrings__MongoDb", authMongoConn);
        }
        else if (env.TryGetValue("MONGODB_URI", out var rawUri) && !string.IsNullOrWhiteSpace(rawUri))
        {
            SetIfEmpty("MongoDb__ConnectionString", rawUri);
            SetIfEmpty("ConnectionStrings__MongoDb", rawUri);
        }

        SetIfEmpty("MongoDb__DatabaseName", database);

        // 2. Cấu hình Redis
        if (env.TryGetValue("REDIS_CONNECTION", out var redisConn) && !string.IsNullOrWhiteSpace(redisConn))
        {
            env.TryGetValue("REDIS_PASSWORD", out var redisPass);
            var redisFullConn = string.IsNullOrWhiteSpace(redisPass) ? redisConn : $"{redisConn},password={redisPass}";

            SetIfEmpty("Redis__ConnectionString", redisConn);
            SetIfEmpty("ConnectionStrings__Redis", redisFullConn);
        }

        // 3. Cấu hình JWT
        if (env.TryGetValue("JWT_SECRET", out var jwtSecret)) SetIfEmpty("Jwt__Secret", jwtSecret);
        if (env.TryGetValue("JWT_ISSUER", out var jwtIssuer)) SetIfEmpty("Jwt__Issuer", jwtIssuer);
        if (env.TryGetValue("JWT_AUDIENCE", out var jwtAudience)) SetIfEmpty("Jwt__Audience", jwtAudience);
        if (env.TryGetValue("JWT_ACCESS_EXPIRY_MINUTES", out var jwtAccessExpiry)) SetIfEmpty("Jwt__AccessExpiryMinutes", jwtAccessExpiry);
        if (env.TryGetValue("JWT_REFRESH_EXPIRY_DAYS", out var jwtRefreshExpiry)) SetIfEmpty("Jwt__RefreshExpiryDays", jwtRefreshExpiry);

        // 4. CORS
        if (env.TryGetValue("CORS_ORIGINS", out var corsOrigins)) SetIfEmpty("CORS_ORIGINS", corsOrigins);
    }

    private static void SetIfEmpty(string key, string value)
    {
        if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable(key)) && !string.IsNullOrWhiteSpace(value))
        {
            Environment.SetEnvironmentVariable(key, value);
        }
    }
}
