using api.Database.Entities;
using MongoDB.Driver;

namespace api.Database.Seed
{
    public class SeedData
    {
        private readonly IMongoDatabase _database;
        private readonly ILogger<SeedData> _logger;

        public SeedData(IMongoDatabase database, ILogger<SeedData> logger)
        {
            _database = database;
            _logger = logger;
        }

        public async Task SeedAllAsync()
        {
            _logger.LogInformation("Starting database seeding process...");

            await SeedAuthorsAsync();
            await SeedPublishersAsync();
            await SeedCategoriesAsync();
            await SeedBooksAsync();
            await SeedChaptersAsync();
            await SeedBookCopiesAsync();
            await SeedLibraryBranchesAsync();

            _logger.LogInformation("Database seeding process completed successfully.");
        }

        private async Task SeedAuthorsAsync()
        {
            var collection = _database.GetCollection<Author>("authors");
            if (await collection.Find(_ => true).AnyAsync()) return;

            var authors = new List<Author>
            {
                new() { Name = "Nguyễn Nhật Ánh", Slug = "nguyen-nhat-anh", Biography = "Nhà văn nổi tiếng với những tác phẩm về tuổi thơ và tuổi mới lớn" },
                new() { Name = "Tô Hoài", Slug = "to-hoai", Biography = "Tác giả của 'Dế Mèn phiêu lưu ký' - tác phẩm kinh điển của văn học thiếu nhi Việt Nam" },
                new() { Name = "Nam Cao", Slug = "nam-cao", Biography = "Nhà văn hiện thực phê phán xuất sắc với 'Chí Phèo', 'Lão Hạc'" },
                new() { Name = "Vũ Trọng Phụng", Slug = "vu-trong-phung", Biography = "Nhà văn trào phúng với 'Số đỏ', 'Giông tố'" },
                new() { Name = "Nguyễn Du", Slug = "nguyen-du", Biography = "Đại thi hào dân tộc, tác giả 'Truyện Kiều'" },
                new() { Name = "Hồ Chí Minh", Slug = "ho-chi-minh", Biography = "Lãnh tụ vĩ đại, nhà thơ lớn với 'Nhật ký trong tù'" },
                new() { Name = "Xuân Quỳnh", Slug = "xuan-quynh", Biography = "Nhà thơ nữ với nhiều tác phẩm về tình yêu và gia đình" },
                new() { Name = "Nguyễn Minh Châu", Slug = "nguyen-minh-chau", Biography = "Nhà văn hiện đại với 'Mảnh trăng cuối rừng', 'Chiếc thuyền ngoài xa'" },
                new() { Name = "Nguyễn Huy Thiệp", Slug = "nguyen-huy-thiep", Biography = "Nhà văn đương đại nổi tiếng với truyện ngắn 'Tướng về hưu'" },
                new() { Name = "Đỗ Chu", Slug = "do-chu", Biography = "Nhà văn với 'Hương rừng Cà Mau', 'Mảnh đất tình yêu'" }
            };

            await collection.InsertManyAsync(authors);
            _logger.LogInformation($"Seeded {authors.Count} authors");
        }

        private async Task SeedPublishersAsync()
        {
            var collection = _database.GetCollection<Publisher>("publishers");
            if (await collection.Find(_ => true).AnyAsync()) return;

            var publishers = new List<Publisher>
            {
                new() { Name = "NXB Trẻ", Slug = "nxb-tre", Address = "TP. Hồ Chí Minh", Contact = "028 1234 5678" },
                new() { Name = "NXB Kim Đồng", Slug = "nxb-kim-dong", Address = "Hà Nội", Contact = "024 1234 5678" },
                new() { Name = "NXB Văn Học", Slug = "nxb-van-hoc", Address = "Hà Nội", Contact = "024 8765 4321" },
                new() { Name = "NXB Hội Nhà Văn", Slug = "nxb-hoi-nha-van", Address = "Hà Nội", Contact = "024 1234 8765" },
                new() { Name = "NXB Đại Học Quốc Gia", Slug = "nxb-dai-hoc-quoc-gia", Address = "Hà Nội", Contact = "024 5678 1234" }
            };

            await collection.InsertManyAsync(publishers);
            _logger.LogInformation($"Seeded {publishers.Count} publishers");
        }

