using api.Modules.Catalog.DTOs;
using api.Modules.Catalog.DTOs.Requests;
using api.Modules.Catalog.Services;
using api.Tests.TestSupport;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace api.Tests.Modules.Catalog;

public sealed class BookMetadataSlugTests
{
    [Fact]
    public async Task Create_generates_snapshot_ids_when_metadata_ids_are_omitted()
    {
        var service = new BookService(new FakeBookRepository(), NullLogger<BookService>.Instance);

        var result = await service.CreateAsync(new CreateBookDto
        {
            Title = "Tôi Thấy Hoa Vàng Trên Cỏ Xanh",
            Authors = [new BookAuthorDto { Name = "Nguyễn Nhật Ánh" }],
            Categories = [new BookCategoryDto { Name = "Thiếu nhi" }],
            Publisher = new BookPublisherDto { Name = "NXB Trẻ" }
        }, "user-1");

        result.Authors.Should().ContainSingle().Which.AuthorId.Should().Be("author:nguyen-nhat-anh");
        result.Categories.Should().ContainSingle().Which.CategoryId.Should().Be("category:thieu-nhi");
        result.Publisher!.PublisherId.Should().Be("publisher:nxb-tre");
    }

    [Fact]
    public async Task Create_generates_embedded_slugs_from_names_and_ignores_client_values()
    {
        var repository = new FakeBookRepository();
        var service = new BookService(repository, NullLogger<BookService>.Instance);

        var result = await service.CreateAsync(new CreateBookDto
        {
            Title = "Dế Mèn Phiêu Lưu Ký",
            Authors =
            [
                new BookAuthorDto
                {
                    AuthorId = "author-1",
                    Name = "Tô Hoài",
                    Slug = "client-controlled",
                    Role = "AUTHOR",
                    Order = 1
                }
            ],
            Categories =
            [
                new BookCategoryDto
                {
                    CategoryId = "category-1",
                    Name = "Văn học",
                    Slug = "client-controlled"
                }
            ],
            Publisher = new BookPublisherDto
            {
                PublisherId = "publisher-1",
                Name = "NXB Kim Đồng",
                Slug = "client-controlled"
            }
        }, "user-1");

        result.Slug.Should().Be("de-men-phieu-luu-ky");
        result.Authors.Should().ContainSingle().Which.Slug.Should().Be("to-hoai");
        result.Categories.Should().ContainSingle().Which.Slug.Should().Be("van-hoc");
        result.Publisher!.Slug.Should().Be("nxb-kim-dong");
    }
}
