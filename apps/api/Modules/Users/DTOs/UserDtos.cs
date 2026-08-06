namespace api.Users.DTOs;

public class CreateUserRequest
{
    public string Email { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public string FullName { get; set; } = string.Empty;

    public string? BranchId { get; set; }
}

public class BranchOptionDto
{
    public string Id { get; set; } = string.Empty;
    public string? Code { get; set; }
    public string Name { get; set; } = string.Empty;
}

public class UpdateUserRequest
{
    public string FullName { get; set; } = string.Empty;
    public string? Avatar { get; set; }
    public string? BranchId { get; set; }
}

public class UpdateUserStatusRequest
{
    public string Status { get; set; } = string.Empty; // ACTIVE, LOCKED, SUSPENDED, DELETED
}

public class AssignRoleRequest
{
    public string RoleId { get; set; } = string.Empty;
    public string? BranchId { get; set; }
    public DateTime? ExpiresAt { get; set; }
}

public class UserDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string StudentCode { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? BranchId { get; set; }
    public string? Avatar { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<UserRoleDetailDto> AssignedRoles { get; set; } = new();
}

public class UserRoleDetailDto
{
    public string UserRoleId { get; set; } = string.Empty;
    public string RoleId { get; set; } = string.Empty;
    public string RoleCode { get; set; } = string.Empty;
    public string RoleName { get; set; } = string.Empty;
    public string? BranchId { get; set; }
    public string? BranchName { get; set; }
    public DateTime? ExpiresAt { get; set; }
}
