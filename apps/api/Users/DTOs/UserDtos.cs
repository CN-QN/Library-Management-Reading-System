using System.ComponentModel.DataAnnotations;

namespace api.Users.DTOs;

public class CreateUserRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;

    [Required]
    public string FullName { get; set; } = string.Empty;

    [Required]
    public string StudentCode { get; set; } = string.Empty;

    public string? BranchId { get; set; }
}

public class UpdateUserRequest
{
    [Required]
    public string FullName { get; set; } = string.Empty;
    public string? Avatar { get; set; }
    public string? BranchId { get; set; }
}

public class UpdateUserStatusRequest
{
    [Required]
    public string Status { get; set; } = string.Empty; // ACTIVE, LOCKED, SUSPENDED, DELETED
}

public class AssignRoleRequest
{
    [Required]
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
