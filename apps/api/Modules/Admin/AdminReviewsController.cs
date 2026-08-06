using api.Auth;
using api.Common.Constants;
using api.Common.Models;
using api.Modules.Catalog.DTOs;
using api.Modules.Catalog.Services;
using Microsoft.AspNetCore.Mvc;

namespace api.Modules.Admin;

[ApiController, Route("api/admin/reviews"), RequirePermission(Permissions.ReviewModerate)]
public sealed class AdminReviewsController : ControllerBase
{
    private readonly IReviewService _reviews;
    public AdminReviewsController(IReviewService reviews) => _reviews = reviews;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<ReviewResponseDto>>>> List(
        [FromQuery] string? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
        Ok(ApiResponse<PagedResult<ReviewResponseDto>>.SuccessResponse(
            await _reviews.GetAllReviewsAsync(status, Math.Max(1, page), Math.Clamp(pageSize, 1, 100))));

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> Moderate(string id, [FromBody] ReviewStatusRequest request)
    {
        var status = request.Status.Trim().ToUpperInvariant();
        if (status is not ("APPROVED" or "HIDDEN" or "REJECTED"))
            return BadRequest(ApiResponse.ErrorResponse(400, "Trạng thái review không hợp lệ."));
        return await _reviews.ModerateReviewAsync(id, status)
            ? Ok(ApiResponse.SuccessResponse("Đã cập nhật review."))
            : NotFound(ApiResponse.ErrorResponse(404, "Không tìm thấy review."));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id) =>
        await _reviews.DeleteReviewAsync(id, string.Empty, true)
            ? Ok(ApiResponse.SuccessResponse("Đã xóa review."))
            : NotFound(ApiResponse.ErrorResponse(404, "Không tìm thấy review."));
}

public sealed class ReviewStatusRequest { public string Status { get; set; } = string.Empty; }
