using api.Common.Models;
using api.Modules.Catalog.DTOs;

namespace api.Modules.Catalog.Services
{
    public interface IAuthorService
    {
        Task<PagedResult<AuthorResponseDto>> GetAuthorsAsync(string? search, int page = 1, int pageSize = 20);
        Task<AuthorResponseDto?> GetAuthorByIdAsync(string id);
        Task<AuthorResponseDto> CreateAuthorAsync(CreateAuthorDto dto);
        Task<AuthorResponseDto?> UpdateAuthorAsync(string id, UpdateAuthorDto dto);
        Task<bool> DeleteAuthorAsync(string id);
    }
}
