using api.Common.Models;
using api.Database.Entities;
using api.Modules.SearchAndRecommendation.DTOs;

namespace api.Repositories.Interfaces
{
    public interface ISearchRecommendationRepository
    {
        Task<PagedResult<BookSearchDto>> SearchBooksAsync(BookSearchFilterDto filter);
        Task<List<SearchSuggestionDto>> GetSearchSuggestionsAsync(string query);
        Task<List<Book>> GetBooksByIdsAsync(List<string> bookIds);
        Task<List<string>> GetUserReadBookIdsAsync(string userId);
        Task<List<string>> GetBookAuthorIdsAsync(List<string> bookIds);
        Task<List<string>> GetBookCategoryIdsAsync(List<string> bookIds);
        Task<List<Book>> GetSimilarBooksAsync(List<string> authorIds, List<string> categoryIds, List<string> excludeBookIds, int limit);
        Task<List<Book>> GetGeneralRecommendationsAsync(int limit);
        Task<List<ViewEvent>> GetViewEventsSinceAsync(DateTime since);
        Task<List<Borrowing>> GetBorrowingsSinceAsync(DateTime since);
        Task<List<BorrowingItem>> GetBorrowingItemsByBorrowingIdsAsync(List<string> borrowingIds);
        Task<List<BookCopy>> GetCopiesByIdsAsync(List<string> copyIds);
        Task<List<BookSearchDto>> GetBookDetailsByIdsAsync(List<string> bookIds);
    }
}
