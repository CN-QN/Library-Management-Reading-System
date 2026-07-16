using api.Database;
using api.Database.Entities;
using api.Roles.DTOs;
using api.Common.Exceptions;
using MongoDB.Driver;
using StackExchange.Redis;
using Role = api.Database.Entities.Role;


namespace api.Roles;

public class RolesService
{
    private readonly MongoDbContext _context;
    private readonly RedisContext _redisContext;

    public RolesService(MongoDbContext context, RedisContext redisContext)
    {
        _context = context;
        _redisContext = redisContext;
    }

    public async Task<List<RoleDto>> GetRolesAsync()
    {
        var dbRoles = await _context.Roles.Find(Builders<Role>.Filter.Empty).ToListAsync();
        var roleDtos = new List<RoleDto>();

        foreach (var role in dbRoles)
        {
            var rolePerms = await _context.RolePermissions.Find(rp => rp.RoleId == role.Id).ToListAsync();
            var permIds = rolePerms.Select(rp => rp.PermissionId).ToList();
            var permissions = await _context.Permissions.Find(p => permIds.Contains(p.Id)).ToListAsync();

            roleDtos.Add(MapToRoleDto(role, permissions));
        }

        return roleDtos;
    }

    public async Task<RoleDto> GetRoleByIdAsync(string id)
    {
        var role = await _context.Roles.Find(r => r.Id == id).FirstOrDefaultAsync();
        if (role == null)
        {
            throw new AppException(404, "ROLE_NOT_FOUND", "Không tìm thấy vai trò.");
        }

        var rolePerms = await _context.RolePermissions.Find(rp => rp.RoleId == role.Id).ToListAsync();
        var permIds = rolePerms.Select(rp => rp.PermissionId).ToList();
        var permissions = await _context.Permissions.Find(p => permIds.Contains(p.Id)).ToListAsync();

        return MapToRoleDto(role, permissions);
    }

    public async Task<RoleDto> CreateRoleAsync(CreateRoleRequest request)
    {
        var codeUpper = request.Code.ToUpperInvariant();
        var exists = await _context.Roles.Find(r => r.Code == codeUpper).AnyAsync();
        if (exists)
        {
            throw new ConflictException("ROLE_CODE_ALREADY_EXISTS", "Mã vai trò đã tồn tại.");
        }

        var role = new Role
        {
            Code = codeUpper,
            Name = request.Name,
            Scope = request.Scope.ToUpperInvariant(),
            Status = "ACTIVE"
        };

        await _context.Roles.InsertOneAsync(role);
        return MapToRoleDto(role, new List<Permission>());
    }

    public async Task<RoleDto> UpdateRoleAsync(string id, UpdateRoleRequest request)
    {
        var role = await _context.Roles.Find(r => r.Id == id).FirstOrDefaultAsync();
        if (role == null)
        {
            throw new AppException(404, "ROLE_NOT_FOUND", "Không tìm thấy vai trò.");
        }

        var update = Builders<Role>.Update
            .Set(r => r.Name, request.Name)
            .Set(r => r.Scope, request.Scope.ToUpperInvariant())
            .Set(r => r.Status, request.Status);

        await _context.Roles.UpdateOneAsync(r => r.Id == id, update);

        // Invalidate permissions cache of all users with this role
        await InvalidateUsersPermissionCacheAsync(id);

        return await GetRoleByIdAsync(id);
    }

    public async Task<List<PermissionDto>> GetPermissionsAsync()
    {
        var dbPerms = await _context.Permissions.Find(Builders<Permission>.Filter.Empty).ToListAsync();
        return dbPerms.Select(p => new PermissionDto
        {
            Id = p.Id,
            Code = p.Code,
            Resource = p.Resource,
            Action = p.Action,
            Description = p.Description
        }).ToList();
    }

    public async Task AssignPermissionAsync(string roleId, AssignPermissionRequest request)
    {
        var role = await _context.Roles.Find(r => r.Id == roleId).FirstOrDefaultAsync();
        if (role == null)
            throw new AppException(404, "ROLE_NOT_FOUND", "Không tìm thấy vai trò.");

        var perm = await _context.Permissions.Find(p => p.Id == request.PermissionId).FirstOrDefaultAsync();
        if (perm == null)
            throw new AppException(404, "PERMISSION_NOT_FOUND", "Không tìm thấy quyền.");

        // Check if already mapped
        var exists = await _context.RolePermissions.Find(rp => rp.RoleId == roleId && rp.PermissionId == request.PermissionId).AnyAsync();
        if (exists)
        {
            throw new ConflictException("PERMISSION_ALREADY_MAPPED", "Vai trò đã được gán quyền này.");
        }

        var rolePerm = new RolePermission
        {
            RoleId = roleId,
            PermissionId = request.PermissionId
        };
        await _context.RolePermissions.InsertOneAsync(rolePerm);

        // Invalidate cache
        await InvalidateUsersPermissionCacheAsync(roleId);
    }

    public async Task RemovePermissionAsync(string roleId, string permissionId)
    {
        var role = await _context.Roles.Find(r => r.Id == roleId).FirstOrDefaultAsync();
        if (role == null)
            throw new AppException(404, "ROLE_NOT_FOUND", "Không tìm thấy vai trò.");

        var deleteResult = await _context.RolePermissions.DeleteOneAsync(rp => rp.RoleId == roleId && rp.PermissionId == permissionId);
        if (deleteResult.DeletedCount == 0)
        {
            throw new AppException(404, "MAPPING_NOT_FOUND", "Quyền chưa được gán cho vai trò này.");
        }

        // Invalidate cache
        await InvalidateUsersPermissionCacheAsync(roleId);
    }

    private async Task InvalidateUsersPermissionCacheAsync(string roleId)
    {
        var userRoles = await _context.UserRoles.Find(ur => ur.RoleId == roleId).ToListAsync();
        var userIds = userRoles.Select(ur => ur.UserId).Distinct().ToList();

        var redis = _redisContext.GetDatabase();
        foreach (var userId in userIds)
        {
            await redis.KeyDeleteAsync($"permission:user:{userId}");
        }
    }

    private RoleDto MapToRoleDto(Role role, List<Permission> permissions)
    {
        return new RoleDto
        {
            Id = role.Id,
            Code = role.Code,
            Name = role.Name,
            Scope = role.Scope,
            Status = role.Status,
            Permissions = permissions.Select(p => new PermissionDto
            {
                Id = p.Id,
                Code = p.Code,
                Resource = p.Resource,
                Action = p.Action,
                Description = p.Description
            }).ToList()
        };
    }
}
