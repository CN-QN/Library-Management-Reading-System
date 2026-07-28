using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using api.Modules.Catalog.DTOs.Requests;
using api.Modules.Catalog.DTOs.Responses;
using api.Modules.Catalog.Services;
using api.Common.Models;
using System.Security.Claims;

namespace api.Modules.Catalog.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class BooksController : ControllerBase
    {
        private readonly IBookService _bookService;
        private readonly ILogger<BooksController> _logger;

        public BooksController(IBookService bookService, ILogger<BooksController> logger)
        {
            _bookService = bookService;
            _logger = logger;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> Search([FromQuery] BookQueryDto query)
        {
            try
            {
                var result = await _bookService.SearchAsync(query);
                return Ok(ApiResponse<PagedResult<BookResponseDto>>.SuccessResponse(
                    result,
                    "Books retrieved successfully",
                    new { query.Page, query.Limit, result.TotalItems, result.TotalPages, result.HasNext }
                ));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching books");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while searching books"));
            }
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetById(string id)
        {
            try
            {
                var book = await _bookService.GetByIdAsync(id);
                if (book == null)
                    return NotFound(ApiResponse<object>.ErrorResponse(404, "Book not found"));

                _ = _bookService.IncrementViewAsync(id);
                return Ok(ApiResponse<BookResponseDto>.SuccessResponse(book, "Book retrieved successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting book {id}");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while retrieving the book"));
            }
        }

        [HttpGet("slug/{slug}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetBySlug(string slug)
        {
            try
            {
                var book = await _bookService.GetBySlugAsync(slug);
                if (book == null)
                    return NotFound(ApiResponse<object>.ErrorResponse(404, "Book not found"));

                _ = _bookService.IncrementViewAsync(book.Id);
                return Ok(ApiResponse<BookResponseDto>.SuccessResponse(book, "Book retrieved successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting book by slug {slug}");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while retrieving the book"));
            }
        }

        [HttpGet("trending")]
        [AllowAnonymous]
        public async Task<IActionResult> GetTrending([FromQuery] int limit = 10)
        {
            try
            {
                var books = await _bookService.GetTrendingAsync(Math.Min(limit, 50));
                return Ok(ApiResponse<List<BookResponseDto>>.SuccessResponse(books, "Trending books retrieved"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting trending books");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while retrieving trending books"));
            }
        }

        [HttpGet("new-releases")]
        [AllowAnonymous]
        public async Task<IActionResult> GetNewReleases([FromQuery] int limit = 10)
        {
            try
            {
                var books = await _bookService.GetNewReleasesAsync(Math.Min(limit, 50));
                return Ok(ApiResponse<List<BookResponseDto>>.SuccessResponse(books, "New releases retrieved"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting new releases");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while retrieving new releases"));
            }
        }

        [HttpPost]
        [Authorize(Policy = "book.create")]
        public async Task<IActionResult> Create([FromBody] CreateBookDto dto)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
                var book = await _bookService.CreateAsync(dto, userId);

                return CreatedAtAction(
                    nameof(GetById),
                    new { id = book.Id },
                    ApiResponse<BookResponseDto>.SuccessResponse(book, "Book created successfully", null, 201)
                );
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(400, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating book");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while creating the book"));
            }
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "book.update")]
        public async Task<IActionResult> Update(string id, [FromBody] UpdateBookDto dto)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
                var book = await _bookService.UpdateAsync(id, dto, userId);

                if (book == null)
                    return NotFound(ApiResponse<object>.ErrorResponse(404, "Book not found"));

                return Ok(ApiResponse<BookResponseDto>.SuccessResponse(book, "Book updated successfully"));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(400, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating book {id}");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while updating the book"));
            }
        }

        [HttpPatch("{id}/status")]
        [Authorize(Policy = "book.publish")]
        public async Task<IActionResult> UpdateStatus(string id, [FromBody] UpdateStatusDto dto)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
                var book = await _bookService.UpdateStatusAsync(id, dto.Status, userId);

                if (book == null)
                    return NotFound(ApiResponse<object>.ErrorResponse(404, "Book not found"));

                return Ok(ApiResponse<BookResponseDto>.SuccessResponse(book, $"Book status updated to {dto.Status}"));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(400, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating status for book {id}");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while updating status"));
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "book.delete")]
        public async Task<IActionResult> Delete(string id)
        {
            try
            {
                var result = await _bookService.DeleteAsync(id);
                if (!result)
                    return NotFound(ApiResponse<object>.ErrorResponse(404, "Book not found"));

                return Ok(ApiResponse.SuccessResponse("Book archived successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting book {id}");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while archiving the book"));
            }
        }

        [HttpGet("validate-slug/{slug}")]
        [AllowAnonymous]
        public async Task<IActionResult> ValidateSlug(string slug)
        {
            try
            {
                var isValid = await _bookService.ValidateSlugAsync(slug);
                return Ok(new { isValid, message = isValid ? "Slug is available" : "Slug already exists" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error validating slug {slug}");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while validating slug"));
            }
        }

        [HttpGet("validate-isbn/{isbn}")]
        [AllowAnonymous]
        public async Task<IActionResult> ValidateISBN(string isbn)
        {
            try
            {
                var isValid = await _bookService.ValidateISBNAsync(isbn);
                return Ok(new { isValid, message = isValid ? "ISBN is available" : "ISBN already exists" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error validating ISBN {isbn}");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while validating ISBN"));
            }
        }
    }
}