        private async Task SeedCategoriesAsync()
        {
            var collection = _database.GetCollection<Category>("categories");
            if (await collection.Find(_ => true).AnyAsync()) return;

            var categories = new List<Category>
            {
                // Cấp 1
                new() { Name = "Văn học", Slug = "van-hoc", Status = "ACTIVE" },
                new() { Name = "Khoa học", Slug = "khoa-hoc", Status = "ACTIVE" },
                new() { Name = "Kỹ năng sống", Slug = "ky-nang-song", Status = "ACTIVE" },
                new() { Name = "Lịch sử", Slug = "lich-su", Status = "ACTIVE" },
                new() { Name = "Thiếu nhi", Slug = "thieu-nhi", Status = "ACTIVE" },

                // Cấp 2 - Văn học
                new() { Name = "Tiểu thuyết", Slug = "tieu-thuyet", ParentId = "van-hoc", Path = "/van-hoc/tieu-thuyet", Status = "ACTIVE" },
                new() { Name = "Truyện ngắn", Slug = "truyen-ngan", ParentId = "van-hoc", Path = "/van-hoc/truyen-ngan", Status = "ACTIVE" },
                new() { Name = "Thơ", Slug = "tho", ParentId = "van-hoc", Path = "/van-hoc/tho", Status = "ACTIVE" },

                // Cấp 2 - Khoa học
                new() { Name = "Khoa học tự nhiên", Slug = "khoa-hoc-tu-nhien", ParentId = "khoa-hoc", Path = "/khoa-hoc/khoa-hoc-tu-nhien", Status = "ACTIVE" },
                new() { Name = "Khoa học xã hội", Slug = "khoa-hoc-xa-hoi", ParentId = "khoa-hoc", Path = "/khoa-hoc/khoa-hoc-xa-hoi", Status = "ACTIVE" }
            };

            await collection.InsertManyAsync(categories);
            _logger.LogInformation($"Seeded {categories.Count} categories");
        }

        private async Task SeedBooksAsync()
        {
            var collection = _database.GetCollection<Book>("books");
            if (await collection.Find(_ => true).AnyAsync()) return;

            var books = new List<Book>();
            var authorIds = await GetAuthorIdsAsync();
            var publisherIds = await GetPublisherIdsAsync();
            var categoryIds = await GetCategoryIdsAsync();

            var bookTitles = new[]
            {
                ("Dế Mèn phiêu lưu ký", "de-men-phieu-luu-ky", "9786041000001", "Cuộc phiêu lưu của chú dế mèn đầy thú vị", 1941),
                ("Chí Phèo", "chi-pheo", "9786041000002", "Tác phẩm kinh điển về số phận người nông dân", 1941),
                ("Số đỏ", "so-do", "9786041000003", "Tác phẩm trào phúng xuất sắc", 1936),
                ("Truyện Kiều", "truyen-kieu", "9786041000004", "Kiệt tác của Nguyễn Du", 1820),
                ("Nhật ký trong tù", "nhat-ky-trong-tu", "9786041000005", "Tập thơ của Bác Hồ", 1943),
                ("Thơ Xuân Quỳnh", "tho-xuan-quynh", "9786041000006", "Tuyển tập thơ Xuân Quỳnh", 1970),
                ("Mảnh trăng cuối rừng", "manh-trang-cuoi-rung", "9786041000007", "Truyện ngắn của Nguyễn Minh Châu", 1978),
                ("Tướng về hưu", "tuong-ve-huu", "9786041000008", "Truyện ngắn của Nguyễn Huy Thiệp", 1987),
                ("Hương rừng Cà Mau", "huong-rung-ca-mau", "9786041000009", "Truyện ngắn của Đỗ Chu", 1990),
                ("Chuyện con mèo dạy hải âu bay", "chuyen-con-meo-day-hai-au-bay", "9786041000010", "Truyện thiếu nhi nổi tiếng", 1996),
                ("Tôi thấy hoa vàng trên cỏ xanh", "toi-thay-hoa-vang-tren-co-xanh", "9786041000011", "Truyện dài của Nguyễn Nhật Ánh", 2010),
                ("Cho tôi xin một vé đi tuổi thơ", "cho-toi-xin-mot-ve-di-tuoi-tho", "9786041000012", "Truyện dài của Nguyễn Nhật Ánh", 2008),
                ("Mắt biếc", "mat-biec", "9786041000013", "Truyện dài của Nguyễn Nhật Ánh", 1990),
                ("Có hai con mèo ngồi bên cửa sổ", "co-hai-con-meo-ngoi-ben-cua-so", "9786041000014", "Truyện dài của Nguyễn Nhật Ánh", 2015),
                ("Lão Hạc", "lao-hac", "9786041000015", "Truyện ngắn của Nam Cao", 1943),
                ("Đời thừa", "doi-thua", "9786041000016", "Truyện ngắn của Nam Cao", 1943),
                ("Giông tố", "giong-to", "9786041000017", "Tác phẩm của Vũ Trọng Phụng", 1936),
                ("Kỹ nghệ lấy tây", "ky-nghe-lay-tay", "9786041000018", "Tác phẩm của Vũ Trọng Phụng", 1937),
                ("Truyện ngắn Tô Hoài", "truyen-ngan-to-hoai", "9786041000019", "Tuyển tập truyện ngắn Tô Hoài", 1940),
                ("Nhà trọ", "nha-tro", "9786041000020", "Truyện ngắn của Tô Hoài", 1942),
                // Thêm 30 sách nữa để đạt 50 sách
            };

            var random = new Random();
            foreach (var (title, slug, isbn, summary, year) in bookTitles)
            {
                var book = new Book
                {
                    Title = title,
                    Slug = slug,
                    ISBN = isbn,
                    Summary = summary,
                    PublicationYear = year,
                    Language = "vi",
                    AccessType = random.Next(0, 2) == 0 ? "FREE" : "PREMIUM",
                    Status = "PUBLISHED",
                    TotalChapters = 0,
                    PublisherId = publisherIds[random.Next(publisherIds.Count)],
                    CreatedBy = "admin",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    Stats = new BookStats
                    {
                        ViewCount = random.Next(100, 10000),
                        ReadingCount = random.Next(50, 5000),
                        Rating = Math.Round(random.NextDouble() * 2 + 3, 1), // 3.0 - 5.0
                        RatingCount = random.Next(10, 200)
                    }
                };
                books.Add(book);
            }

            await collection.InsertManyAsync(books);
            _logger.LogInformation($"Seeded {books.Count} books");
        }

