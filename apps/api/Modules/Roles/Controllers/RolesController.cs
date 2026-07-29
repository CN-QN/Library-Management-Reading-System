using Microsoft.AspNetCore.Mvc;
using api.Auth;
using api.Roles.DTOs;
using api.Common.Models;
using api.Common.Constants;

namespace api.Roles;

[ApiController]
[Route("api/roles")]
public class RolesController : ControllerBase
{
    private readonly RolesService _rolesService;

    public RolesController(RolesService rolesService)
    {
        _rolesService = rolesService;
    }

    [HttpGet]
    [RequirePermission(Permissions.RoleRead)]
    public async Task<ActionResult<ApiResponse<List<RoleDto>>>> GetRoles()
    {
        var result = await _rolesService.GetRolesAsync();
        return Ok(ApiResponse<List<RoleDto>>.SuccessResponse(result, "Lấy danh sách vai trò thành công."));
    }

    [HttpGet("{id}")]
    [RequirePermission(Permissions.RoleRead)]
    public async Task<ActionResult<ApiResponse<RoleDto>>> GetRoleById(string id)
    {
        var result = await _rolesService.GetRoleByIdAsync(id);
        return Ok(ApiResponse<RoleDto>.SuccessResponse(result, "Lấy thông tin vai trò thành công."));
    }

    [HttpPost]
    [RequirePermission(Permissions.RoleCreate)]
    public async Task<ActionResult<ApiResponse<RoleDto>>> CreateRole([FromBody] CreateRoleRequest request)
    {
        var result = await _rolesService.CreateRoleAsync(request);
        return Ok(ApiResponse<RoleDto>.SuccessResponse(result, "Tạo vai trò thành công."));
    }

    [HttpPut("{id}")]
    [RequirePermission(Permissions.RoleUpdate)]
    public async Task<ActionResult<ApiResponse<RoleDto>>> UpdateRole(string id, [FromBody] UpdateRoleRequest request)
    {
        var result = await _rolesService.UpdateRoleAsync(id, request);
        return Ok(ApiResponse<RoleDto>.SuccessResponse(result, "Cập nhật vai trò thành công."));
    }

    [HttpGet("/api/permissions")]
    [RequirePermission(Permissions.RoleRead)]
    public async Task<ActionResult<ApiResponse<List<PermissionDto>>>> GetPermissions()
    {
        var result = await _rolesService.GetPermissionsAsync();
        return Ok(ApiResponse<List<PermissionDto>>.SuccessResponse(result, "Lấy danh sách quyền thành công."));
    }

    [HttpPost("{id}/permissions")]
    [RequirePermission(Permissions.RoleAssignPermission)]
    public async Task<ActionResult<ApiResponse>> AssignPermission(string id, [FromBody] AssignPermissionRequest request)
    {
        await _rolesService.AssignPermissionAsync(id, request);
        return Ok(ApiResponse.SuccessResponse("Gán quyền thành công."));
    }

    [HttpDelete("{id}/permissions/{permissionId}")]
    [RequirePermission(Permissions.RoleAssignPermission)]
    public async Task<ActionResult<ApiResponse>> RemovePermission(string id, string permissionId)
    {
        await _rolesService.RemovePermissionAsync(id, permissionId);
        return Ok(ApiResponse.SuccessResponse("Gỡ quyền thành công."));
    }
}
