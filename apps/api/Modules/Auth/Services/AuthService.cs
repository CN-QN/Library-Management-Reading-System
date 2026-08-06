using System.Security.Claims;
using api.Auth.DTOs;
using api.Common.Constants;
using api.Common.Exceptions;
using api.Configuration;
using api.Database;
using api.Database.Entities;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using StackExchange.Redis;
using System.Text.Json;

namespace api.Auth;

public class AuthService : IUserPermissionResolver
{
    private readonly MongoDbContext _context;
    private readonly RedisContext _redisContext;
    private readonly JwtService _jwtService;
    private readonly JwtSettings _jwtSettings;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        MongoDbContext context, 
        RedisContext redisContext, 
        JwtService jwtService,
        IOptions<JwtSettings> jwtSettings,
        ILogger<AuthService> logger)
    {
        _context = context;
        _redisContext = redisContext;
        _jwtService = jwtService;
        _jwtSettings = jwtSettings.Value;
        _logger = logger;
    }

    public async Task<LoginResponse> RegisterAsync(RegisterRequest request)
    {
        var emailExists = await _context.Users.Find(u => u.Email == request.Email).AnyAsync();
        if (emailExists)
        {
            throw new ConflictException(ErrorCodes.USER_001, "Email này đã được đăng ký.");
        }

        var user = new User
        {
            Email = request.Email,
            // Legacy persistence requires a unique value, but it is no longer part of the public auth contract.
            StudentCode = $"SELF-{Guid.NewGuid():N}",
            FullName = request.FullName,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Status = StatusValues.User.ACTIVE
        };
        await _context.Users.InsertOneAsync(user);

        var studentRole = await _context.Roles.Find(r => r.Code == "STUDENT").FirstOrDefaultAsync();
        if (studentRole != null)
        {
            var userRole = new UserRole
            {
                UserId = user.Id,
                RoleId = studentRole.Id
            };
            await _context.UserRoles.InsertOneAsync(userRole);
        }

        return await GenerateLoginSessionAsync(user, "DefaultDevice", "0.0.0.0");
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request, string device, string ipAddress)
    {
        // Rate limiting check can be done in middleware
        var user = await _context.Users.Find(u => u.Email == request.Email).FirstOrDefaultAsync();
        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedException(ErrorCodes.AUTH_001, "Sai email hoặc mật khẩu.");
        }

        if (user.Status == StatusValues.User.LOCKED || user.Status == StatusValues.User.SUSPENDED)
        {
            throw new ForbiddenException(ErrorCodes.AUTH_003, "Tài khoản của bạn đã bị khóa hoặc tạm ngưng.");
        }

        return await GenerateLoginSessionAsync(user, device, ipAddress);
    }

    public async Task<LoginResponse> LoginWithoutPasswordAsync(User user, string ipAddress, string device)
    {
        return await GenerateLoginSessionAsync(user, device, ipAddress);
    }

    public async Task<LoginResponse> RefreshAsync(RefreshRequest request, string ipAddress)
    {
        var tokenHash = _jwtService.HashToken(request.RefreshToken);

        var session = await _context.AuthSessions.Find(s => s.TokenHash == tokenHash && s.RevokedAt == null).FirstOrDefaultAsync();
        if (session == null || session.ExpiresAt < DateTime.UtcNow)
        {
            throw new UnauthorizedException(ErrorCodes.AUTH_002, "Refresh token hết hạn hoặc không hợp lệ.");
        }

        var user = await _context.Users.Find(u => u.Id == session.UserId).FirstOrDefaultAsync();
        if (user == null || user.Status == StatusValues.User.LOCKED || user.Status == StatusValues.User.SUSPENDED)
        {
            throw new ForbiddenException(ErrorCodes.AUTH_003, "Tài khoản của bạn đã bị khóa.");
        }

        // Revoke old session
        var update = Builders<AuthSession>.Update.Set(s => s.RevokedAt, DateTime.UtcNow);
        await _context.AuthSessions.UpdateOneAsync(s => s.Id == session.Id, update);

        // Generate new session (Refresh token rotation)
        return await GenerateLoginSessionAsync(user, session.Device, ipAddress);
    }

    public async Task LogoutAsync(string refreshToken)
    {
        var tokenHash = _jwtService.HashToken(refreshToken);
        var session = await _context.AuthSessions.Find(s => s.TokenHash == tokenHash).FirstOrDefaultAsync();
        if (session != null)
        {
            var update = Builders<AuthSession>.Update.Set(s => s.RevokedAt, DateTime.UtcNow);
            await _context.AuthSessions.UpdateOneAsync(s => s.Id == session.Id, update);

            // Clear Redis cache
            var redis = _redisContext.GetDatabase();
            await redis.KeyDeleteAsync($"session:{session.Id}");
            await redis.KeyDeleteAsync($"permission:user:{session.UserId}");
        }
    }

    public async Task<UserProfileDto> GetProfileAsync(string userId)
    {
        var user = await _context.Users.Find(u => u.Id == userId).FirstOrDefaultAsync();
        if (user == null)
        {
            throw new UnauthorizedException("User not found.");
        }

        var (roles, permissions) = await CompileRolesAndPermissionsAsync(userId);

        return new UserProfileDto
        {
            Id = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            PhoneNumber = user.PhoneNumber,
            NotifyBookAvailable = user.NotifyBookAvailable,
            BranchId = user.BranchId,
            Avatar = user.Avatar,
            Roles = roles,
            Permissions = permissions
        };
    }

    public async Task<UserProfileDto> UpdateProfileAsync(string userId, UpdateProfileDto dto)
    {
        var user = await _context.Users.Find(u => u.Id == userId).FirstOrDefaultAsync();
        if (user == null)
        {
            throw new UnauthorizedException("User not found.");
        }

        var updateDef = Builders<User>.Update.Set(u => u.UpdatedAt, DateTime.UtcNow);

        if (!string.IsNullOrWhiteSpace(dto.FullName))
            updateDef = updateDef.Set(u => u.FullName, dto.FullName.Trim());

        if (!string.IsNullOrWhiteSpace(dto.Email))
            updateDef = updateDef.Set(u => u.Email, dto.Email.Trim().ToLower());

        if (!string.IsNullOrWhiteSpace(dto.PhoneNumber))
            updateDef = updateDef.Set(u => u.PhoneNumber, dto.PhoneNumber.Trim());

        if (!string.IsNullOrWhiteSpace(dto.Avatar))
            updateDef = updateDef.Set(u => u.Avatar, dto.Avatar.Trim());

        if (dto.NotifyBookAvailable.HasValue)
            updateDef = updateDef.Set(u => u.NotifyBookAvailable, dto.NotifyBookAvailable.Value);

        await _context.Users.UpdateOneAsync(u => u.Id == userId, updateDef);
        return await GetProfileAsync(userId);
    }

    public async Task<List<string>> GetCachedPermissionsAsync(string userId)
    {
        var redis = _redisContext.GetDatabase();
        var cacheKey = $"permission:user:{userId}";
        
        var cached = await redis.StringGetAsync(cacheKey);
        if (cached.HasValue)
        {
            return JsonSerializer.Deserialize<List<string>>(cached!) ?? new List<string>();
        }

        var (_, permissions) = await CompileRolesAndPermissionsAsync(userId);
        
        // Cache in Redis for 10 minutes
        await redis.StringSetAsync(cacheKey, JsonSerializer.Serialize(permissions), TimeSpan.FromMinutes(10));
        
        return permissions;
    }

    private async Task<LoginResponse> GenerateLoginSessionAsync(User user, string device, string ipAddress)
    {
        var (roles, permissions) = await CompileRolesAndPermissionsAsync(user.Id);

        var accessToken = _jwtService.GenerateAccessToken(user, permissions, roles);
        var refreshToken = _jwtService.GenerateRefreshToken();
        var tokenHash = _jwtService.HashToken(refreshToken);

        // Store session
        var session = new AuthSession
        {
            UserId = user.Id,
            TokenHash = tokenHash,
            Device = device,
            Ip = ipAddress,
            ExpiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshExpiryDays)
        };
        await _context.AuthSessions.InsertOneAsync(session);

        // Save active session metadata to Redis
        var redis = _redisContext.GetDatabase();
        await redis.StringSetAsync(
            $"session:{session.Id}", 
            JsonSerializer.Serialize(new { userId = user.Id, device, ipAddress }), 
            TimeSpan.FromDays(_jwtSettings.RefreshExpiryDays)
        );

        // Cache permissions immediately
        await redis.StringSetAsync(
            $"permission:user:{user.Id}", 
            JsonSerializer.Serialize(permissions), 
            TimeSpan.FromMinutes(10)
        );

        // Update last login
        var update = Builders<User>.Update
            .Set(u => u.LastLoginAt, DateTime.UtcNow)
            .Set(u => u.UpdatedAt, DateTime.UtcNow);
        await _context.Users.UpdateOneAsync(u => u.Id == user.Id, update);

        return new LoginResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            User = new UserProfileDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                BranchId = user.BranchId,
                Avatar = user.Avatar,
                Roles = roles,
                Permissions = permissions
            }
        };
    }

    private async Task<(List<string> Roles, List<string> Permissions)> CompileRolesAndPermissionsAsync(string userId)
    {
        var userRoles = await _context.UserRoles.Find(ur => ur.UserId == userId && (ur.ExpiresAt == null || ur.ExpiresAt > DateTime.UtcNow)).ToListAsync();
        var roleIds = userRoles.Select(ur => ur.RoleId).ToList();

        var roles = await _context.Roles.Find(r => roleIds.Contains(r.Id) && r.Status == "ACTIVE").ToListAsync();
        var roleCodes = roles.Select(r => r.Code).ToList();

        var rolePerms = await _context.RolePermissions.Find(rp => roleIds.Contains(rp.RoleId)).ToListAsync();
        var permIds = rolePerms.Select(rp => rp.PermissionId).ToList();

        var permissions = await _context.Permissions.Find(p => permIds.Contains(p.Id)).ToListAsync();
        var permCodes = permissions.Select(p => p.Code).ToList();

        return (roleCodes, permCodes);
    }
}
