using api.Database.Entities;
using MongoDB.Driver;

namespace api.Database.Seed;

public class SeedRunner
{
    private readonly MongoDbContext _context;
    private readonly ILogger<SeedRunner> _logger;

    public SeedRunner(MongoDbContext context, ILogger<SeedRunner> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task RunSeedAsync()
    {
        try
        {
            _logger.LogInformation("Starting database seeding process...");

            // 1. Seed Branch
            var defaultBranchCode = "MAIN";
            LibraryBranch? defaultBranch = await _context.LibraryBranches.Find(b => b.Code == defaultBranchCode).FirstOrDefaultAsync();
            if (defaultBranch == null)
            {
                _logger.LogInformation("Seeding default library branch...");
                defaultBranch = new LibraryBranch
                {
                    Code = defaultBranchCode,
                    Name = "Thư viện Trung tâm",
                    Address = "268 Lý Thường Kiệt, Quận 10, TP. HCM",
                    Contact = "028 3864 7256",
                    Status = "ACTIVE"
                };
                await _context.LibraryBranches.InsertOneAsync(defaultBranch);
            }

            // 2. Seed Roles
            var rolesCount = await _context.Roles.CountDocumentsAsync(Builders<Role>.Filter.Empty);
            if (rolesCount == 0)
            {
                _logger.LogInformation("Seeding default roles...");
                await _context.Roles.InsertManyAsync(RoleSeed.Roles);
            }

            // 3. Seed Permissions
            var permissionsCount = await _context.Permissions.CountDocumentsAsync(Builders<Permission>.Filter.Empty);
            if (permissionsCount == 0)
            {
                _logger.LogInformation("Seeding default permissions...");
                await _context.Permissions.InsertManyAsync(PermissionSeed.Permissions);
            }

            // 4. Seed RolePermissions Mapping
            var rolePermsCount = await _context.RolePermissions.CountDocumentsAsync(Builders<RolePermission>.Filter.Empty);
            if (rolePermsCount == 0)
            {
                _logger.LogInformation("Mapping roles to permissions...");
                var dbRoles = await _context.Roles.Find(Builders<Role>.Filter.Empty).ToListAsync();
                var dbPerms = await _context.Permissions.Find(Builders<Permission>.Filter.Empty).ToListAsync();

                var rolePermList = new List<RolePermission>();

                foreach (var role in dbRoles)
                {
                    if (PermissionSeed.RolePermissionsMapping.TryGetValue(role.Code, out var mappedPermCodes))
                    {
                        foreach (var permCode in mappedPermCodes)
                        {
                            var perm = dbPerms.FirstOrDefault(p => p.Code == permCode);
                            if (perm != null)
                            {
                                rolePermList.Add(new RolePermission
                                {
                                    RoleId = role.Id,
                                    PermissionId = perm.Id
                                });
                            }
                        }
                    }
                }

                if (rolePermList.Any())
                {
                    await _context.RolePermissions.InsertManyAsync(rolePermList);
                }
            }

            // 5. Seed Users & UserRoles
            var usersCount = await _context.Users.CountDocumentsAsync(Builders<User>.Filter.Empty);
            if (usersCount == 0)
            {
                _logger.LogInformation("Seeding test user accounts...");
                var dbRoles = await _context.Roles.Find(Builders<Role>.Filter.Empty).ToListAsync();

                foreach (var userItem in UserSeed.Users)
                {
                    var role = dbRoles.FirstOrDefault(r => r.Code == userItem.RoleCode);
                    if (role == null) continue;

                    string? userBranchId = role.Scope == "BRANCH" ? defaultBranch.Id : null;

                    var user = new User
                    {
                        Email = userItem.Email,
                        StudentCode = userItem.StudentCode,
                        FullName = userItem.FullName,
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword("Test@123456"),
                        Status = "ACTIVE",
                        BranchId = userBranchId
                    };

                    await _context.Users.InsertOneAsync(user);

                    // Assign role to user
                    var userRole = new UserRole
                    {
                        UserId = user.Id,
                        RoleId = role.Id,
                        BranchId = userBranchId
                    };
                    await _context.UserRoles.InsertOneAsync(userRole);
                }
            }

            _logger.LogInformation("Database seeding process completed successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred during database seeding.");
            throw;
        }
    }
}
