using System.Text.RegularExpressions;
using api.Common.Models;
using api.Database;
using api.Database.Entities;
using api.Modules.Catalog.DTOs;
using MongoDB.Bson;
using MongoDB.Driver;

namespace api.Modules.Catalog.Services
{
    public class AuthorService : IAuthorService
    {
        private readonly MongoDbContext _context;
        private readonly ILogger<AuthorService> _logger;

        public AuthorService(MongoDbContext context, ILogger<AuthorService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<PagedResult<AuthorResponseDto>> GetAuthorsAsync(string? search, int page = 1, int pageSize = 20)
        {
            var filterBuilder = Builders<Author>.Filter;
            var filter = filterBuilder.Empty;

            if (!string.IsNullOrWhiteSpace(search))
            {
                filter = filterBuilder.Regex(a => a.Name, new BsonRegularExpression(search, "i"));
            }

            var totalCount = await _context.Authors.CountDocumentsAsync(filter);
            var authors = await _context.Authors.Find(filter)
                .SortByDescending(a => a.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Limit(pageSize)
                .ToListAsync();

            var items = authors.Select(MapToResponseDto).ToList();

            return new PagedResult<AuthorResponseDto>(items, page, pageSize, totalCount);
        }

        public async Task<AuthorResponseDto?> GetAuthorByIdAsync(string id)
        {
            var author = await _context.Authors.Find(a => a.Id == id).FirstOrDefaultAsync();
            return author == null ? null : MapToResponseDto(author);
        }

        public async Task<AuthorResponseDto> CreateAuthorAsync(CreateAuthorDto dto)
        {
            var slug = GenerateSlug(dto.Name);
            
            // Ensure unique slug
            var existingSlug = await _context.Authors.Find(a => a.Slug == slug).FirstOrDefaultAsync();
            if (existingSlug != null)
            {
                slug = $"{slug}-{Guid.NewGuid().ToString("N")[..6]}";
            }

            var author = new Author
            {
                Name = dto.Name.Trim(),
                Slug = slug,
                Biography = dto.Biography,
                Avatar = dto.Avatar,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _context.Authors.InsertOneAsync(author);
            _logger.LogInformation("Created new author: {AuthorName} (ID: {AuthorId})", author.Name, author.Id);

            return MapToResponseDto(author);
        }

        public async Task<AuthorResponseDto?> UpdateAuthorAsync(string id, UpdateAuthorDto dto)
        {
            var author = await _context.Authors.Find(a => a.Id == id).FirstOrDefaultAsync();
            if (author == null) return null;

            var newSlug = author.Name != dto.Name ? GenerateSlug(dto.Name) : author.Slug;
            if (newSlug != author.Slug)
            {
                var existingSlug = await _context.Authors.Find(a => a.Slug == newSlug && a.Id != id).FirstOrDefaultAsync();
                if (existingSlug != null)
                {
                    newSlug = $"{newSlug}-{Guid.NewGuid().ToString("N")[..6]}";
                }
            }

            author.Name = dto.Name.Trim();
            author.Slug = newSlug;
            author.Biography = dto.Biography;
            author.Avatar = dto.Avatar;
            author.UpdatedAt = DateTime.UtcNow;

            await _context.Authors.ReplaceOneAsync(a => a.Id == id, author);
            _logger.LogInformation("Updated author: {AuthorId}", id);

            return MapToResponseDto(author);
        }

        public async Task<bool> DeleteAuthorAsync(string id)
        {
            var result = await _context.Authors.DeleteOneAsync(a => a.Id == id);
            return result.DeletedCount > 0;
        }

        private static AuthorResponseDto MapToResponseDto(Author author)
        {
            return new AuthorResponseDto
            {
                Id = author.Id,
                Name = author.Name,
                Slug = author.Slug,
                Biography = author.Biography,
                Avatar = author.Avatar,
                CreatedAt = author.CreatedAt,
                UpdatedAt = author.UpdatedAt
            };
        }

        private static string GenerateSlug(string text)
        {
            string str = text.ToLowerInvariant();

            // Replace accented vietnamese chars
            string[] vietnameseSigns = new string[]
            {
                "aàảãáạăằẳẵắặâầẩẫấậ", "dđ", "eèẻẽéẹêềểễếệ",
                "iìỉĩíị", "oòỏõóọôồổỗốộơờởỡớợ",
                "uùủũúụưừửữứự", "yỳỷỹýỵ"
            };

            for (int i = 1; i < vietnameseSigns.Length; i++)
            {
                for (int j = 0; j < vietnameseSigns[i].Length; j++)
                {
                    str = str.Replace(vietnameseSigns[i][j], vietnameseSigns[i][0]);
                }
            }

            // Remove invalid characters
            str = Regex.Replace(str, @"[^a-z0-9\s-]", "");
            // Convert multiple spaces into single space
            str = Regex.Replace(str, @"\s+", " ").Trim();
            // Replace spaces with hyphens
            str = Regex.Replace(str, @"\s", "-");

            return string.IsNullOrWhiteSpace(str) ? "author" : str;
        }
    }
}
