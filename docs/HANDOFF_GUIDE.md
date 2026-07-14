# Hướng dẫn Bàn giao Base Project (Handoff & Integration Guide)

Tài liệu này hướng dẫn cách chạy, tích hợp và phát triển tiếp dự án **LibraryHub** dựa trên phần Base Project đã được xây dựng hoàn chỉnh bởi **Người 1 (Tech Lead)**.

---

## 🚀 1. Hướng dẫn chạy Dự án ở Local

### Bước 1: Khởi động Database (MongoDB & Redis)
Hệ thống sử dụng Docker Compose để chạy database cục bộ một cách nhanh chóng.
1. Cài đặt Docker Desktop.
2. Tại thư mục gốc của dự án (`/`), chạy lệnh:
   ```bash
   docker-compose up -d
   ```
   *Lệnh này sẽ tự động tải và khởi chạy MongoDB (Port 27017) và Redis (Port 6379).*

### Bước 2: Cấu hình file appsettings.json
Mặc định dự án ASP.NET Core sử dụng file `appsettings.json` để cấu hình hệ thống.
1. Mở file [appsettings.json](file:///d:/workspaces/Projects/LibraryHub/apps/api/appsettings.json) trong thư mục `apps/api/`.
2. Đảm bảo cấu hình của bạn khớp với MongoDB và Redis chạy ở local (mặc định đã được cấu hình sẵn):
   ```json
   {
     "MongoDb": {
       "ConnectionString": "mongodb://localhost:27017",
       "DatabaseName": "libraryhub"
     },
     "Redis": {
       "ConnectionString": "localhost:6379"
     },
     "CORS_ORIGINS": "http://localhost:3000,http://localhost:3001",
     "Jwt": {
       "Secret": "SuperSecretKeyForLibraryHubManagementSystem2026!",
       "Issuer": "LibraryHub",
       "Audience": "LibraryHubUsers",
       "AccessExpiryMinutes": 15,
       "RefreshExpiryDays": 7
     }
   }
   ```

### Bước 3: Chạy ứng dụng Backend API
1. Di chuyển vào thư mục api:
   ```bash
   cd apps/api
   ```
2. Chạy ứng dụng:
   ```bash
   dotnet run
   ```
   *Khi khởi chạy lần đầu, ứng dụng sẽ tự động gọi `IndexCreator` để tạo các Index bảo mật và `SeedRunner` để nạp dữ liệu mẫu vào MongoDB của bạn.*

---

## 👤 2. Danh sách Tài khoản Test (Seed Data)

Các tài khoản dưới đây đã được tạo sẵn trong DB phục vụ việc phát triển và test:

| Email | Mật khẩu (chung) | Vai trò (Role) | Mô tả phạm vi |
| :--- | :--- | :--- | :--- |
| **admin@libraryhub.com** | `Test@123456` | `SUPER_ADMIN` | Quản trị viên tối cao, toàn quyền hệ thống |
| **libadmin@libraryhub.com** | `Test@123456` | `LIBRARY_ADMIN` | Quản lý chi nhánh mặc định (Thư viện Trung tâm) |
| **librarian@libraryhub.com** | `Test@123456` | `LIBRARIAN` | Thủ thư chi nhánh mặc định |
| **editor@libraryhub.com** | `Test@123456` | `CONTENT_EDITOR` | Biên tập viên sách và chương |
| **inventory@libraryhub.com** | `Test@123456` | `INVENTORY_STAFF` | Nhân viên quản lý kho sách vật lý |
| **student@libraryhub.com** | `Test@123456` | `STUDENT` | Sinh viên (Độc giả chính) |
| **guest@libraryhub.com** | `Test@123456` | `GUEST` | Khách vãng lai |
| **worker@libraryhub.com** | `Test@123456` | `SYSTEM_WORKER` | Tài khoản dành cho các tiến trình chạy nền |

---

## 🛠️ 3. Dành cho Backend Developers (Người 2 & Người 3)

### Sử dụng MongoDB Context (`MongoDbContext`)
Để truy vấn MongoDB, bạn chỉ cần Inject `MongoDbContext` vào Constructor của Service của bạn:
```csharp
public class BooksService
{
    private readonly MongoDbContext _context;

    public BooksService(MongoDbContext context)
    {
        _context = context;
    }

    public async Task AddBookAsync(Book book)
    {
        // Truy cập collection sách
        await _context.Books.InsertOneAsync(book);
    }
}
```

### Sử dụng Redis Context (`RedisContext`)
Để làm việc với Redis (ví dụ: lưu tiến trình đọc của Người 3), hãy Inject `RedisContext`:
```csharp
public class ReadingProgressService
{
    private readonly RedisContext _redis;

    public ReadingProgressService(RedisContext redis)
    {
        _redis = redis;
    }

    public async Task SaveTempProgressAsync(string userId, string bookId, string progressJson)
    {
        var db = _redis.Database;
        var key = $"reading_progress:{userId}:{bookId}";
        await db.StringSetAsync(key, progressJson, TimeSpan.FromHours(24));
    }
}
```

### Cách áp dụng Phân Quyền vào API
Để giới hạn quyền truy cập vào các Controller/Action, sử dụng các Attribute custom đã được Người 1 viết sẵn:
* Yêu cầu người dùng đăng nhập và có quyền cụ thể: `[RequirePermission("book.create")]`
* Yêu cầu người dùng đăng nhập và có ít nhất một trong các quyền: `[RequireAnyPermission("book.delete", "book.archive")]`

**Ví dụ:**
```csharp
[ApiController]
[Route("api/books")]
public class BooksController : ControllerBase
{
    [HttpPost]
    [RequirePermission("book.create")] // Chỉ tài khoản có quyền tạo sách mới gọi được
    public async Task<IActionResult> CreateBook([FromBody] CreateBookDto dto)
    {
        // Xử lý tạo sách...
    }
}
```

---

## 🌐 4. Dành cho Frontend Developers (Người 4 & Người 5)

### Gọi API và Quản lý Session
1. **Endpoint Đăng Nhập:** `POST /api/auth/login`
   * Body: `{ "email": "student@libraryhub.com", "password": "Test@123456" }`
   * Trả về: Access Token (JWT hết hạn sau 15 phút), Refresh Token (hết hạn sau 7 ngày), thông tin Profile và danh sách Quyền hạn (Permissions).
2. **Authorization Header:** Đối với mọi API yêu cầu xác thực, gửi Header kèm theo:
   ```http
   Authorization: Bearer <access_token>
   ```
3. **Cơ chế Refresh Token:**
   * Khi gọi API nhận mã lỗi `401 Unauthorized` (do Access Token hết hạn), Frontend hãy tự động gọi API `POST /api/auth/refresh` kèm theo Header hoặc Body chứa Refresh Token để nhận cặp Token mới rồi thử lại request cũ.
4. **Cấu hình CORS:** API đã được sửa lỗi CORS động. Ở môi trường Local, API sẽ tự động chấp nhận mọi request từ Frontend chạy ở port bất kỳ, đồng thời hỗ trợ gửi cookie/token (`AllowCredentials`).

---

## 📃 5. Danh sách API endpoints đã dựng sẵn (API Docs)

Bạn có thể xem tài liệu trực quan tại **Swagger UI** khi chạy ứng dụng:
👉 **`http://localhost:5000/swagger/index.html`** (Chỉ hoạt động khi ứng dụng đang chạy).

### Chức năng Xác thực & Phiên làm việc (Auth Module - M01)
* `POST /api/auth/register` : Đăng ký tài khoản sinh viên.
* `POST /api/auth/login` : Đăng nhập nhận JWT.
* `POST /api/auth/refresh` : Refresh token cũ lấy token mới.
* `POST /api/auth/logout` : Đăng xuất, xóa session.
* `GET /api/auth/profile` : Lấy thông tin tài khoản hiện tại + danh sách quyền hạn.
* `GET /api/auth/sessions` : Danh sách các thiết bị/phiên đang đăng nhập tài khoản này.
* `DELETE /api/auth/sessions/{id}` : Thu hồi/đăng xuất thiết bị khác từ xa.

### Quản trị Người dùng & Phân quyền (RBAC Module - M02)
* `GET /api/users` : Xem danh sách người dùng (hỗ trợ phân trang, lọc, tìm kiếm).
* `POST /api/users` : Admin tạo tài khoản nhân viên/sinh viên thủ công.
* `PATCH /api/users/{id}/status` : Khóa/mở khóa tài khoản người dùng.
* `POST /api/users/{id}/roles` : Gán vai trò (role) cho người dùng.
* `DELETE /api/users/{id}/roles/{roleId}` : Gỡ vai trò khỏi người dùng.
* `GET /api/roles` : Xem danh sách vai trò hiện có trong hệ thống.
* `POST /api/roles` : Tạo vai trò mới.
* `POST /api/roles/{id}/permissions` : Gán quyền hạn chi tiết cho vai trò.

### Giám sát hệ thống (Health Check)
* `GET /api/health` : Kiểm tra trạng thái sống của MongoDB và Redis (trả về trạng thái Healthy).
