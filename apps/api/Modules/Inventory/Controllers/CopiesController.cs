using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using api.Modules.Inventory.DTOs;
using api.Modules.Inventory.Services;
using api.Common.Models;
using System.Security.Claims;
using api.Modules.Catalog.DTOs.Requests;

namespace api.Modules.Inventory.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CopiesController : ControllerBase
    {
        private readonly ICopyService _copyService;
        private readonly ILogger<CopiesController> _logger;

        public CopiesController(ICopyService copyService, ILogger<CopiesController> logger)
        {
            _copyService = copyService;
            _logger = logger;
        }

        [HttpGet]
        [Authorize(Policy = "copy.read")]
        public async Task<IActionResult> Search([FromQuery] string? keyword, [FromQuery] int page = 1, [FromQuery] int limit = 10)
        {
            try
            {
                var result = await _copyService.SearchAsync(keyword, page, Math.Min(limit, 100));
                return Ok(ApiResponse<PagedResult<CopyResponseDto>>.SuccessResponse(
                    result,
                    "Copies retrieved successfully",
                    new { page, limit, result.TotalItems, result.TotalPages, result.HasNext }
                ));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching copies");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while searching copies"));
            }
        }

        [HttpGet("{id}")]
        [Authorize(Policy = "copy.read")]
        public async Task<IActionResult> GetById(string id)
        {
            try
            {
                var copy = await _copyService.GetByIdAsync(id);
                if (copy == null)
                    return NotFound(ApiResponse<object>.ErrorResponse(404, "Copy not found"));

                return Ok(ApiResponse<CopyResponseDto>.SuccessResponse(copy, "Copy retrieved successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting copy {id}");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while retrieving the copy"));
            }
        }

        [HttpGet("book/{bookId}")]
        [Authorize(Policy = "copy.read")]
        public async Task<IActionResult> GetByBookId(string bookId)
        {
            try
            {
                var copies = await _copyService.GetByBookIdAsync(bookId);
                return Ok(ApiResponse<List<CopyResponseDto>>.SuccessResponse(copies, "Copies retrieved successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting copies for book {bookId}");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while retrieving copies"));
            }
        }

        [HttpGet("branch/{branchId}")]
        [Authorize(Policy = "copy.read")]
        public async Task<IActionResult> GetByBranchId(string branchId)
        {
            try
            {
                var copies = await _copyService.GetByBranchIdAsync(branchId);
                return Ok(ApiResponse<List<CopyResponseDto>>.SuccessResponse(copies, "Copies retrieved successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting copies for branch {branchId}");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while retrieving copies"));
            }
        }

        [HttpGet("available/{bookId}/count")]
        [AllowAnonymous]
        public async Task<IActionResult> CountAvailable(string bookId)
        {
            try
            {
                var count = await _copyService.CountAvailableAsync(bookId);
                return Ok(new { bookId, availableCount = count });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error counting available copies for book {bookId}");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while counting copies"));
            }
        }

        [HttpPost]
        [Authorize(Policy = "copy.create")]
        public async Task<IActionResult> Create([FromBody] CreateCopyDto dto)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
                var copy = await _copyService.CreateAsync(dto, userId);

                return CreatedAtAction(
                    nameof(GetById),
                    new { id = copy.Id },
                    ApiResponse<CopyResponseDto>.SuccessResponse(copy, "Copy created successfully", null, 201)
                );
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(400, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating copy");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while creating the copy"));
            }
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "copy.update")]
        public async Task<IActionResult> Update(string id, [FromBody] UpdateCopyDto dto)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
                var copy = await _copyService.UpdateAsync(id, dto, userId);

                if (copy == null)
                    return NotFound(ApiResponse<object>.ErrorResponse(404, "Copy not found"));

                return Ok(ApiResponse<CopyResponseDto>.SuccessResponse(copy, "Copy updated successfully"));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(400, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating copy {id}");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while updating the copy"));
            }
        }

        [HttpPatch("{id}/status")]
        [Authorize(Policy = "copy.update_status")]
        public async Task<IActionResult> UpdateStatus(string id, [FromBody] UpdateStatusDto dto)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
                var copy = await _copyService.UpdateStatusAsync(id, dto.Status, userId);

                if (copy == null)
                    return NotFound(ApiResponse<object>.ErrorResponse(404, "Copy not found"));

                return Ok(ApiResponse<CopyResponseDto>.SuccessResponse(copy, $"Copy status updated to {dto.Status}"));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(400, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating status for copy {id}");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while updating status"));
            }
        }

        [HttpPost("transfer")]
        [Authorize(Policy = "inventory.transfer")]
        public async Task<IActionResult> Transfer([FromBody] TransferCopyDto dto)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
                var result = await _copyService.TransferAsync(dto, userId);

                if (!result)
                    return NotFound(ApiResponse<object>.ErrorResponse(404, "Copy not found"));

                return Ok(ApiResponse.SuccessResponse("Copy transferred successfully"));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(400, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error transferring copy");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while transferring the copy"));
            }
        }

        [HttpPost("audit")]
        [Authorize(Policy = "inventory.audit")]
        public async Task<IActionResult> Audit([FromBody] InventoryAuditDto dto)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
                var result = await _copyService.AuditAsync(dto, userId);

                if (!result)
                    return NotFound(ApiResponse<object>.ErrorResponse(404, "Copy not found"));

                return Ok(ApiResponse.SuccessResponse("Copy audited successfully"));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(400, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during inventory audit");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred during audit"));
            }
        }
    }
}