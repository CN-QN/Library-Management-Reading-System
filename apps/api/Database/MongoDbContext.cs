using api.Configuration;
using api.Database.Entities;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace api.Database;

public class MongoDbContext
{
    private readonly IMongoDatabase _database;

    public MongoDbContext(IOptions<MongoDbSettings> settings)
    {
        var client = new MongoClient(settings.Value.ConnectionString);
        _database = client.GetDatabase(settings.Value.DatabaseName);
    }

    public IMongoDatabase Database => _database;

    public IMongoCollection<User> Users => _database.GetCollection<User>("users");
    public IMongoCollection<Role> Roles => _database.GetCollection<Role>("roles");
    public IMongoCollection<Permission> Permissions => _database.GetCollection<Permission>("permissions");
    public IMongoCollection<RolePermission> RolePermissions => _database.GetCollection<RolePermission>("role_permissions");
    public IMongoCollection<UserRole> UserRoles => _database.GetCollection<UserRole>("user_roles");
    public IMongoCollection<AuthSession> AuthSessions => _database.GetCollection<AuthSession>("auth_sessions");
    public IMongoCollection<AuditLog> AuditLogs => _database.GetCollection<AuditLog>("audit_logs");
    public IMongoCollection<LibraryBranch> LibraryBranches => _database.GetCollection<LibraryBranch>("library_branches");
    public IMongoCollection<Author> Authors => _database.GetCollection<Author>("authors");
    public IMongoCollection<Category> Categories => _database.GetCollection<Category>("categories");
    public IMongoCollection<Book> Books => _database.GetCollection<Book>("books");
    public IMongoCollection<BookAuthor> BookAuthors => _database.GetCollection<BookAuthor>("book_authors");
    public IMongoCollection<BookCategory> BookCategories => _database.GetCollection<BookCategory>("book_categories");
    public IMongoCollection<Chapter> Chapters => _database.GetCollection<Chapter>("chapters");
    public IMongoCollection<DigitalAsset> DigitalAssets => _database.GetCollection<DigitalAsset>("digital_assets");
    public IMongoCollection<BookCopy> BookCopies => _database.GetCollection<BookCopy>("book_copies");
    public IMongoCollection<Borrowing> Borrowings => _database.GetCollection<Borrowing>("borrowings");
    public IMongoCollection<BorrowingItem> BorrowingItems => _database.GetCollection<BorrowingItem>("borrowing_items");
    public IMongoCollection<ReadingProgress> ReadingProgresses => _database.GetCollection<ReadingProgress>("reading_progress");
    public IMongoCollection<ReadingSession> ReadingSessions => _database.GetCollection<ReadingSession>("reading_sessions");
    public IMongoCollection<ViewEvent> ViewEvents => _database.GetCollection<ViewEvent>("view_events");

    // Generic helper to get any collection by name
    public IMongoCollection<T> GetCollection<T>(string name)
    {
        return _database.GetCollection<T>(name);
    }
}
