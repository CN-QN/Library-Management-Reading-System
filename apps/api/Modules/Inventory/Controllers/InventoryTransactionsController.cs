using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using api.Modules.Inventory.DTOs;
using api.Modules.Inventory.Services;
using api.Common.Models;
using System.Security.Claims;
using LibraryManagement.Shared.Attributes;

namespace api.Modules.Inventory.Controllers
{
    [ApiController]
    [Route("api/inventory/transactions")]
    [Authorize]
    public class InventoryTransactionsController : ControllerBase
    {
        private readonly IInventoryTransactionService _transactionService;
        private readonly ILogger<InventoryTransactionsController> _logger;

        public InventoryTransactionsController(
            IInventoryTransactionService transactionService,
            ILogger<InventoryTransactionsController> logger)
        {
            _transactionService = transactionService;
            _logger = logger;
        }

        /// <summary>
        /// Nhập kho sách
        /// </summary>
        [HttpPost("import")]
        [RequirePermission("inventory.import")]
        public async Task<IActionResult> ImportBook([FromBody] InventoryTransactionRequestDto request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
                var result = await _transactionService.ImportBookAsync(request, userId);

                return Ok(ApiResponse<InventoryTransactionResponseDto>.SuccessResponse(
                    result,
                    "Book imported successfully"
                ));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(400, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error importing book");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while importing the book"));
            }
        }

        /// <summary>
        /// Chuyển kho sách
        /// </summary>
        [HttpPost("transfer")]
        [RequirePermission("inventory.transfer")]
        public async Task<IActionResult> TransferBook([FromBody] InventoryTransferRequestDto request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
                var result = await _transactionService.TransferBookAsync(request, userId);

                return Ok(ApiResponse<InventoryTransactionResponseDto>.SuccessResponse(
                    result,
                    "Book transferred successfully"
                ));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(400, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error transferring book");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while transferring the book"));
            }
        }

        /// <summary>
        /// Kiểm kê sách
        /// </summary>
        [HttpPost("audit")]
        [RequirePermission("inventory.audit")]
        public async Task<IActionResult> AuditBook([FromBody] InventoryAuditRequestDto request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
                var result = await _transactionService.AuditBookAsync(request, userId);

                return Ok(ApiResponse<InventoryTransactionResponseDto>.SuccessResponse(
                    result,
                    "Book audited successfully"
                ));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(400, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error auditing book");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while auditing the book"));
            }
        }

        /// <summary>
        /// Đánh dấu sách bị mất
        /// </summary>
        [HttpPost("lost")]
        [RequirePermission("inventory.update")]
        public async Task<IActionResult> MarkAsLost([FromBody] MarkLostRequestDto request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
                var result = await _transactionService.MarkBookAsLostAsync(
                    request.BookCopyId,
                    request.Note,
                    userId
                );

                return Ok(ApiResponse<InventoryTransactionResponseDto>.SuccessResponse(
                    result,
                    "Book marked as lost"
                ));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(400, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking book as lost");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while marking the book as lost"));
            }
        }

        /// <summary>
        /// Đánh dấu sách tìm thấy
        /// </summary>
        [HttpPost("found")]
        [RequirePermission("inventory.update")]
        public async Task<IActionResult> MarkAsFound([FromBody] MarkFoundRequestDto request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
                var result = await _transactionService.MarkBookAsFoundAsync(
                    request.BookCopyId,
                    request.Note,
                    userId
                );

                return Ok(ApiResponse<InventoryTransactionResponseDto>.SuccessResponse(
                    result,
                    "Book marked as found"
                ));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(400, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking book as found");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while marking the book as found"));
            }
        }

        /// <summary>
        /// Đánh dấu sách bị hỏng
        /// </summary>
        [HttpPost("damaged")]
        [RequirePermission("inventory.update")]
        public async Task<IActionResult> MarkAsDamaged([FromBody] MarkDamagedRequestDto request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
                var result = await _transactionService.MarkBookAsDamagedAsync(
                    request.BookCopyId,
                    request.Note,
                    userId
                );

                return Ok(ApiResponse<InventoryTransactionResponseDto>.SuccessResponse(
                    result,
                    "Book marked as damaged"
                ));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(400, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking book as damaged");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while marking the book as damaged"));
            }
        }

        /// <summary>
        /// Lấy danh sách giao dịch
        /// </summary>
        [HttpGet]
        [RequirePermission("inventory.view")]
        public async Task<IActionResult> GetTransactions([FromQuery] InventoryTransactionQueryDto query)
        {
            try
            {
                var result = await _transactionService.GetTransactionsAsync(query);
                return Ok(ApiResponse<PagedResult<InventoryTransactionResponseDto>>.SuccessResponse(
                    result,
                    "Transactions retrieved successfully"
                ));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting transactions");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while retrieving transactions"));
            }
        }

        /// <summary>
        /// Lấy thông tin giao dịch theo ID
        /// </summary>
        [HttpGet("{id}")]
        [RequirePermission("inventory.view")]
        public async Task<IActionResult> GetById(string id)
        {
            try
            {
                var transaction = await _transactionService.GetByIdAsync(id);
                if (transaction == null)
                    return NotFound(ApiResponse<object>.ErrorResponse(404, "Transaction not found"));

                return Ok(ApiResponse<InventoryTransactionResponseDto>.SuccessResponse(
                    transaction,
                    "Transaction retrieved successfully"
                ));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting transaction {id}");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while retrieving the transaction"));
            }
        }

        /// <summary>
        /// Lấy lịch sử giao dịch của bản sao sách
        /// </summary>
        [HttpGet("book-copy/{bookCopyId}")]
        [RequirePermission("inventory.view")]
        public async Task<IActionResult> GetByBookCopy(string bookCopyId)
        {
            try
            {
                var transactions = await _transactionService.GetByBookCopyIdAsync(bookCopyId);
                return Ok(ApiResponse<List<InventoryTransactionResponseDto>>.SuccessResponse(
                    transactions,
                    "Transactions retrieved successfully"
                ));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting transactions for book copy {bookCopyId}");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while retrieving transactions"));
            }
        }

        /// <summary>
        /// Lấy lịch sử giao dịch của sách
        /// </summary>
        [HttpGet("book/{bookId}")]
        [RequirePermission("inventory.view")]
        public async Task<IActionResult> GetByBook(string bookId)
        {
            try
            {
                var transactions = await _transactionService.GetByBookIdAsync(bookId);
                return Ok(ApiResponse<List<InventoryTransactionResponseDto>>.SuccessResponse(
                    transactions,
                    "Transactions retrieved successfully"
                ));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting transactions for book {bookId}");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while retrieving transactions"));
            }
        }

        /// <summary>
        /// Lấy thống kê giao dịch
        /// </summary>
        [HttpGet("statistics")]
        [RequirePermission("inventory.view")]
        public async Task<IActionResult> GetStatistics([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
        {
            try
            {
                var statistics = await _transactionService.GetTransactionStatisticsAsync(fromDate, toDate);
                return Ok(ApiResponse<Dictionary<string, long>>.SuccessResponse(
                    statistics,
                    "Statistics retrieved successfully"
                ));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting statistics");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while retrieving statistics"));
            }
        }

        /// <summary>
        /// Hủy giao dịch
        /// </summary>
        [HttpPatch("{id}/cancel")]
        [RequirePermission("inventory.cancel")]
        public async Task<IActionResult> CancelTransaction(string id, [FromBody] CancelTransactionRequestDto request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
                var result = await _transactionService.CancelTransactionAsync(id, userId, request.Reason);

                if (!result)
                    return NotFound(ApiResponse<object>.ErrorResponse(404, "Transaction not found"));

                return Ok(ApiResponse.SuccessResponse("Transaction cancelled successfully"));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(400, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error cancelling transaction {id}");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while cancelling the transaction"));
            }
        }
    }
}