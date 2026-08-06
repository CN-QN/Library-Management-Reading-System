using Microsoft.AspNetCore.Mvc;
using api.Auth;
using api.Users.DTOs;
using api.Common.Models;
using api.Common.Constants;

namespace api.Users;

[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly UsersService _usersService;

    public UsersController(UsersService usersService)
    {
        _usersService = usersService;
    }

    [HttpGet]
    [RequirePermission(Permissions.UserRead)]
    public async Task<ActionResult<ApiResponse<PagedResult<UserDto>>>> GetUsers(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] string? branchId,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20)
    {
        var branchScope = GetCurrentUserBranchIdScope();
        var result = await _usersService.GetUsersAsync(search, status, branchId, page, limit, branchScope);
        return Ok(ApiResponse<PagedResult<UserDto>>.SuccessResponse(result, "Lấy danh sách người dùng thành công."));
    }

    [HttpGet("{id}")]
    [RequirePermission(Permissions.UserRead)]
    public async Task<ActionResult<ApiResponse<UserDto>>> GetUserById(string id)
    {
        var branchScope = GetCurrentUserBranchIdScope();
        var result = await _usersService.GetUserByIdAsync(id, branchScope);
        return Ok(ApiResponse<UserDto>.SuccessResponse(result, "Lấy thông tin người dùng thành công."));
    }

    [HttpGet("branches")]
    [RequirePermission(Permissions.UserRead)]
    public async Task<ActionResult<ApiResponse<List<BranchOptionDto>>>> GetBranches()
    {
        var result = await _usersService.GetActiveBranchesAsync();
        return Ok(ApiResponse<List<BranchOptionDto>>.SuccessResponse(result, "Lấy danh sách chi nhánh thành công."));
    }

    [HttpPost]
    [RequirePermission(Permissions.UserCreate)]
    public async Task<ActionResult<ApiResponse<UserDto>>> CreateUser([FromBody] CreateUserRequest request)
    {
        var branchScope = GetCurrentUserBranchIdScope();
        var result = await _usersService.CreateUserAsync(request, branchScope);
        return Ok(ApiResponse<UserDto>.SuccessResponse(result, "Tạo người dùng thành công."));
    }

    [HttpPut("{id}")]
    [RequirePermission(Permissions.UserUpdate)]
    public async Task<ActionResult<ApiResponse<UserDto>>> UpdateUser(string id, [FromBody] UpdateUserRequest request)
    {
        var branchScope = GetCurrentUserBranchIdScope();
        var result = await _usersService.UpdateUserAsync(id, request, branchScope);
        return Ok(ApiResponse<UserDto>.SuccessResponse(result, "Cập nhật người dùng thành công."));
    }

    [HttpPatch("{id}/status")]
    [RequirePermission(Permissions.UserLock)]
    public async Task<ActionResult<ApiResponse>> UpdateUserStatus(string id, [FromBody] UpdateUserStatusRequest request)
    {
        var branchScope = GetCurrentUserBranchIdScope();
        await _usersService.UpdateUserStatusAsync(id, request, branchScope);
        return Ok(ApiResponse.SuccessResponse("Cập nhật trạng thái người dùng thành công."));
    }

    [HttpPost("{id}/roles")]
    [RequirePermission(Permissions.UserAssignRole)]
    public async Task<ActionResult<ApiResponse>> AssignRole(string id, [FromBody] AssignRoleRequest request)
    {
        var branchScope = GetCurrentUserBranchIdScope();
        await _usersService.AssignRoleAsync(id, request, branchScope);
        return Ok(ApiResponse.SuccessResponse("Gán vai trò thành công."));
    }

    [HttpDelete("{id}/roles/{userRoleId}")]
    [RequirePermission(Permissions.UserAssignRole)]
    public async Task<ActionResult<ApiResponse>> RemoveRole(string id, string userRoleId)
    {
        var branchScope = GetCurrentUserBranchIdScope();
        await _usersService.RemoveRoleAsync(id, userRoleId, branchScope);
        return Ok(ApiResponse.SuccessResponse("Gỡ vai trò thành công."));
    }

    private string? GetCurrentUserBranchIdScope()
    {
        if (User.IsInRole("SUPER_ADMIN") || User.IsInRole("CONTENT_EDITOR") || User.IsInRole("ADMIN") || User.IsInRole("LIBRARIAN"))
        {
            return null; // Global access
        }
        return User.FindFirst("branchId")?.Value;
    }
}
