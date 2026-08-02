using api.Common.Models;
using api.Modules.SearchAndRecommendation.DTOs;

namespace api.Modules.SearchAndRecommendation.Services
{
    public interface ISearchRecommendationService
    {
        Task<PagedResult<BookSearchDto>> SearchBooksAsync(BookSearchFilterDto filter);
        Task<List<SearchSuggestionDto>> GetSearchSuggestionsAsync(string query);
        Task<List<BookSearchDto>> GetTrendingBooksAsync(int limit);
        Task<List<BookSearchDto>> GetRecommendationsAsync(string? userId, int limit);
    }
}
