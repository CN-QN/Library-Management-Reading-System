using api.Database.Entities;
using MongoDB.Driver;

namespace api.Database.Indexes;

public class IndexCreator
{
    private readonly MongoDbContext _context;
    private readonly ILogger<IndexCreator> _logger;

    public IndexCreator(MongoDbContext context, ILogger<IndexCreator> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task CreateIndexesAsync()
    {
        try
        {
            _logger.LogInformation("Starting database index creation...");

            // 1. Users
            var emailKey = Builders<User>.IndexKeys.Ascending(u => u.Email);
            await _context.Users.Indexes.CreateOneAsync(new CreateIndexModel<User>(emailKey, new CreateIndexOptions { Unique = true }));

            var studentCodeKey = Builders<User>.IndexKeys.Ascending(u => u.StudentCode);
            await _context.Users.Indexes.CreateOneAsync(new CreateIndexModel<User>(studentCodeKey, new CreateIndexOptions { Unique = true }));

            // 2. Roles
            var roleCodeKey = Builders<Role>.IndexKeys.Ascending(r => r.Code);
            await _context.Roles.Indexes.CreateOneAsync(new CreateIndexModel<Role>(roleCodeKey, new CreateIndexOptions { Unique = true }));

            // 3. Permissions
            var permCodeKey = Builders<Permission>.IndexKeys.Ascending(p => p.Code);
            await _context.Permissions.Indexes.CreateOneAsync(new CreateIndexModel<Permission>(permCodeKey, new CreateIndexOptions { Unique = true }));

            // 4. RolePermissions
            var rolePermKey = Builders<RolePermission>.IndexKeys.Ascending(rp => rp.RoleId).Ascending(rp => rp.PermissionId);
            await _context.RolePermissions.Indexes.CreateOneAsync(new CreateIndexModel<RolePermission>(rolePermKey, new CreateIndexOptions { Unique = true }));

            // 5. UserRoles
            var userRoleKey = Builders<UserRole>.IndexKeys.Ascending(ur => ur.UserId).Ascending(ur => ur.RoleId).Ascending(ur => ur.BranchId);
            await _context.UserRoles.Indexes.CreateOneAsync(new CreateIndexModel<UserRole>(userRoleKey, new CreateIndexOptions { Unique = true }));

            // 6. AuthSessions (TTL index on ExpiresAt, Index on UserId)
            var authSessionTtl = Builders<AuthSession>.IndexKeys.Ascending(asess => asess.ExpiresAt);
            await _context.AuthSessions.Indexes.CreateOneAsync(new CreateIndexModel<AuthSession>(authSessionTtl, new CreateIndexOptions { ExpireAfter = TimeSpan.Zero }));

            var authSessionUserId = Builders<AuthSession>.IndexKeys.Ascending(asess => asess.UserId);
            await _context.AuthSessions.Indexes.CreateOneAsync(new CreateIndexModel<AuthSession>(authSessionUserId));

            // 7. LibraryBranches
            var branchCodeKey = Builders<LibraryBranch>.IndexKeys.Ascending(b => b.Code);
            await _context.LibraryBranches.Indexes.CreateOneAsync(new CreateIndexModel<LibraryBranch>(branchCodeKey, new CreateIndexOptions { Unique = true }));

            // 10. Books
            var bookSlugKey = Builders<Book>.IndexKeys.Ascending(b => b.Slug);
            await _context.Books.Indexes.CreateOneAsync(new CreateIndexModel<Book>(bookSlugKey, new CreateIndexOptions { Unique = true }));

            var bookIsbnKey = Builders<Book>.IndexKeys.Ascending(b => b.ISBN);
            await _context.Books.Indexes.CreateOneAsync(new CreateIndexModel<Book>(bookIsbnKey));

            var bookTextKey = Builders<Book>.IndexKeys.Text(b => b.Title).Text(b => b.Summary);
            await _context.Books.Indexes.CreateOneAsync(new CreateIndexModel<Book>(bookTextKey));

            var bookStatusKey = Builders<Book>.IndexKeys.Ascending(b => b.Status);
            await _context.Books.Indexes.CreateOneAsync(new CreateIndexModel<Book>(bookStatusKey));

            var bookAccessTypeKey = Builders<Book>.IndexKeys.Ascending(b => b.AccessType);
            await _context.Books.Indexes.CreateOneAsync(new CreateIndexModel<Book>(bookAccessTypeKey));

            var bookCreatedAtKey = Builders<Book>.IndexKeys.Descending(b => b.CreatedAt);
            await _context.Books.Indexes.CreateOneAsync(new CreateIndexModel<Book>(bookCreatedAtKey));

            var bookAuthorIdKey = Builders<Book>.IndexKeys.Ascending("authors.authorId");
            await _context.Books.Indexes.CreateOneAsync(new CreateIndexModel<Book>(bookAuthorIdKey));

            var bookAuthorSlugKey = Builders<Book>.IndexKeys.Ascending("authors.slug");
            await _context.Books.Indexes.CreateOneAsync(new CreateIndexModel<Book>(bookAuthorSlugKey));

            var bookCategoryIdKey = Builders<Book>.IndexKeys.Ascending("categories.categoryId");
            await _context.Books.Indexes.CreateOneAsync(new CreateIndexModel<Book>(bookCategoryIdKey));

            var bookCategorySlugKey = Builders<Book>.IndexKeys.Ascending("categories.slug");
            await _context.Books.Indexes.CreateOneAsync(new CreateIndexModel<Book>(bookCategorySlugKey));

            var bookPublisherIdKey = Builders<Book>.IndexKeys.Ascending("publisher.publisherId");
            await _context.Books.Indexes.CreateOneAsync(new CreateIndexModel<Book>(bookPublisherIdKey));

            var bookPublisherSlugKey = Builders<Book>.IndexKeys.Ascending("publisher.slug");
            await _context.Books.Indexes.CreateOneAsync(new CreateIndexModel<Book>(bookPublisherSlugKey));

            // 14. DigitalAssets
            var digitalAssetKey = Builders<DigitalAsset>.IndexKeys.Ascending(da => da.BookId).Ascending(da => da.Type);
            await _context.DigitalAssets.Indexes.CreateOneAsync(new CreateIndexModel<DigitalAsset>(digitalAssetKey));

            // 15. BookCopies
            var copyBarcodeKey = Builders<BookCopy>.IndexKeys.Ascending(bc => bc.Barcode);
            await _context.BookCopies.Indexes.CreateOneAsync(new CreateIndexModel<BookCopy>(copyBarcodeKey, new CreateIndexOptions { Unique = true }));

            var copyStatusKey = Builders<BookCopy>.IndexKeys.Ascending(bc => bc.BookId).Ascending(bc => bc.BranchId).Ascending(bc => bc.Status);
            await _context.BookCopies.Indexes.CreateOneAsync(new CreateIndexModel<BookCopy>(copyStatusKey));

            // 16. Borrowings
            var borrowingCodeKey = Builders<Borrowing>.IndexKeys.Ascending(b => b.Code);
            await _context.Borrowings.Indexes.CreateOneAsync(new CreateIndexModel<Borrowing>(borrowingCodeKey, new CreateIndexOptions { Unique = true }));

            var borrowingUserStatusKey = Builders<Borrowing>.IndexKeys.Ascending(b => b.UserId).Ascending(b => b.Status);
            await _context.Borrowings.Indexes.CreateOneAsync(new CreateIndexModel<Borrowing>(borrowingUserStatusKey));

            var borrowingDueKey = Builders<Borrowing>.IndexKeys.Ascending(b => b.ExpectedReturnAt);
            await _context.Borrowings.Indexes.CreateOneAsync(new CreateIndexModel<Borrowing>(borrowingDueKey));

            // 17. BorrowingItems
            var itemUniqueKey = Builders<BorrowingItem>.IndexKeys.Ascending(bi => bi.BorrowingId).Ascending(bi => bi.CopyId);
            await _context.BorrowingItems.Indexes.CreateOneAsync(new CreateIndexModel<BorrowingItem>(itemUniqueKey, new CreateIndexOptions { Unique = true }));

            var itemCopyReturnedKey = Builders<BorrowingItem>.IndexKeys.Ascending(bi => bi.CopyId).Ascending(bi => bi.ReturnedAt);
            await _context.BorrowingItems.Indexes.CreateOneAsync(new CreateIndexModel<BorrowingItem>(itemCopyReturnedKey));

            // 18. ReadingProgress
            var progressUniqueKey = Builders<ReadingProgress>.IndexKeys.Ascending(rp => rp.UserId).Ascending(rp => rp.BookId);
            await _context.ReadingProgresses.Indexes.CreateOneAsync(new CreateIndexModel<ReadingProgress>(progressUniqueKey, new CreateIndexOptions { Unique = true }));

            var progressLastReadKey = Builders<ReadingProgress>.IndexKeys.Descending(rp => rp.LastReadAt);
            await _context.ReadingProgresses.Indexes.CreateOneAsync(new CreateIndexModel<ReadingProgress>(progressLastReadKey));

            // 19. ReadingSessions
            var sessionUserStarted = Builders<ReadingSession>.IndexKeys.Ascending(rs => rs.UserId).Ascending(rs => rs.StartedAt);
            await _context.ReadingSessions.Indexes.CreateOneAsync(new CreateIndexModel<ReadingSession>(sessionUserStarted));

            var sessionBookStarted = Builders<ReadingSession>.IndexKeys.Ascending(rs => rs.BookId).Ascending(rs => rs.StartedAt);
            await _context.ReadingSessions.Indexes.CreateOneAsync(new CreateIndexModel<ReadingSession>(sessionBookStarted));

            // 20. ViewEvents (with TTL of 24h/86400s or customized)
            var viewEventBookCreated = Builders<ViewEvent>.IndexKeys.Ascending(ve => ve.BookId).Ascending(ve => ve.CreatedAt);
            await _context.ViewEvents.Indexes.CreateOneAsync(new CreateIndexModel<ViewEvent>(viewEventBookCreated));

            var viewEventTtl = Builders<ViewEvent>.IndexKeys.Ascending(ve => ve.CreatedAt);
            await _context.ViewEvents.Indexes.CreateOneAsync(new CreateIndexModel<ViewEvent>(viewEventTtl, new CreateIndexOptions { ExpireAfter = TimeSpan.FromDays(30) }));

            // 21. AuditLogs
            var auditActorCreated = Builders<AuditLog>.IndexKeys.Ascending(al => al.ActorId).Descending(al => al.CreatedAt);
            await _context.AuditLogs.Indexes.CreateOneAsync(new CreateIndexModel<AuditLog>(auditActorCreated));

            var auditResourceCreated = Builders<AuditLog>.IndexKeys.Ascending(al => al.Resource).Ascending(al => al.ResourceId).Descending(al => al.CreatedAt);
            await _context.AuditLogs.Indexes.CreateOneAsync(new CreateIndexModel<AuditLog>(auditResourceCreated));

            _logger.LogInformation("Database index creation completed successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating database indexes.");
            throw;
        }
    }
}
