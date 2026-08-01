using api.Common.Models;
using api.Modules.SearchAndRecommendation.DTOs;
using api.Modules.SearchAndRecommendation.Services;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace api.Modules.SearchAndRecommendation.Controllers
{
    [ApiController]
    [Route("api/search")]
    public class SearchAndRecommendationController : ControllerBase
    {
        private readonly ISearchRecommendationService _service;
        private readonly ILogger<SearchAndRecommendationController> _logger;

        public SearchAndRecommendationController(ISearchRecommendationService service, ILogger<SearchAndRecommendationController> logger)
        {
            _service = service;
            _logger = logger;
        }

        /// <summary>
        /// Tìm kiếm sách nâng cao (Hỗ trợ phân trang, sắp xếp, lọc theo danh mục, tác giả, năm xuất bản, ngôn ngữ, thể loại truy cập)
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> SearchBooks([FromQuery] BookSearchFilterDto filter)
        {
            try
            {
                var result = await _service.SearchBooksAsync(filter);
                return Ok(ApiResponse<PagedResult<BookSearchDto>>.SuccessResponse(result, "Tìm kiếm sách thành công."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi xảy ra trong quá trình tìm kiếm sách.");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi tìm kiếm sách."));
            }
        }

        /// <summary>
        /// Gợi ý tìm kiếm (Autocomplete gợi ý sách & tác giả theo ký tự nhập vào)
        /// </summary>
        [HttpGet("suggestions")]
        public async Task<IActionResult> GetSuggestions([FromQuery] string q)
        {
            try
            {
                var result = await _service.GetSearchSuggestionsAsync(q);
                return Ok(ApiResponse<List<SearchSuggestionDto>>.SuccessResponse(result, "Lấy danh sách gợi ý thành công."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy gợi ý tìm kiếm cho từ khóa: {Query}", q);
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi lấy gợi ý tìm kiếm."));
            }
        }

        /// <summary>
        /// Lấy danh sách sách thịnh hành (Trending) (Được tính toán tự động dựa trên view/read/borrow và được cache Redis)
        /// </summary>
        [HttpGet("trending")]
        public async Task<IActionResult> GetTrending([FromQuery] int limit = 10)
        {
            try
            {
                if (limit <= 0 || limit > 100) limit = 10;
                var result = await _service.GetTrendingBooksAsync(limit);
                return Ok(ApiResponse<List<BookSearchDto>>.SuccessResponse(result, "Lấy danh sách sách thịnh hành thành công."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy danh sách sách thịnh hành.");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi lấy danh sách thịnh hành."));
            }
        }

        /// <summary>
        /// Đề xuất sách (Tự động nhận diện người dùng đã đăng nhập hoặc khách vãng lai và cache Redis)
        /// </summary>
        [HttpGet("recommendations")]
        public async Task<IActionResult> GetRecommendations([FromQuery] int limit = 10)
        {
            try
            {
                if (limit <= 0 || limit > 100) limit = 10;
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var result = await _service.GetRecommendationsAsync(userId, limit);
                return Ok(ApiResponse<List<BookSearchDto>>.SuccessResponse(result, "Lấy danh sách đề xuất thành công."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy danh sách đề xuất sách.");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi lấy danh sách đề xuất."));
            }
        }
    }
}
