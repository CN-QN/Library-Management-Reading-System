using api.Database.Entities;
using MongoDB.Driver;
using MongoDB.Bson;

namespace api.Database.Seed;

public class SeedRunner
{
    private readonly MongoDbContext _context;
    private readonly ILogger<SeedRunner> _logger;

    public SeedRunner(MongoDbContext context, ILogger<SeedRunner> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task RunSeedAsync()
    {
        try
        {
            _logger.LogInformation("Starting database seeding process...");

            // ===== 1. SEED BRANCH =====
            var defaultBranch = await SeedBranchAsync();

            // ===== 2. SEED ROLES =====
            await SeedRolesAsync();

            // ===== 3. SEED PERMISSIONS =====
            await SeedPermissionsAsync();

            // ===== 4. SEED ROLE-PERMISSIONS =====
            await SeedRolePermissionsAsync();

            // ===== 5. SEED USERS & USER ROLES =====
            await SeedUsersAsync(defaultBranch);

            // ===== 6. SEED AUTHORS =====
            await SeedAuthorsAsync();

            // ===== 7. SEED PUBLISHERS =====
            await SeedPublishersAsync();

            // ===== 8. SEED CATEGORIES =====
            await SeedCategoriesAsync();

            // ===== 9. SEED BOOKS (50+) =====
            var books = await SeedBooksAsync();

            // ===== 10. SEED CHAPTERS (100+) =====
            await SeedChaptersAsync(books);

            // ===== 11. SEED BOOK COPIES (100+) =====
            await SeedBookCopiesAsync(books, defaultBranch);

            _logger.LogInformation("Database seeding process completed successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred during database seeding.");
            throw;
        }
    }

    #region Auth & RBAC Seed Methods

    private async Task<LibraryBranch> SeedBranchAsync()
    {
        var defaultBranchCode = "MAIN";
        var existingBranch = await _context.LibraryBranches
            .Find(b => b.Code == defaultBranchCode)
            .FirstOrDefaultAsync();

        if (existingBranch != null) return existingBranch;

        _logger.LogInformation("Seeding default library branch...");
        var defaultBranch = new LibraryBranch
        {
            Code = defaultBranchCode,
            Name = "Thư viện Trung tâm",
            Address = "268 Lý Thường Kiệt, Quận 10, TP. HCM",
            Contact = "028 3864 7256",
            Status = "ACTIVE"
        };
        await _context.LibraryBranches.InsertOneAsync(defaultBranch);
        return defaultBranch;
    }

    private async Task SeedRolesAsync()
    {
        var count = await _context.Roles.CountDocumentsAsync(Builders<Role>.Filter.Empty);
        if (count > 0) return;

        _logger.LogInformation("Seeding default roles...");
        await _context.Roles.InsertManyAsync(RoleSeed.Roles);
    }

    private async Task SeedPermissionsAsync()
    {
        var count = await _context.Permissions.CountDocumentsAsync(Builders<Permission>.Filter.Empty);
        if (count > 0) return;

        _logger.LogInformation("Seeding default permissions...");
        await _context.Permissions.InsertManyAsync(PermissionSeed.Permissions);
    }

    private async Task SeedRolePermissionsAsync()
    {
        var count = await _context.RolePermissions.CountDocumentsAsync(Builders<RolePermission>.Filter.Empty);
        if (count > 0) return;

        _logger.LogInformation("Mapping roles to permissions...");
        var dbRoles = await _context.Roles.Find(Builders<Role>.Filter.Empty).ToListAsync();
        var dbPerms = await _context.Permissions.Find(Builders<Permission>.Filter.Empty).ToListAsync();

        var rolePermList = new List<RolePermission>();

        foreach (var role in dbRoles)
        {
            if (PermissionSeed.RolePermissionsMapping.TryGetValue(role.Code, out var mappedPermCodes))
            {
                foreach (var permCode in mappedPermCodes)
                {
                    var perm = dbPerms.FirstOrDefault(p => p.Code == permCode);
                    if (perm != null)
                    {
                        rolePermList.Add(new RolePermission
                        {
                            RoleId = role.Id,
                            PermissionId = perm.Id
                        });
                    }
                }
            }
        }

        if (rolePermList.Any())
        {
            await _context.RolePermissions.InsertManyAsync(rolePermList);
        }
    }

    private async Task SeedUsersAsync(LibraryBranch defaultBranch)
    {
        var count = await _context.Users.CountDocumentsAsync(Builders<User>.Filter.Empty);
        if (count > 0) return;

        _logger.LogInformation("Seeding test user accounts...");
        var dbRoles = await _context.Roles.Find(Builders<Role>.Filter.Empty).ToListAsync();

        foreach (var userItem in UserSeed.Users)
        {
            var role = dbRoles.FirstOrDefault(r => r.Code == userItem.RoleCode);
            if (role == null) continue;

            string? userBranchId = role.Scope == "BRANCH" ? defaultBranch.Id : null;

            var user = new User
            {
                Email = userItem.Email,
                StudentCode = userItem.StudentCode,
                FullName = userItem.FullName,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Test@123456"),
                Status = "ACTIVE",
                BranchId = userBranchId
            };

            await _context.Users.InsertOneAsync(user);

            var userRole = new UserRole
            {
                UserId = user.Id,
                RoleId = role.Id,
                BranchId = userBranchId
            };
            await _context.UserRoles.InsertOneAsync(userRole);
        }
    }

    #endregion

    #region Catalog Seed Methods (M03)

    private async Task SeedAuthorsAsync()
    {
        var count = await _context.Authors.CountDocumentsAsync(Builders<Author>.Filter.Empty);
        if (count > 0) return;

        _logger.LogInformation("Seeding authors...");
        var authors = new List<Author>
        {
            new() { Name = "Nguyễn Nhật Ánh", Slug = "nguyen-nhat-anh", Biography = "Nhà văn nổi tiếng với những tác phẩm về tuổi thơ" },
            new() { Name = "Tô Hoài", Slug = "to-hoai", Biography = "Tác giả của 'Dế Mèn phiêu lưu ký'" },
            new() { Name = "Nam Cao", Slug = "nam-cao", Biography = "Nhà văn hiện thực phê phán xuất sắc" },
            new() { Name = "Vũ Trọng Phụng", Slug = "vu-trong-phung", Biography = "Nhà văn trào phúng xuất sắc" },
            new() { Name = "Nguyễn Du", Slug = "nguyen-du", Biography = "Đại thi hào dân tộc" },
            new() { Name = "Hồ Chí Minh", Slug = "ho-chi-minh", Biography = "Lãnh tụ vĩ đại, nhà thơ lớn" },
            new() { Name = "Xuân Quỳnh", Slug = "xuan-quynh", Biography = "Nhà thơ nữ với nhiều tác phẩm về tình yêu" },
            new() { Name = "Nguyễn Minh Châu", Slug = "nguyen-minh-chau", Biography = "Nhà văn hiện đại xuất sắc" },
            new() { Name = "Nguyễn Huy Thiệp", Slug = "nguyen-huy-thiep", Biography = "Nhà văn đương đại nổi tiếng" },
            new() { Name = "Đỗ Chu", Slug = "do-chu", Biography = "Nhà văn với nhiều tác phẩm về miền Tây" }
        };
        await _context.Authors.InsertManyAsync(authors);
    }

    private async Task SeedPublishersAsync()
    {
        var count = await _context.Publishers.CountDocumentsAsync(Builders<Publisher>.Filter.Empty);
        if (count > 0) return;

        _logger.LogInformation("Seeding publishers...");
        var publishers = new List<Publisher>
        {
            new() { Name = "NXB Trẻ", Slug = "nxb-tre", Address = "TP. Hồ Chí Minh", Contact = "028 1234 5678" },
            new() { Name = "NXB Kim Đồng", Slug = "nxb-kim-dong", Address = "Hà Nội", Contact = "024 1234 5678" },
            new() { Name = "NXB Văn Học", Slug = "nxb-van-hoc", Address = "Hà Nội", Contact = "024 8765 4321" },
            new() { Name = "NXB Hội Nhà Văn", Slug = "nxb-hoi-nha-van", Address = "Hà Nội", Contact = "024 1234 8765" },
            new() { Name = "NXB Đại Học Quốc Gia", Slug = "nxb-dai-hoc-quoc-gia", Address = "Hà Nội", Contact = "024 5678 1234" }
        };
        await _context.Publishers.InsertManyAsync(publishers);
    }

    private async Task SeedCategoriesAsync()
    {
        var count = await _context.Categories.CountDocumentsAsync(Builders<Category>.Filter.Empty);
        if (count > 0) return;

        _logger.LogInformation("Seeding categories...");
        var categories = new List<Category>
        {
            new() { Name = "Văn học", Slug = "van-hoc", Status = "ACTIVE" },
            new() { Name = "Khoa học", Slug = "khoa-hoc", Status = "ACTIVE" },
            new() { Name = "Kỹ năng sống", Slug = "ky-nang-song", Status = "ACTIVE" },
            new() { Name = "Lịch sử", Slug = "lich-su", Status = "ACTIVE" },
            new() { Name = "Thiếu nhi", Slug = "thieu-nhi", Status = "ACTIVE" },
            new() { Name = "Tiểu thuyết", Slug = "tieu-thuyet", ParentId = null, Path = "/van-hoc/tieu-thuyet", Status = "ACTIVE" },
            new() { Name = "Truyện ngắn", Slug = "truyen-ngan", ParentId = null, Path = "/van-hoc/truyen-ngan", Status = "ACTIVE" },
            new() { Name = "Thơ", Slug = "tho", ParentId = null, Path = "/van-hoc/tho", Status = "ACTIVE" }
        };
        await _context.Categories.InsertManyAsync(categories);
    }

    private async Task<List<Book>> SeedBooksAsync()
    {
        var count = await _context.Books.CountDocumentsAsync(Builders<Book>.Filter.Empty);
        if (count > 0)
        {
            return await _context.Books.Find(Builders<Book>.Filter.Empty).ToListAsync();
        }

        _logger.LogInformation("Seeding 50+ books...");
        var authors = await _context.Authors.Find(Builders<Author>.Filter.Empty).ToListAsync();
        var publishers = await _context.Publishers.Find(Builders<Publisher>.Filter.Empty).ToListAsync();
        var categories = await _context.Categories.Find(Builders<Category>.Filter.Empty).ToListAsync();

        var books = new List<Book>();
        var random = new Random();

        var bookData = new[]
        {
            ("Dế Mèn phiêu lưu ký", "de-men-phieu-luu-ky", "9786041000001", "Cuộc phiêu lưu của chú dế mèn", 1941),
            ("Chí Phèo", "chi-pheo", "9786041000002", "Tác phẩm kinh điển về người nông dân", 1941),
            ("Số đỏ", "so-do", "9786041000003", "Tác phẩm trào phúng xuất sắc", 1936),
            ("Truyện Kiều", "truyen-kieu", "9786041000004", "Kiệt tác của Nguyễn Du", 1820),
            ("Nhật ký trong tù", "nhat-ky-trong-tu", "9786041000005", "Tập thơ của Bác Hồ", 1943),
            ("Thơ Xuân Quỳnh", "tho-xuan-quynh", "9786041000006", "Tuyển tập thơ Xuân Quỳnh", 1970),
            ("Mảnh trăng cuối rừng", "manh-trang-cuoi-rung", "9786041000007", "Truyện ngắn Nguyễn Minh Châu", 1978),
            ("Tướng về hưu", "tuong-ve-huu", "9786041000008", "Truyện ngắn Nguyễn Huy Thiệp", 1987),
            ("Hương rừng Cà Mau", "huong-rung-ca-mau", "9786041000009", "Truyện ngắn Đỗ Chu", 1990),
            ("Chuyện con mèo dạy hải âu bay", "chuyen-con-meo-day-hai-au-bay", "9786041000010", "Truyện thiếu nhi nổi tiếng", 1996),
            ("Tôi thấy hoa vàng trên cỏ xanh", "toi-thay-hoa-vang-tren-co-xanh", "9786041000011", "Truyện dài Nguyễn Nhật Ánh", 2010),
            ("Cho tôi xin một vé đi tuổi thơ", "cho-toi-xin-mot-ve-di-tuoi-tho", "9786041000012", "Truyện dài Nguyễn Nhật Ánh", 2008),
            ("Mắt biếc", "mat-biec", "9786041000013", "Truyện dài Nguyễn Nhật Ánh", 1990),
            ("Lão Hạc", "lao-hac", "9786041000014", "Truyện ngắn Nam Cao", 1943),
            ("Đời thừa", "doi-thua", "9786041000015", "Truyện ngắn Nam Cao", 1943),
            ("Giông tố", "giong-to", "9786041000016", "Tác phẩm Vũ Trọng Phụng", 1936),
            ("Kỹ nghệ lấy tây", "ky-nghe-lay-tay", "9786041000017", "Tác phẩm Vũ Trọng Phụng", 1937),
            ("Truyện ngắn Tô Hoài", "truyen-ngan-to-hoai", "9786041000018", "Tuyển tập truyện ngắn Tô Hoài", 1940),
            ("Nhà trọ", "nha-tro", "9786041000019", "Truyện ngắn Tô Hoài", 1942),
            ("Cô gái đến từ hôm qua", "co-gai-den-tu-hom-qua", "9786041000020", "Truyện dài Nguyễn Nhật Ánh", 1989),
            ("Bàn có năm chỗ ngồi", "ban-co-nam-cho-ngoi", "9786041000021", "Truyện dài Nguyễn Nhật Ánh", 2003),
            ("Ngôi trường mọi khi", "ngoi-truong-moi-khi", "9786041000022", "Truyện dài Nguyễn Nhật Ánh", 2001),
            ("Sương khói quê nhà", "suong-khoi-que-nha", "9786041000023", "Truyện dài Nguyễn Nhật Ánh", 1992),
            ("Cánh đồng bất tận", "canh-dong-bat-tan", "9786041000024", "Truyện ngắn Nguyễn Ngọc Tư", 2005),
            ("Đảo mộng mơ", "dao-mong-mo", "9786041000025", "Truyện dài", 2005),
            ("Hạnh phúc của một tang gia", "hanh-phuc-cua-mot-tang-gia", "9786041000026", "Truyện ngắn Vũ Trọng Phụng", 1934),
            ("Vỡ đê", "vo-de", "9786041000027", "Truyện ngắn Vũ Trọng Phụng", 1934),
            ("Tắt đèn", "tat-den", "9786041000028", "Tiểu thuyết Ngô Tất Tố", 1939),
            ("Bước đường cùng", "buoc-duong-cung", "9786041000029", "Tiểu thuyết Nguyễn Công Hoan", 1938),
            ("Những ngày thơ ấu", "nhung-ngay-tho-au", "9786041000030", "Hồi ký Nguyên Hồng", 1938),
            // Thêm 20 sách nữa để đạt 50+
            ("Đất nước đứng lên", "dat-nung-dung-len", "9786041000031", "Tiểu thuyết", 1954),
            ("Rừng xà nu", "rung-xa-nu", "9786041000032", "Truyện ngắn Nguyễn Trung Thành", 1965),
            ("Mùa lá rụng trong vườn", "mua-la-rung-trong-vuon", "9786041000033", "Truyện dài Ma Văn Kháng", 1985),
            ("Thời xa vắng", "thoi-xa-vang", "9786041000034", "Tiểu thuyết Lê Lựu", 1986),
            ("Nỗi buồn chiến tranh", "noi-buon-chien-tranh", "9786041000035", "Tiểu thuyết Bảo Ninh", 1991),
            ("Mảnh đất lắm người nhiều ma", "manh-dat-lam-nguoi-nhieu-ma", "9786041000036", "Truyện dài Nguyễn Khắc Trường", 1990),
            ("Hồi ký Nguyễn Hiến Lê", "hoi-ky-nguyen-hien-le", "9786041000037", "Hồi ký", 1994),
            ("Người con gái Nam Xương", "nguoi-con-gai-nam-xuong", "9786041000038", "Truyện cổ tích", 1580),
            ("Chuyện người con gái Nam Xương", "chuyen-nguoi-con-gai-nam-xuong", "9786041000039", "Truyện cổ tích", 1580),
            ("Truyện cổ tích Việt Nam", "truyen-co-tich-viet-nam", "9786041000040", "Tuyển tập cổ tích", 1900),
            ("Cổ tích Việt Nam", "co-tich-viet-nam", "9786041000041", "Tuyển tập cổ tích", 1900),
            ("Kho tàng truyện cổ tích", "kho-tang-truyen-co-tich", "9786041000042", "Tuyển tập cổ tích", 1900),
            ("Truyện cổ Grimm", "truyen-co-grimm", "9786041000043", "Truyện cổ tích thế giới", 1812),
            ("Truyện cổ Andersen", "truyen-co-andersen", "9786041000044", "Truyện cổ tích thế giới", 1835),
            ("Nghìn lẻ một đêm", "ngin-le-mot-dem", "9786041000045", "Truyện cổ tích phương Đông", 1700),
            ("Hoàng tử bé", "hoang-tu-be", "9786041000046", "Tiểu thuyết Antoine de Saint-Exupéry", 1943),
            ("Tôi là Bêtô", "toi-la-beto", "9786041000047", "Truyện thiếu nhi Nguyễn Nhật Ánh", 2007),
            ("Lá nằm trong lá", "la-nam-trong-la", "9786041000048", "Truyện dài Nguyễn Nhật Ánh", 2017),
            ("Ngày xưa có một chuyện tình", "ngay-xua-co-mot-chuyen-tinh", "9786041000049", "Truyện dài Nguyễn Nhật Ánh", 2019),
            ("Chúc một ngày tốt lành", "chuc-mot-ngay-tot-lanh", "9786041000050", "Truyện dài Nguyễn Nhật Ánh", 2020)
        };

        var coverUrls = new[]
        {
            "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=400",
            "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=400",
            "https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=400",
            "https://images.unsplash.com/photo-1495640388908-05fa85288e61?q=80&w=400",
            "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=400",
            "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=400",
            "https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=400"
        };

        foreach (var (title, slug, isbn, summary, year) in bookData)
        {
            var book = new Book
            {
                Title = title,
                Slug = slug,
                ISBN = isbn,
                Summary = summary,
                PublicationYear = year,
                Language = "vi",
                CoverAssetId = coverUrls[random.Next(coverUrls.Length)],
                AccessType = random.Next(0, 3) == 0 ? "PREMIUM" : "FREE",
                Status = "PUBLISHED",
                TotalChapters = 0,
                PublisherId = publishers[random.Next(publishers.Count)].Id,
                CreatedBy = "system",
                CreatedAt = DateTime.UtcNow.AddDays(-random.Next(1, 365)),
                UpdatedAt = DateTime.UtcNow,
                Stats = new BookStats
                {
                    ViewCount = random.Next(100, 5000),
                    ReadingCount = random.Next(50, 2000),
                    Rating = Math.Round(random.NextDouble() * 2 + 3, 1),
                    RatingCount = random.Next(10, 150)
                }
            };
            books.Add(book);
        }

        if (books.Any())
        {
            await _context.Books.InsertManyAsync(books);
            _logger.LogInformation($"Seeded {books.Count} books");
        }

        return books;
    }

    #endregion

    #region DigitalContent Seed Methods (M04)

    private async Task SeedChaptersAsync(List<Book> books)
    {
        var count = await _context.Chapters.CountDocumentsAsync(Builders<Chapter>.Filter.Empty);
        if (count > 0) return;

        if (!books.Any()) return;

        _logger.LogInformation("Seeding 100+ chapters...");
        var chapters = new List<Chapter>();
        var random = new Random();

        foreach (var book in books)
        {
            var chapterCount = random.Next(5, 15);
            for (int i = 1; i <= chapterCount; i++)
            {
                var isPublished = random.Next(0, 5) < 4;

                var chapter = new Chapter
                {
                    BookId = book.Id,
                    Number = i,
                    Title = $"Chương {i}: {GenerateChapterTitle(random)}",
                    // [SỬA] Dùng Content thay vì ContentJson
                    Content = new ChapterContent
                    {
                        Introduction = $"Giới thiệu chương {i}",
                        Paragraphs = new List<Paragraph>
                        {
                            new Paragraph { Id = Guid.NewGuid().ToString(), Text = GenerateParagraphText(random), Order = 1 },
                            new Paragraph { Id = Guid.NewGuid().ToString(), Text = GenerateParagraphText(random), Order = 2 },
                            new Paragraph { Id = Guid.NewGuid().ToString(), Text = GenerateParagraphText(random), Order = 3 }
                        },
                        Conclusion = $"Kết luận chương {i}"
                    },
                    WordCount = random.Next(500, 3000),
                    Status = isPublished ? "PUBLISHED" : "DRAFT",
                    // [SỬA] Xóa Version và UpdatedBy
                    PublishedAt = isPublished ? DateTime.UtcNow.AddDays(-random.Next(1, 365)) : null,
                    CreatedBy = "system",
                    CreatedAt = DateTime.UtcNow.AddDays(-random.Next(1, 365)),
                    UpdatedAt = DateTime.UtcNow
                };
                chapters.Add(chapter);
            }
        }

        if (chapters.Any())
        {
            await _context.Chapters.InsertManyAsync(chapters);
            _logger.LogInformation($"Seeded {chapters.Count} chapters");

            // Update total chapters for books
            foreach (var book in books)
            {
                var publishedCount = chapters.Count(c => c.BookId == book.Id && c.Status == "PUBLISHED");
                if (publishedCount > 0)
                {
                    var update = Builders<Book>.Update.Set(b => b.TotalChapters, publishedCount);
                    await _context.Books.UpdateOneAsync(b => b.Id == book.Id, update);
                }
            }
        }
    }
    #endregion

    #region Inventory Seed Methods (M05)

    private async Task SeedBookCopiesAsync(List<Book> books, LibraryBranch defaultBranch)
    {
        var count = await _context.BookCopies.CountDocumentsAsync(Builders<BookCopy>.Filter.Empty);
        if (count > 0) return;

        if (!books.Any()) return;

        _logger.LogInformation("Seeding 100+ book copies...");
        var copies = new List<BookCopy>();
        var random = new Random();
        var branchId = defaultBranch?.Id;
        var counter = 1;

        var statuses = new[] { "AVAILABLE", "BORROWED", "RESERVED", "MAINTENANCE" };
        var conditions = new[] { "NEW", "GOOD", "DAMAGED" };

        foreach (var book in books)
        {
            var copyCount = random.Next(2, 6);
            for (int i = 1; i <= copyCount; i++)
            {
                var status = statuses[random.Next(statuses.Length)];
                var condition = conditions[random.Next(conditions.Length)];

                var copy = new BookCopy
                {
                    BookId = book.Id,
                    BranchId = branchId ?? "BRANCH001",
                    Barcode = $"BC{counter:D10}",
                    ShelfCode = $"A{random.Next(1, 10)}-{random.Next(1, 20):D2}",
                    Condition = condition,
                    Status = status,
                    Price = random.Next(50000, 300000),
                    AcquiredAt = DateTime.UtcNow.AddDays(-random.Next(1, 730)),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                copies.Add(copy);
                counter++;
            }
        }

        if (copies.Any())
        {
            await _context.BookCopies.InsertManyAsync(copies);
            _logger.LogInformation($"Seeded {copies.Count} book copies");
        }
    }

    #endregion

    #region Helper Methods

    private string GenerateChapterTitle(Random random)
    {
        var titles = new[]
        {
            "Mở đầu câu chuyện", "Những điều chưa kể", "Cuộc gặp gỡ định mệnh",
            "Bước ngoặt cuộc đời", "Tình bạn và tình yêu", "Những ngày tháng khó quên",
            "Bí mật được hé lộ", "Hành trình mới", "Bài học cuộc sống",
            "Kết thúc và khởi đầu mới", "Trong bóng tối", "Ánh sáng le lói",
            "Nỗi đau và hy vọng", "Sự hy sinh cao cả", "Tình yêu thương vô bờ",
            "Những giấc mơ", "Thực tại phũ phàng", "Bước qua nỗi sợ",
            "Hạnh phúc giản đơn", "Vượt qua giới hạn"
        };
        return titles[random.Next(titles.Length)];
    }
    private string GenerateParagraphText(Random random)
    {
        var texts = new[]
        {
            "Trời hôm nay thật đẹp, nắng vàng rải nhẹ trên những tán cây xanh mướt.",
            "Cơn gió nhẹ nhàng thổi qua, mang theo hương thơm của những bông hoa dại.",
            "Tiếng chim hót líu lo như bản nhạc du dương của buổi sớm mai.",
            "Trong không gian yên tĩnh, chỉ còn tiếng lá rơi xào xạc.",
            "Ánh đèn vàng hắt ra từ căn phòng nhỏ, ấm áp và bình yên.",
            "Những giọt mưa lăn dài trên cửa kính, như những giọt lệ của bầu trời.",
            "Mùi hương của đất ẩm sau cơn mưa thật dễ chịu.",
            "Tiếng cười vang vọng trong không gian, xua tan mọi mệt mỏi.",
            "Bầu trời đêm đầy sao, lung linh như những viên kim cương.",
            "Gió thổi vi vu, mang theo hương vị của biển cả bao la."
        };
        return texts[random.Next(texts.Length)];
    }
    private string GenerateChapterContent(Random random)
    {
        var paragraphs = new[]
        {
            "Trời hôm nay thật đẹp, nắng vàng rải nhẹ trên những tán cây xanh mướt.",
            "Cơn gió nhẹ nhàng thổi qua, mang theo hương thơm của những bông hoa dại.",
            "Tiếng chim hót líu lo như bản nhạc du dương của buổi sớm mai.",
            "Trong không gian yên tĩnh, chỉ còn tiếng lá rơi xào xạc.",
            "Ánh đèn vàng hắt ra từ căn phòng nhỏ, ấm áp và bình yên.",
            "Những giọt mưa lăn dài trên cửa kính, như những giọt lệ của bầu trời.",
            "Mùi hương của đất ẩm sau cơn mưa thật dễ chịu.",
            "Tiếng cười vang vọng trong không gian, xua tan mọi mệt mỏi.",
            "Bầu trời đêm đầy sao, lung linh như những viên kim cương.",
            "Gió thổi vi vu, mang theo hương vị của biển cả bao la."
        };

        var nodes = new List<object>();
        var paragraphCount = random.Next(3, 8);

        for (int i = 0; i < paragraphCount; i++)
        {
            var selectedText = string.Join(" ", paragraphs
                .OrderBy(_ => random.Next())
                .Take(random.Next(2, 4)));

            nodes.Add(new
            {
                type = "paragraph",
                content = new[] { new { type = "text", text = selectedText } }
            });
        }

        return System.Text.Json.JsonSerializer.Serialize(new
        {
            type = "doc",
            content = nodes
        });
    }

    #endregion
}