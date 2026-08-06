using api.Auth;
using api.Common.Constants;
using api.Common.Models;
using api.Roles;
using api.Roles.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace api.Modules.Admin;

[ApiController, Route("api/admin/roles")]
public sealed class AdminRolesController : ControllerBase
{
    private readonly RolesService _roles;
    public AdminRolesController(RolesService roles) => _roles = roles;

    [HttpGet, RequirePermission(Permissions.RoleRead)]
    public async Task<IActionResult> List() => Ok(ApiResponse<List<RoleDto>>.SuccessResponse(await _roles.GetRolesAsync()));
    [HttpPost, RequirePermission(Permissions.RoleCreate)]
    public async Task<IActionResult> Create(CreateRoleRequest request) => Ok(ApiResponse<RoleDto>.SuccessResponse(await _roles.CreateRoleAsync(request)));
    [HttpPut("{id}"), RequirePermission(Permissions.RoleUpdate)]
    public async Task<IActionResult> Update(string id, UpdateRoleRequest request) => Ok(ApiResponse<RoleDto>.SuccessResponse(await _roles.UpdateRoleAsync(id, request)));
    [HttpGet("permissions"), RequirePermission(Permissions.RoleRead)]
    public async Task<IActionResult> GetPermissions() => Ok(ApiResponse<List<PermissionDto>>.SuccessResponse(await _roles.GetPermissionsAsync()));
    [HttpPost("{id}/permissions"), RequirePermission(Permissions.RoleAssignPermission)]
    public async Task<IActionResult> AddPermission(string id, AssignPermissionRequest request) { await _roles.AssignPermissionAsync(id, request); return Ok(ApiResponse.SuccessResponse()); }
    [HttpDelete("{id}/permissions/{permissionId}"), RequirePermission(Permissions.RoleAssignPermission)]
    public async Task<IActionResult> RemovePermission(string id, string permissionId) { await _roles.RemovePermissionAsync(id, permissionId); return Ok(ApiResponse.SuccessResponse()); }
}