        private async Task SeedChaptersAsync()
        {
            var collection = _database.GetCollection<Chapter>("chapters");
            if (await collection.Find(_ => true).AnyAsync()) return;

            var books = await _database.GetCollection<Book>("books").Find(_ => true).ToListAsync();
            var chapters = new List<Chapter>();

            var random = new Random();
            foreach (var book in books)
            {
                var chapterCount = random.Next(5, 15); // Mỗi sách 5-15 chương
                for (int i = 1; i <= chapterCount; i++)
                {
                    var isPublished = random.Next(0, 5) < 4; // 80% published
                    var chapter = new Chapter
                    {
                        BookId = book.Id,
                        Number = i,
                        Title = $"Chương {i}: {GenerateChapterTitle(i, random)}",
                        ContentJson = GenerateChapterContent(i, random),
                        WordCount = random.Next(500, 3000),
                        Status = isPublished ? "PUBLISHED" : "DRAFT",
                        Version = 1,
                        PublishedAt = isPublished ? DateTime.UtcNow.AddDays(-random.Next(1, 365)) : null,
                        CreatedBy = "admin",
                        UpdatedBy = "admin",
                        CreatedAt = DateTime.UtcNow.AddDays(-random.Next(1, 365)),
                        UpdatedAt = DateTime.UtcNow
                    };
                    chapters.Add(chapter);
                }
            }

            await collection.InsertManyAsync(chapters);
            _logger.LogInformation($"Seeded {chapters.Count} chapters");

            // Update total chapters for each book
            var bookCollection = _database.GetCollection<Book>("books");
            foreach (var book in books)
            {
                var count = chapters.Count(c => c.BookId == book.Id && c.Status == "PUBLISHED");
                var update = Builders<Book>.Update.Set(b => b.TotalChapters, count);
                await bookCollection.UpdateOneAsync(b => b.Id == book.Id, update);
            }
        }

