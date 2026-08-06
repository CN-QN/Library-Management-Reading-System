using api.Database;
using api.Database.Entities;
using api.Users.DTOs;
using api.Common.Models;
using api.Common.Exceptions;
using api.Common.Constants;
using MongoDB.Driver;
using StackExchange.Redis;
using Role = api.Database.Entities.Role;


namespace api.Users;

public class UsersService
{
    private readonly MongoDbContext _context;
    private readonly RedisContext _redisContext;

    public UsersService(MongoDbContext context, RedisContext redisContext)
    {
        _context = context;
        _redisContext = redisContext;
    }

    public async Task<PagedResult<UserDto>> GetUsersAsync(string? search, string? status, string? branchId, int page, int limit, string? currentUserBranchId = null)
    {
        page = page < 1 ? 1 : page;
        limit = limit < 1 ? 20 : limit > 100 ? 100 : limit;

        var builder = Builders<User>.Filter;
        var filter = builder.Empty;

        // Apply search
        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            filter &= builder.Or(
                builder.Regex(u => u.FullName, new MongoDB.Bson.BsonRegularExpression(search, "i")),
                builder.Regex(u => u.Email, new MongoDB.Bson.BsonRegularExpression(search, "i")),
                builder.Regex(u => u.StudentCode, new MongoDB.Bson.BsonRegularExpression(search, "i"))
            );
        }

        // Apply status
        if (!string.IsNullOrWhiteSpace(status))
        {
            filter &= builder.Eq(u => u.Status, status);
        }

        // Apply branch filter (respecting Current User branch scope if restricted)
        var targetBranchId = currentUserBranchId ?? branchId;
        if (!string.IsNullOrWhiteSpace(targetBranchId))
        {
            filter &= builder.Eq(u => u.BranchId, targetBranchId);
        }

        var totalItems = await _context.Users.CountDocumentsAsync(filter);
        var dbUsers = await _context.Users.Find(filter)
            .SortByDescending(u => u.CreatedAt)
            .Skip((page - 1) * limit)
            .Limit(limit)
            .ToListAsync();

        var userDtos = new List<UserDto>();
        var dbRoles = await _context.Roles.Find(Builders<Role>.Filter.Empty).ToListAsync();
        var dbBranches = await _context.LibraryBranches.Find(Builders<LibraryBranch>.Filter.Empty).ToListAsync();

        foreach (var user in dbUsers)
        {
            var userRoles = await _context.UserRoles.Find(ur => ur.UserId == user.Id).ToListAsync();
            var assignedRoles = new List<UserRoleDetailDto>();

            foreach (var ur in userRoles)
            {
                var role = dbRoles.FirstOrDefault(r => r.Id == ur.RoleId);
                var branch = dbBranches.FirstOrDefault(b => b.Id == ur.BranchId);

                if (role != null)
                {
                    assignedRoles.Add(new UserRoleDetailDto
                    {
                        UserRoleId = ur.Id,
                        RoleId = role.Id,
                        RoleCode = role.Code,
                        RoleName = role.Name,
                        BranchId = ur.BranchId,
                        BranchName = branch?.Name,
                        ExpiresAt = ur.ExpiresAt
                    });
                }
            }

            userDtos.Add(MapToUserDto(user, assignedRoles));
        }

