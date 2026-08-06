using api.Database.Entities;
using MongoDB.Driver;
using MongoDB.Bson;
using System.Text.Json;

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

            // ===== 6. DEVELOPMENT CLEANUP =====
            await CleanupDevelopmentCollectionsAsync();

            // ===== 7. SEED BOOKS (embeds Authors, Categories, Publishers, Chapters) =====
            var books = await SeedBooksAsync();

            // ===== 8. SEED BOOK COPIES (100+) =====
            await SeedBookCopiesAsync(books, defaultBranch);

            // ===== 9. SEED SAMPLE REVIEWS =====
            await SeedReviewsAsync(books);

            // ===== 10. SYNC RATING STATS FOR ALL BOOKS =====
            await SyncAllBookRatingStatsAsync();

            // ===== 11. SEED PROMOTIONS (VOUCHERS, BANNERS, FLASH SALE) =====
            await SeedPromotionsAsync();

            // ===== 12. SEED SAMPLE BORROWINGS & SEPAY REVENUE =====
            var allUsers = await _context.Users.Find(Builders<User>.Filter.Empty).ToListAsync();
            await SeedBorrowingsAndPaymentOrdersAsync(books, allUsers, defaultBranch);

            _logger.LogInformation("Database seeding process completed successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred during database seeding.");
            throw;
        }
    }

    private async Task CleanupDevelopmentCollectionsAsync()
    {
        var env = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
        if (string.Equals(env, "Development", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogInformation("Development environment detected. Dropping obsolete collections...");
            var obsoleteCollections = new[] { "authors", "categories", "publishers", "chapters", "book_authors", "book_categories" };
            foreach (var col in obsoleteCollections)
            {
                await _context.Database.DropCollectionAsync(col);
                _logger.LogInformation("Dropped collection: {CollectionName}", col);
            }

            // Self-healing: if 'books' contains old schema documents (e.g. has 'publisherId'), drop it and 'book_copies' to force a clean seed
            var booksCollection = _context.Database.GetCollection<BsonDocument>("books");
            var hasOldSchema = await booksCollection.Find(Builders<BsonDocument>.Filter.Exists("publisherId")).AnyAsync();
            if (hasOldSchema)
            {
                _logger.LogWarning("Old catalog schema detected in 'books' collection. Dropping 'books' and 'book_copies' to trigger a clean embedded seed...");
                await _context.Database.DropCollectionAsync("books");
                await _context.Database.DropCollectionAsync("book_copies");
            }
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

    #region Catalog Seed Methods (M03) & DigitalContent Seed Methods (M04)

    private async Task<List<Book>> SeedBooksAsync()
    {
        var count = await _context.Books.CountDocumentsAsync(Builders<Book>.Filter.Empty);
        if (count > 0)
        {
            return await _context.Books.Find(Builders<Book>.Filter.Empty).ToListAsync();
        }

        _logger.LogInformation("Seeding 50+ books with embedded metadata and chapters...");
        
        var authors = new List<BookAuthorSnapshot>
        {
            new() { AuthorId = ObjectId.GenerateNewId().ToString(), Name = "Nguyễn Nhật Ánh", Slug = "nguyen-nhat-anh" },
            new() { AuthorId = ObjectId.GenerateNewId().ToString(), Name = "Tô Hoài", Slug = "to-hoai" },
            new() { AuthorId = ObjectId.GenerateNewId().ToString(), Name = "Nam Cao", Slug = "nam-cao" },
            new() { AuthorId = ObjectId.GenerateNewId().ToString(), Name = "Vũ Trọng Phụng", Slug = "vu-trong-phung" },
            new() { AuthorId = ObjectId.GenerateNewId().ToString(), Name = "Nguyễn Du", Slug = "nguyen-du" },
            new() { AuthorId = ObjectId.GenerateNewId().ToString(), Name = "Hồ Chí Minh", Slug = "ho-chi-minh" },
            new() { AuthorId = ObjectId.GenerateNewId().ToString(), Name = "Xuân Quỳnh", Slug = "xuan-quynh" },
            new() { AuthorId = ObjectId.GenerateNewId().ToString(), Name = "Nguyễn Minh Châu", Slug = "nguyen-minh-chau" },
            new() { AuthorId = ObjectId.GenerateNewId().ToString(), Name = "Nguyễn Huy Thiệp", Slug = "nguyen-huy-thiep" },
            new() { AuthorId = ObjectId.GenerateNewId().ToString(), Name = "Đỗ Chu", Slug = "do-chu" }
        };

        var publishers = new List<BookPublisherSnapshot>
        {
            new() { PublisherId = ObjectId.GenerateNewId().ToString(), Name = "NXB Trẻ", Slug = "nxb-tre" },
            new() { PublisherId = ObjectId.GenerateNewId().ToString(), Name = "NXB Kim Đồng", Slug = "nxb-kim-dong" },
            new() { PublisherId = ObjectId.GenerateNewId().ToString(), Name = "NXB Văn Học", Slug = "nxb-van-hoc" },
            new() { PublisherId = ObjectId.GenerateNewId().ToString(), Name = "NXB Hội Nhà Văn", Slug = "nxb-hoi-nha-van" },
            new() { PublisherId = ObjectId.GenerateNewId().ToString(), Name = "NXB Đại Học Quốc Gia", Slug = "nxb-dai-hoc-quoc-gia" }
        };

        var categories = new List<BookCategorySnapshot>
        {
            new() { CategoryId = ObjectId.GenerateNewId().ToString(), Name = "Văn học", Slug = "van-hoc" },
            new() { CategoryId = ObjectId.GenerateNewId().ToString(), Name = "Khoa học", Slug = "khoa-hoc" },
            new() { CategoryId = ObjectId.GenerateNewId().ToString(), Name = "Kỹ năng sống", Slug = "ky-nang-song" },
            new() { CategoryId = ObjectId.GenerateNewId().ToString(), Name = "Lịch sử", Slug = "lich-su" },
            new() { CategoryId = ObjectId.GenerateNewId().ToString(), Name = "Thiếu nhi", Slug = "thieu-nhi" },
            new() { CategoryId = ObjectId.GenerateNewId().ToString(), Name = "Tiểu thuyết", Slug = "tieu-thuyet" },
            new() { CategoryId = ObjectId.GenerateNewId().ToString(), Name = "Truyện ngắn", Slug = "truyen-ngan" },
            new() { CategoryId = ObjectId.GenerateNewId().ToString(), Name = "Thơ", Slug = "tho" }
        };

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
        
        int totalEmbeddedChapters = 0;

        foreach (var (title, slug, isbn, summary, year) in bookData)
        {
            var bookChapters = new List<BookChapter>();
            var chapterCount = random.Next(5, 15);
            for (int i = 1; i <= chapterCount; i++)
            {
                var isPublished = random.Next(0, 5) < 4;
                var chapter = new BookChapter
                {
                    ChapterId = ObjectId.GenerateNewId().ToString(),
                    Number = i,
                    Title = $"Chương {i}: {GenerateChapterTitle(random)}",
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
                    PublishedAt = isPublished ? DateTime.UtcNow.AddDays(-random.Next(1, 365)) : null,
                    CreatedBy = "system",
                    CreatedAt = DateTime.UtcNow.AddDays(-random.Next(1, 365)),
                    UpdatedAt = DateTime.UtcNow
                };
                bookChapters.Add(chapter);
            }
            
            totalEmbeddedChapters += bookChapters.Count;

            var isPaid = random.Next(0, 2) == 0;
            var book = new Book
            {
                Title = title,
                Slug = slug,
                ISBN = isbn,
                Summary = summary,
                PublicationYear = year,
                Language = "vi",
                CoverAssetId = coverUrls[random.Next(coverUrls.Length)],
                AccessType = isPaid ? "PAID" : "FREE",
                Price = isPaid ? 10000 : 0,
                Status = "PUBLISHED",
                TotalChapters = bookChapters.Count,
                Publisher = publishers[random.Next(publishers.Count)],
                Authors = new List<BookAuthorSnapshot> { authors[random.Next(authors.Count)] },
                Categories = new List<BookCategorySnapshot> { categories[random.Next(categories.Count)] },
                Chapters = bookChapters,
                CreatedBy = "system",
                CreatedAt = DateTime.UtcNow.AddDays(-random.Next(1, 365)),
                UpdatedAt = DateTime.UtcNow,
                Stats = new BookStats
                {
                    ViewCount = random.Next(100, 5000),
                    ReadingCount = random.Next(50, 2000),
                    Rating = 0.0,
                    RatingCount = 0
                }
            };
            books.Add(book);
        }

        if (books.Any())
        {
            await _context.Books.InsertManyAsync(books);
            _logger.LogInformation($"Seeded {books.Count} books with {totalEmbeddedChapters} embedded chapters");
        }

        return books;
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
            "Tiếng cười vang vọng trong không gian, xua tan mọi mệt muốn.",
            "Bầu trời đêm đầy sao, lung linh như những viên kim cương.",
            "Gió thổi vi vu, mang theo hương vị của biển cả bao la."
        };
        return texts[random.Next(texts.Length)];
    }

    private async Task SeedReviewsAsync(List<Book> books)
    {
        var count = await _context.Reviews.CountDocumentsAsync(Builders<Review>.Filter.Empty);
        if (count > 0) return;

        _logger.LogInformation("Seeding sample book reviews...");
        var users = await _context.Users.Find(Builders<User>.Filter.Empty).ToListAsync();
        if (!users.Any() || !books.Any()) return;

        var sampleComments = new[]
        {
            "Sách rất hay và súc tích, các chương ngắn gọn dễ tiếp thu!",
            "Tác phẩm tuyệt vời, xứng đáng nằm trong tủ sách cá nhân.",
            "Nội dung lôi cuốn từ chương đầu tiên, rất đáng đọc.",
            "Giá trị giáo dục cao, phù hợp cho mọi lứa tuổi độc giả.",
            "Giọng văn mượt mà, sâu sắc và để lại nhiều suy ngẫm."
        };

        var reviews = new List<Review>();
        var random = new Random();

        foreach (var book in books.Take(15))
        {
            var reviewerCount = random.Next(2, 5);
            var selectedUsers = users.OrderBy(_ => random.Next()).Take(reviewerCount).ToList();

            foreach (var u in selectedUsers)
            {
                var rating = random.Next(4, 6);
                reviews.Add(new Review
                {
                    BookId = book.Id,
                    UserId = u.Id,
                    UserFullName = !string.IsNullOrWhiteSpace(u.FullName) ? u.FullName : "Độc giả",
                    UserEmail = u.Email,
                    UserAvatarUrl = u.Avatar,
                    Rating = rating,
                    Comment = sampleComments[random.Next(sampleComments.Length)],
                    Status = "APPROVED",
                    IsEdited = false,
                    CreatedAt = DateTime.UtcNow.AddDays(-random.Next(1, 60)),
                    UpdatedAt = DateTime.UtcNow.AddDays(-random.Next(1, 60))
                });
            }
        }

        if (reviews.Any())
        {
            await _context.Reviews.InsertManyAsync(reviews);

            var bookIds = reviews.Select(r => r.BookId).Distinct().ToList();
            foreach (var bId in bookIds)
            {
                var bReviews = reviews.Where(r => r.BookId == bId).ToList();
                var avgRating = Math.Round(bReviews.Average(r => r.Rating), 1);
                var update = Builders<Book>.Update
                    .Set(b => b.Stats.Rating, avgRating)
                    .Set(b => b.Stats.RatingCount, bReviews.Count);
                await _context.Books.UpdateOneAsync(b => b.Id == bId, update);
            }
        }
    }

    private async Task SyncAllBookRatingStatsAsync()
    {
        _logger.LogInformation("Syncing rating stats for all books with actual reviews in DB...");
        var allBooks = await _context.Books.Find(Builders<Book>.Filter.Empty).ToListAsync();
        var allApprovedReviews = await _context.Reviews.Find(r => r.Status == "APPROVED").ToListAsync();

        var reviewsByBook = allApprovedReviews.GroupBy(r => r.BookId).ToDictionary(g => g.Key, g => g.ToList());

        foreach (var book in allBooks)
        {
            if (reviewsByBook.TryGetValue(book.Id, out var bReviews) && bReviews.Any())
            {
                var avgRating = Math.Round(bReviews.Average(r => r.Rating), 1);
                var count = bReviews.Count;
                if (book.Stats.Rating != avgRating || book.Stats.RatingCount != count)
                {
                    var update = Builders<Book>.Update
                        .Set(b => b.Stats.Rating, avgRating)
                        .Set(b => b.Stats.RatingCount, count);
                    await _context.Books.UpdateOneAsync(b => b.Id == book.Id, update);
                }
            }
            else
            {
                if (book.Stats.Rating != 0.0 || book.Stats.RatingCount != 0)
                {
                    var update = Builders<Book>.Update
                        .Set(b => b.Stats.Rating, 0.0)
                        .Set(b => b.Stats.RatingCount, 0);
                }
            }
        }
    }

    private async Task SeedPromotionsAsync()
    {
        var voucherCount = await _context.Vouchers.CountDocumentsAsync(FilterDefinition<Voucher>.Empty);
        if (voucherCount == 0)
        {
            _logger.LogInformation("Seeding default Vouchers...");
            await _context.Vouchers.InsertManyAsync(new[]
            {
                new Voucher { Code = "LH50OFF", DiscountType = "PERCENT", DiscountValue = 50, MinOrderValue = 10000, MaxUsage = 500, UsedCount = 124, ExpiresAt = DateTime.UtcNow.AddMonths(6), Status = "ACTIVE" },
                new Voucher { Code = "HE5K", DiscountType = "FIXED", DiscountValue = 5000, MinOrderValue = 10000, MaxUsage = 1000, UsedCount = 450, ExpiresAt = DateTime.UtcNow.AddMonths(3), Status = "ACTIVE" },
                new Voucher { Code = "SINHVIEN2026", DiscountType = "PERCENT", DiscountValue = 20, MinOrderValue = 10000, MaxUsage = 200, UsedCount = 200, ExpiresAt = DateTime.UtcNow.AddDays(-10), Status = "EXPIRED" }
            });
        }

        var bannerCount = await _context.Banners.CountDocumentsAsync(FilterDefinition<Banner>.Empty);
        if (bannerCount == 0)
        {
            _logger.LogInformation("Seeding default Banners...");
            await _context.Banners.InsertManyAsync(new[]
            {
                new Banner { Title = "Chào Hè 2026 - Mở Kho Sách Số 10.000đ", Subtitle = "Khám phá hàng nghìn tác phẩm E-Book bản quyền đọc mượt mà trên mọi thiết bị", ImageUrl = "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1200", LinkUrl = "/books", IsActive = true, SortOrder = 1 },
                new Banner { Title = "Flash Sale Đọc Sách Số Chỉ 5.000 VNĐ", Subtitle = "Thanh toán siêu tốc VietQR SePay tự động mở khóa ngay tức thì", ImageUrl = "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=1200", LinkUrl = "/books", IsActive = true, SortOrder = 2 }
            });
        }

        var flashSaleCount = await _context.FlashSales.CountDocumentsAsync(FilterDefinition<FlashSale>.Empty);
        if (flashSaleCount == 0)
        {
            _logger.LogInformation("Seeding default FlashSale...");
            await _context.FlashSales.InsertOneAsync(new FlashSale
            {
                Name = "Giờ Vàng Giá Sách 5.000 VNĐ - Hè 2026",
                OriginalPrice = 10000,
                SalePrice = 5000,
                StartTime = DateTime.UtcNow,
                EndTime = DateTime.UtcNow.AddDays(7),
                Status = "RUNNING"
            });
        }
    }

    private async Task SeedBorrowingsAndPaymentOrdersAsync(List<Book> books, List<User> users, LibraryBranch branch)
    {
        var paymentCount = await _context.PaymentOrders.CountDocumentsAsync(FilterDefinition<PaymentOrder>.Empty);
        if (paymentCount == 0 && books.Any() && users.Any())
        {
            _logger.LogInformation("Seeding sample SePay Payment Orders and Revenue...");
            var payments = new List<PaymentOrder>();
            var paidBooks = books.Where(b => b.AccessType == "PAID").ToList();
            if (!paidBooks.Any()) paidBooks = books;

            for (int i = 1; i <= 15; i++)
            {
                var book = paidBooks[i % paidBooks.Count];
                var user = users[i % users.Count];
                var code = (102930 + i).ToString();
                var dt = DateTime.UtcNow.AddHours(-i * 3);

                payments.Add(new PaymentOrder
                {
                    OrderCode = code,
                    UserId = user.Id,
                    BookId = book.Id,
                    BookTitle = book.Title,
                    Amount = 10000,
                    Status = "SUCCESS",
                    QrCodeUrl = $"https://qr.sepay.vn/img?bank=VietinBank&acc=105886719416&template=compact&amount=10000&des=LH{code}",
                    PaymentContent = $"LH{code}",
                    SePayTransactionId = $"SEPAY_TRX_{code}",
                    CreatedAt = dt,
                    PaidAt = dt.AddMinutes(2)
                });
            }

            await _context.PaymentOrders.InsertManyAsync(payments);
        }

        var borrowingCount = await _context.Borrowings.CountDocumentsAsync(FilterDefinition<Borrowing>.Empty);
        if (borrowingCount < 20 && users.Any() && books.Any())
        {
            _logger.LogInformation("Seeding rich sample Physical Borrowings and Items across past 14 days...");
            
            // Clear sparse old seed data if under 20 records
            await _context.Borrowings.DeleteManyAsync(FilterDefinition<Borrowing>.Empty);
            await _context.BorrowingItems.DeleteManyAsync(FilterDefinition<BorrowingItem>.Empty);

            var borrowings = new List<Borrowing>();
            var borrowingItems = new List<BorrowingItem>();
            var adminUser = users.FirstOrDefault(u => u.Email == "admin@libraryhub.com") ?? users.First();

            var today = DateTime.UtcNow;
            int counter = 1;

            // Seed borrowings for each day in past 14 days
            for (int dayOffset = 14; dayOffset >= 0; dayOffset--)
            {
                var borrowDate = today.AddDays(-dayOffset);
                int itemsCountForDay = (dayOffset % 3) + 1; // 1 to 3 borrowings per day

                for (int j = 0; j < itemsCountForDay; j++)
                {
                    var user = users[(counter + j) % users.Count];
                    var isReturned = (counter % 2 == 0);
                    var isOverdue = (!isReturned && dayOffset > 7);
                    var status = isReturned ? "RETURNED" : (isOverdue ? "OVERDUE" : "OPEN");

                    var borrowingId = ObjectId.GenerateNewId().ToString();
                    var expectedReturn = borrowDate.AddDays(14);
                    var closedAt = isReturned ? borrowDate.AddDays((j % 5) + 1) : (DateTime?)null;

                    var borrowing = new Borrowing
                    {
                        Id = borrowingId,
                        Code = $"LOAN-2026-{counter:D4}",
                        UserId = user.Id,
                        BranchId = branch.Id,
                        Status = status,
                        BorrowedAt = borrowDate,
                        ExpectedReturnAt = expectedReturn,
                        ClosedAt = closedAt,
                        CreatedBy = adminUser.Id,
                        Note = "Mượn sách giấy tại quầy thư viện"
                    };
                    borrowings.Add(borrowing);

                    // Add BorrowingItem
                    borrowingItems.Add(new BorrowingItem
                    {
                        Id = ObjectId.GenerateNewId().ToString(),
                        BorrowingId = borrowingId,
                        CopyId = ObjectId.GenerateNewId().ToString(),
                        DueAt = expectedReturn,
                        ReturnedAt = closedAt,
                        Status = isReturned ? "RETURNED" : (isOverdue ? "OVERDUE" : "BORROWED")
                    });

                    counter++;
                }
            }

            await _context.Borrowings.InsertManyAsync(borrowings);
            await _context.BorrowingItems.InsertManyAsync(borrowingItems);
        }
    }

    #endregion
}