        private async Task SeedBookCopiesAsync()
        {
            var collection = _database.GetCollection<BookCopy>("book_copies");
            if (await collection.Find(_ => true).AnyAsync()) return;

            var books = await _database.GetCollection<Book>("books").Find(_ => true).ToListAsync();
            var branches = await GetBranchIdsAsync();
            var copies = new List<BookCopy>();

            var random = new Random();
            foreach (var book in books)
            {
                var copyCount = random.Next(2, 6); // Mỗi sách 2-6 bản sao
                for (int i = 1; i <= copyCount; i++)
                {
                    var statuses = new[] { "AVAILABLE", "BORROWED", "RESERVED", "MAINTENANCE" };
                    var status = statuses[random.Next(0, statuses.Length)];
                    var conditions = new[] { "NEW", "GOOD", "DAMAGED" };
                    var condition = conditions[random.Next(0, conditions.Length)];

                    var copy = new BookCopy
                    {
                        BookId = book.Id,
                        BranchId = branches[random.Next(branches.Count)],
                        Barcode = $"{book.Id.Substring(0, 8)}{i:D3}{random.Next(100, 999)}",
                        ShelfCode = $"A{random.Next(1, 10)}-{random.Next(1, 20):D2}",
                        Condition = condition,
                        Status = status,
                        Price = random.Next(50000, 300000),
                        AcquiredAt = DateTime.UtcNow.AddDays(-random.Next(1, 730)),
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    copies.Add(copy);
                }
            }

            await collection.InsertManyAsync(copies);
            _logger.LogInformation($"Seeded {copies.Count} book copies");
        }

        private async Task SeedLibraryBranchesAsync()
        {
            var collection = _database.GetCollection<LibraryBranch>("library_branches");
            if (await collection.Find(_ => true).AnyAsync()) return;

            var branches = new List<LibraryBranch>
            {
                new() { Code = "BR001", Name = "Thư viện Trung tâm", Address = "Số 1, Đường ABC, Quận 1, TP.HCM", Contact = "028 1234 5678", Status = "ACTIVE" },
                new() { Code = "BR002", Name = "Thư viện Đại học Quốc gia", Address = "Số 2, Đường DEF, Quận 2, TP.HCM", Contact = "028 8765 4321", Status = "ACTIVE" },
                new() { Code = "BR003", Name = "Thư viện Khoa học Tổng hợp", Address = "Số 3, Đường GHI, Quận 3, TP.HCM", Contact = "028 1234 8765", Status = "ACTIVE" },
                new() { Code = "BR004", Name = "Thư viện Thiếu nhi", Address = "Số 4, Đường JKL, Quận 4, TP.HCM", Contact = "028 5678 1234", Status = "ACTIVE" }
            };

            await collection.InsertManyAsync(branches);
            _logger.LogInformation($"Seeded {branches.Count} library branches");
        }

        #region Helper Methods

        private async Task<List<string>> GetAuthorIdsAsync()
        {
            var collection = _database.GetCollection<Author>("authors");
            return await collection.Find(_ => true).Project(a => a.Id).ToListAsync();
        }

        private async Task<List<string>> GetPublisherIdsAsync()
        {
            var collection = _database.GetCollection<Publisher>("publishers");
            return await collection.Find(_ => true).Project(p => p.Id).ToListAsync();
        }

        private async Task<List<string>> GetCategoryIdsAsync()
        {
            var collection = _database.GetCollection<Category>("categories");
            return await collection.Find(_ => true).Project(c => c.Id).ToListAsync();
        }

        private async Task<List<string>> GetBranchIdsAsync()
        {
            var collection = _database.GetCollection<LibraryBranch>("library_branches");
            return await collection.Find(_ => true).Project(b => b.Id).ToListAsync();
        }

        private string GenerateChapterTitle(int number, Random random)
        {
            var titles = new[]
            {
                "Mở đầu câu chuyện",
                "Những điều chưa kể",
                "Cuộc gặp gỡ định mệnh",
                "Bước ngoặt cuộc đời",
                "Tình bạn và tình yêu",
                "Những ngày tháng khó quên",
                "Bí mật được hé lộ",
                "Hành trình mới",
                "Bài học cuộc sống",
                "Kết thúc và khởi đầu mới",
                "Trong bóng tối",
                "Ánh sáng le lói",
                "Nỗi đau và hy vọng",
                "Sự hy sinh cao cả",
                "Tình yêu thương vô bờ",
                "Những giấc mơ",
                "Thực tại phũ phàng",
                "Bước qua nỗi sợ",
                "Hạnh phúc giản đơn",
                "Vượt qua giới hạn"
            };
            return titles[random.Next(titles.Length)];
        }

        private string GenerateChapterContent(int number, Random random)
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
                "Gió thổi vi vu, mang theo hương vị của biển cả bao la.",
                "Những ký ức tuổi thơ ùa về, đẹp đẽ và trong trẻo.",
                "Tình yêu như một dòng sông, chảy mãi không ngừng.",
                "Cuộc sống luôn ẩn chứa những điều bất ngờ thú vị.",
                "Hạnh phúc đôi khi đến từ những điều giản dị nhất.",
                "Thời gian trôi qua, để lại trong ta những bài học quý giá."
            };

            var content = new
            {
                type = "doc",
                content = new List<object>()
            };

            var nodes = new List<object>();
            var paragraphCount = random.Next(3, 8);
            for (int i = 0; i < paragraphCount; i++)
            {
                var selectedParagraphs = paragraphs
                    .OrderBy(_ => random.Next())
                    .Take(random.Next(2, 5));
                var text = string.Join(" ", selectedParagraphs);

                nodes.Add(new
                {
                    type = "paragraph",
                    content = new[]
                    {
                        new { type = "text", text = text }
                    }
                });
            }

            // Thêm 1-2 đoạn văn có format đặc biệt
            if (random.Next(0, 2) == 0)
            {
                nodes.Insert(random.Next(1, nodes.Count - 1), new
                {
                    type = "heading",
                    attrs = new { level = random.Next(2, 4) },
                    content = new[]
                    {
                        new { type = "text", text = $"Phần {random.Next(1, 10)}: {GenerateChapterTitle(number, random)}" }
                    }
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
}