        return new PagedResult<UserDto>(userDtos, page, limit, totalItems);
    }

    public async Task<UserDto> GetUserByIdAsync(string id, string? currentUserBranchId = null)
    {
        var user = await _context.Users.Find(u => u.Id == id).FirstOrDefaultAsync();
        if (user == null)
        {
            throw new AppException(404, "USER_NOT_FOUND", "Không tìm thấy người dùng.");
        }

        // Check branch scope
        if (currentUserBranchId != null && user.BranchId != currentUserBranchId)
        {
            throw new ForbiddenException(ErrorCodes.PERM_002, "Không có quyền truy cập người dùng chi nhánh khác.");
        }

        var userRoles = await _context.UserRoles.Find(ur => ur.UserId == user.Id).ToListAsync();
        var assignedRoles = new List<UserRoleDetailDto>();
        var dbRoles = await _context.Roles.Find(Builders<Role>.Filter.Empty).ToListAsync();
        var dbBranches = await _context.LibraryBranches.Find(Builders<LibraryBranch>.Filter.Empty).ToListAsync();

        foreach (var ur in userRoles)
        {
            var role = dbRoles.FirstOrDefault(r => r.Id == ur.RoleId);
            var branch = dbBranches.FirstOrDefault(b => b.Id == ur.BranchId);

            if (role != null)
            {
                assignedRoles.Add(new UserRoleDetailDto
                {
                    UserRoleId = ur.Id,
                    RoleId = role.Id,
                    RoleCode = role.Code,
                    RoleName = role.Name,
                    BranchId = ur.BranchId,
                    BranchName = branch?.Name,
                    ExpiresAt = ur.ExpiresAt
                });
            }
        }

        return MapToUserDto(user, assignedRoles);
    }

    public async Task<UserDto> CreateUserAsync(CreateUserRequest request, string? currentUserBranchId = null)
    {
        // 1. Check uniqueness
        var emailExists = await _context.Users.Find(u => u.Email == request.Email).AnyAsync();
        if (emailExists)
            throw new ConflictException(ErrorCodes.USER_001, "Email đã tồn tại.");

        // Check branch scope
        var branchId = currentUserBranchId ?? request.BranchId;

        var user = new User
        {
            Email = request.Email,
            StudentCode = $"ADMIN-{Guid.NewGuid():N}",
            FullName = request.FullName,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Status = StatusValues.User.ACTIVE,
            BranchId = branchId
        };

        await _context.Users.InsertOneAsync(user);

        // Assign STUDENT role by default
        var studentRole = await _context.Roles.Find(r => r.Code == "STUDENT").FirstOrDefaultAsync();
        if (studentRole != null)
        {
            var userRole = new UserRole
            {
                UserId = user.Id,
                RoleId = studentRole.Id,
                BranchId = branchId
            };
            await _context.UserRoles.InsertOneAsync(userRole);
        }

        return await GetUserByIdAsync(user.Id);
    }

    public async Task<List<BranchOptionDto>> GetActiveBranchesAsync()
    {
        var branches = await _context.LibraryBranches
            .Find(branch => branch.IsActive && branch.Status == "ACTIVE")
            .SortBy(branch => branch.Name)
            .ToListAsync();

        return branches.Select(branch => new BranchOptionDto
        {
            Id = branch.Id,
            Code = branch.Code,
            Name = branch.Name
        }).ToList();
    }

    public async Task<UserDto> UpdateUserAsync(string id, UpdateUserRequest request, string? currentUserBranchId = null)
    {
        var user = await _context.Users.Find(u => u.Id == id).FirstOrDefaultAsync();
        if (user == null)
            throw new AppException(404, "USER_NOT_FOUND", "Không tìm thấy người dùng.");

        if (currentUserBranchId != null && user.BranchId != currentUserBranchId)
            throw new ForbiddenException(ErrorCodes.PERM_002, "Không có quyền sửa người dùng chi nhánh khác.");

        var branchId = currentUserBranchId ?? request.BranchId;

        var update = Builders<User>.Update
            .Set(u => u.FullName, request.FullName)
            .Set(u => u.Avatar, request.Avatar)
            .Set(u => u.BranchId, branchId)
            .Set(u => u.UpdatedAt, DateTime.UtcNow);

        await _context.Users.UpdateOneAsync(u => u.Id == id, update);

        return await GetUserByIdAsync(id);
    }

    public async Task UpdateUserStatusAsync(string id, UpdateUserStatusRequest request, string? currentUserBranchId = null)
    {
        var user = await _context.Users.Find(u => u.Id == id).FirstOrDefaultAsync();
        if (user == null)
            throw new AppException(404, "USER_NOT_FOUND", "Không tìm thấy người dùng.");

        if (currentUserBranchId != null && user.BranchId != currentUserBranchId)
            throw new ForbiddenException(ErrorCodes.PERM_002, "Không có quyền sửa người dùng chi nhánh khác.");

        var update = Builders<User>.Update
            .Set(u => u.Status, request.Status)
            .Set(u => u.UpdatedAt, DateTime.UtcNow);

        await _context.Users.UpdateOneAsync(u => u.Id == id, update);

        // Invalidate cache
        await InvalidateUserPermissionCacheAsync(id);
    }

    public async Task AssignRoleAsync(string userId, AssignRoleRequest request, string? currentUserBranchId = null)
    {
        var user = await _context.Users.Find(u => u.Id == userId).FirstOrDefaultAsync();
        if (user == null)
            throw new AppException(404, "USER_NOT_FOUND", "Không tìm thấy người dùng.");

        if (currentUserBranchId != null && user.BranchId != currentUserBranchId)
            throw new ForbiddenException(ErrorCodes.PERM_002, "Không có quyền sửa người dùng chi nhánh khác.");

        var role = await _context.Roles.Find(r => r.Id == request.RoleId).FirstOrDefaultAsync();
        if (role == null)
            throw new AppException(404, "ROLE_NOT_FOUND", "Không tìm thấy role.");

        // Check if role is branch scope
        var branchId = role.Scope == "BRANCH" ? (currentUserBranchId ?? request.BranchId) : null;
        if (role.Scope == "BRANCH" && string.IsNullOrEmpty(branchId))
        {
            throw new AppException(400, "BRANCH_REQUIRED", "Yêu cầu chi nhánh cho role này.");
        }

        // Check if already assigned
        var exists = await _context.UserRoles.Find(ur => ur.UserId == userId && ur.RoleId == request.RoleId && ur.BranchId == branchId).AnyAsync();
        if (exists)
        {
            throw new ConflictException("ROLE_ALREADY_ASSIGNED", "Người dùng đã có role này.");
        }

        var userRole = new UserRole
        {
            UserId = userId,
            RoleId = request.RoleId,
            BranchId = branchId,
            ExpiresAt = request.ExpiresAt
        };

        await _context.UserRoles.InsertOneAsync(userRole);

        // Invalidate cache
        await InvalidateUserPermissionCacheAsync(userId);
    }

    public async Task RemoveRoleAsync(string userId, string userRoleId, string? currentUserBranchId = null)
    {
        var user = await _context.Users.Find(u => u.Id == userId).FirstOrDefaultAsync();
        if (user == null)
            throw new AppException(404, "USER_NOT_FOUND", "Không tìm thấy người dùng.");

        if (currentUserBranchId != null && user.BranchId != currentUserBranchId)
            throw new ForbiddenException(ErrorCodes.PERM_002, "Không có quyền sửa người dùng chi nhánh khác.");

        var deleteResult = await _context.UserRoles.DeleteOneAsync(ur => ur.Id == userRoleId && ur.UserId == userId);
        if (deleteResult.DeletedCount == 0)
        {
            throw new AppException(404, "ROLE_ASSIGNMENT_NOT_FOUND", "Bản ghi gán role không tồn tại.");
        }

        // Invalidate cache
        await InvalidateUserPermissionCacheAsync(userId);
    }

    private async Task InvalidateUserPermissionCacheAsync(string userId)
    {
        var redis = _redisContext.GetDatabase();
        await redis.KeyDeleteAsync($"permission:user:{userId}");
    }

    private UserDto MapToUserDto(User user, List<UserRoleDetailDto> assignedRoles)
    {
        return new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            StudentCode = user.StudentCode,
            FullName = user.FullName,
            Status = user.Status,
            BranchId = user.BranchId,
            Avatar = user.Avatar,
            LastLoginAt = user.LastLoginAt,
            CreatedAt = user.CreatedAt,
            AssignedRoles = assignedRoles
        };
    }
}
