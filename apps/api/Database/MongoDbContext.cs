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

    // ===== AUTH & RBAC =====
    public IMongoCollection<User> Users => _database.GetCollection<User>("users");
    public IMongoCollection<Role> Roles => _database.GetCollection<Role>("roles");
    public IMongoCollection<Permission> Permissions => _database.GetCollection<Permission>("permissions");
    public IMongoCollection<RolePermission> RolePermissions => _database.GetCollection<RolePermission>("role_permissions");
    public IMongoCollection<UserRole> UserRoles => _database.GetCollection<UserRole>("user_roles");
    public IMongoCollection<AuthSession> AuthSessions => _database.GetCollection<AuthSession>("auth_sessions");
    public IMongoCollection<AuditLog> AuditLogs => _database.GetCollection<AuditLog>("audit_logs");

    // ===== BRANCH =====
    public IMongoCollection<LibraryBranch> LibraryBranches => _database.GetCollection<LibraryBranch>("library_branches");

    // ===== CATALOG (M03) =====
    public IMongoCollection<Author> Authors => _database.GetCollection<Author>("authors");
    public IMongoCollection<Publisher> Publishers => _database.GetCollection<Publisher>("publishers"); // ← THÊM DÒNG NÀY
    public IMongoCollection<Category> Categories => _database.GetCollection<Category>("categories");
    public IMongoCollection<Book> Books => _database.GetCollection<Book>("books");
    public IMongoCollection<BookAuthor> BookAuthors => _database.GetCollection<BookAuthor>("book_authors");
    public IMongoCollection<BookCategory> BookCategories => _database.GetCollection<BookCategory>("book_categories");

    // ===== DIGITAL CONTENT (M04) =====
    public IMongoCollection<Chapter> Chapters => _database.GetCollection<Chapter>("chapters");
    public IMongoCollection<DigitalAsset> DigitalAssets => _database.GetCollection<DigitalAsset>("digital_assets");

    // ===== INVENTORY (M05) =====
    public IMongoCollection<BookCopy> BookCopies => _database.GetCollection<BookCopy>("book_copies");

    // ===== CIRCULATION & FINES (M06 & M07) =====
    public IMongoCollection<Borrowing> Borrowings => _database.GetCollection<Borrowing>("borrowings");
    public IMongoCollection<BorrowingItem> BorrowingItems => _database.GetCollection<BorrowingItem>("borrowing_items");
    public IMongoCollection<Fine> Fines => _database.GetCollection<Fine>("fines");
    public IMongoCollection<Reservation> Reservations => _database.GetCollection<Reservation>("reservations");

    // ===== READING (M09) =====
    public IMongoCollection<ReadingProgress> ReadingProgresses => _database.GetCollection<ReadingProgress>("reading_progress");
    public IMongoCollection<ReadingSession> ReadingSessions => _database.GetCollection<ReadingSession>("reading_sessions");

    // ===== ANALYTICS =====
    public IMongoCollection<ViewEvent> ViewEvents => _database.GetCollection<ViewEvent>("view_events");

    // ===== NOTIFICATIONS (M13) =====
    public IMongoCollection<Notification> Notifications => _database.GetCollection<Notification>("notifications");

    // ===== REVIEWS (M11) =====
    public IMongoCollection<Review> Reviews => _database.GetCollection<Review>("reviews");

    // ===== SYSTEM SETTINGS (M15) =====
    public IMongoCollection<SystemSetting> SystemSettings => _database.GetCollection<SystemSetting>("system_settings");

    // Generic helper to get any collection by name
    public IMongoCollection<T> GetCollection<T>(string name)
    {
        return _database.GetCollection<T>(name);
    }
}