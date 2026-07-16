namespace api.Roles.DTOs;

public class CreateRoleRequest
{
    public string Code { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string Scope { get; set; } = "GLOBAL"; // GLOBAL, BRANCH
}

public class UpdateRoleRequest
{
    public string Name { get; set; } = string.Empty;
    public string Scope { get; set; } = "GLOBAL";
    public string Status { get; set; } = "ACTIVE";
}

public class AssignPermissionRequest
{
    public string PermissionId { get; set; } = string.Empty;
}

public class RoleDto
{
    public string Id { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Scope { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public List<PermissionDto> Permissions { get; set; } = new();
}

public class PermissionDto
{
    public string Id { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Resource { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}
