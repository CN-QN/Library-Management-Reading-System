# LibraryHub - Hệ thống quản lý thư viện và Đọc sách trực tuyến (Backend Core)

LibraryHub là lõi dịch vụ Backend (API) hỗ trợ quản lý thư viện nội bộ trường học, mượn trả sách vật lý và cổng đọc sách trực tuyến dành cho sinh viên. Hệ thống được xây dựng trên nền tảng **Modular Monolith**, sẵn sàng mở rộng thành microservices, sử dụng các công nghệ hiện đại đảm bảo hiệu năng và tính bảo mật cao.

---

## 🚀 Công nghệ sử dụng

- **Runtime & Framework:** .NET 9.0 (ASP.NET Core Web API).
- **Cơ sở dữ liệu chính:** MongoDB 7.0 (lưu trữ phi cấu trúc, hiệu năng đọc ghi cao).
- **Caching & Session Storage:** Redis 7.0 (lưu cache quyền hạn, quản lý phiên đăng nhập, chống spam API).
- **Containerization:** Docker & Docker Compose (quản lý và chạy các dịch vụ môi trường).
- **Thư viện bổ trợ nổi bật:**
  - `FluentValidation` - Thực hiện kiểm tra định dạng và logic nghiệp vụ.
  - `BCrypt.Net-Next` - Mã hóa mật khẩu người dùng.
  - `Serilog` - Nhật ký hệ thống (Structured Logging).

---

## 🛠️ Yêu cầu chuẩn bị (Prerequisites)

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt các công cụ sau:

1.  **Docker Desktop** (Để chạy nhanh MongoDB & Redis). [Tải Docker](https://www.docker.com/products/docker-desktop/).
2.  **.NET 9.0 SDK**. [Tải .NET 9.0](https://dotnet.microsoft.com/download/dotnet/9.0).
3.  **MongoDB Compass** (Tùy chọn - Công cụ trực quan hóa dữ liệu MongoDB). [Tải Compass](https://www.mongodb.com/products/tools/compass).
4.  Một IDE lập trình bất kỳ: **Visual Studio 2022**, **JetBrains Rider**, hoặc **VS Code**.

---

## ⚙️ Hướng dẫn cài đặt và Chạy dự án (Setup Guide)

Làm theo các bước dưới đây để chạy hệ thống từ đầu:

### Bước 1: Clone dự án và truy cập thư mục

Mở terminal và di chuyển đến thư mục chứa dự án của bạn:

```bash
cd LibraryHub
```

### Bước 2: Thiết lập tệp cấu hình môi trường (.env)

Sao chép tệp `.env.example` thành `.env` để cấu hình kết nối:

```bash
cp .env.example .env
```

_(Lưu ý: Các giá trị mặc định trong `.env.example` đã được cấu hình tối ưu để chạy trực tiếp trên môi trường localhost)._

### Bước 3: Khởi chạy Database & Cache (MongoDB, Redis)

Khởi động Docker containers chạy ngầm bằng lệnh:

```bash
docker compose up -d
```

Kiểm tra xem các container đã hoạt động chưa:

```bash
docker ps
```

Bạn sẽ thấy 2 container đang chạy là `libraryhub-mongodb` (cổng `27017`) và `libraryhub-redis` (cổng `6379`).

### Bước 4: Khởi động Backend API

Di chuyển vào thư mục dự án API:

```bash
cd apps/api
```

Khôi phục các gói NuGet phụ thuộc:

```bash
dotnet restore
```

Biên dịch dự án:

```bash
dotnet build
```

Chạy ứng dụng:

```bash
dotnet run
```

Khi ứng dụng khởi chạy thành công, terminal sẽ hiển thị thông tin lắng nghe trên các cổng:

- **HTTP:** `http://localhost:5210`
- **HTTPS:** `https://localhost:7041`

---

## 📖 Trải nghiệm API & Danh sách Tài khoản Test (Seeding Data)

Khi khởi chạy lần đầu tiên, hệ thống sẽ **tự động khởi tạo dữ liệu mẫu (Auto-Seeding)** vào MongoDB bao gồm: Chi nhánh mặc định, 34 quyền hạn hệ thống, các vai trò, và các tài khoản thử nghiệm.

### 🌐 Sử dụng Swagger UI để Kiểm thử API

Mở trình duyệt và truy cập đường dẫn dưới đây để xem tài liệu API chi tiết:
👉 **[http://localhost:5210/swagger/index.html](http://localhost:5210/swagger/index.html)**

#### Hướng dẫn xác thực trên Swagger UI:
- **Cơ chế Cookie tự động:** Vì hệ thống sử dụng cơ chế bảo mật HttpOnly Cookie cho môi trường Web, khi bạn gọi API `POST /api/auth/login` thành công trên giao diện Swagger, trình duyệt sẽ **tự động lưu trữ** `accessToken` và `refreshToken` vào Cookie.
- **Tự động đính kèm:** Đối với tất cả các cuộc gọi API nghiệp vụ sau đó trên Swagger (ví dụ: lấy thông tin người dùng, đổi quyền,...), trình duyệt sẽ **tự động gửi kèm Cookie** lên. Bạn **không cần** phải click nút `Authorize` hay copy-paste Token thủ công!
- **Sử dụng Token Header (Postman/Mobile):** Trong trường hợp bạn sử dụng các tool ngoài như Postman hoặc lập trình ứng dụng Di động, Swagger vẫn hỗ trợ cấu hình Header `Authorization: Bearer <Your_Access_Token>` bằng cách click vào nút `Authorize` ở góc trên cùng bên phải.

### Danh sách tài khoản thử nghiệm (Mật khẩu chung: `Test@123456`)

| Email đăng nhập              | Vai trò (Role)    | Mô tả phạm vi quyền hạn                                    |
| :--------------------------- | :---------------- | :--------------------------------------------------------- |
| **admin@libraryhub.com**     | `SUPER_ADMIN`     | Quản trị viên tối cao, toàn quyền hệ thống                 |
| **libadmin@libraryhub.com**  | `LIBRARY_ADMIN`   | Quản lý chi nhánh mặc định (Thư viện Trung tâm)            |
| **librarian@libraryhub.com** | `LIBRARIAN`       | Thủ thư hỗ trợ mượn/trả sách vật lý tại quầy               |
| **editor@libraryhub.com**    | `CONTENT_EDITOR`  | Biên tập viên chuyên quản lý sách số và chương sách        |
| **inventory@libraryhub.com** | `INVENTORY_STAFF` | Nhân viên quản lý kho, kiểm kê đầu sách                    |
| **student@libraryhub.com**   | `STUDENT`         | Sinh viên (Độc giả chính)                                  |
| **guest@libraryhub.com**     | `GUEST`           | Khách vãng lai, quyền đọc hạn chế                          |
| **worker@libraryhub.com**    | `SYSTEM_WORKER`   | Tài khoản dành riêng cho các tác vụ chạy nền (Worker/Cron) |

---

## 📡 Danh sách API Routes (API Reference)

Dưới đây là danh sách toàn bộ các routes API được phân chia theo module chức năng, kèm phương thức, đường dẫn, yêu cầu đăng nhập và phân quyền chi tiết.

### 1. Module Xác thực & Tài khoản (`/api/auth`)

| Method | Endpoint | Mô tả chức năng | Đăng nhập | Quyền yêu cầu (Permission) |
| :--- | :--- | :--- | :---: | :--- |
| `POST` | `/api/auth/register` | Đăng ký tài khoản độc giả mới | ❌ | Không yêu cầu |
| `POST` | `/api/auth/login` | Đăng nhập hệ thống (Tự động cấp cookie) | ❌ | Không yêu cầu |
| `POST` | `/api/auth/refresh` | Làm mới Access Token khi hết hạn | ❌ | Không yêu cầu |
| `POST` | `/api/auth/logout` | Đăng xuất người dùng (Xóa toàn bộ cookie) | ✅ | Không yêu cầu |
| `GET` | `/api/auth/profile` | Xem thông tin chi tiết tài khoản hiện tại | ✅ | Không yêu cầu |
| `GET` | `/api/auth/sessions` | Danh sách các phiên đăng nhập đang hoạt động | ✅ | Không yêu cầu |
| `DELETE` | `/api/auth/sessions/{id}` | Thu hồi (hủy kích hoạt) một phiên đăng nhập | ✅ | Không yêu cầu |

---

### 2. Module Quản lý Người dùng (`/api/users`)

| Method | Endpoint | Mô tả chức năng | Đăng nhập | Quyền yêu cầu (Permission) |
| :--- | :--- | :--- | :---: | :--- |
| `GET` | `/api/users` | Tìm kiếm và xem danh sách người dùng phân trang | ✅ | `user.read` |
| `GET` | `/api/users/{id}` | Xem chi tiết thông tin một người dùng | ✅ | `user.read` |
| `POST` | `/api/users` | Admin tạo trực tiếp tài khoản mới | ✅ | `user.create` |
| `PUT` | `/api/users/{id}` | Cập nhật thông tin hồ sơ người dùng | ✅ | `user.update` |
| `PATCH` | `/api/users/{id}/status` | Khóa hoặc mở khóa tài khoản | ✅ | `user.lock` |
| `POST` | `/api/users/{id}/roles` | Gán thêm vai trò cho người dùng | ✅ | `user.assign_role` |
| `DELETE` | `/api/users/{id}/roles/{userRoleId}` | Gỡ bỏ vai trò khỏi người dùng | ✅ | `user.assign_role` |

---

### 3. Module Quản lý Vai trò & Quyền hạn (`/api/roles`)

| Method | Endpoint | Mô tả chức năng | Đăng nhập | Quyền yêu cầu (Permission) |
| :--- | :--- | :--- | :---: | :--- |
| `GET` | `/api/roles` | Lấy danh sách các vai trò (roles) trong hệ thống | ✅ | `role.read` |
| `GET` | `/api/roles/{id}` | Xem thông tin chi tiết của một vai trò | ✅ | `role.read` |
| `POST` | `/api/roles` | Khởi tạo vai trò mới | ✅ | `role.create` |
| `PUT` | `/api/roles/{id}` | Thay đổi thông tin cơ bản của vai trò | ✅ | `role.update` |
| `GET` | `/api/permissions` | Xem danh sách tất cả quyền hạn (permissions) hệ thống | ✅ | `role.read` |
| `POST` | `/api/roles/{id}/permissions` | Gán quyền chức năng cho vai trò | ✅ | `role.assign_permission` |
| `DELETE` | `/api/roles/{id}/permissions/{permissionId}` | Gỡ quyền chức năng khỏi vai trò | ✅ | `role.assign_permission` |

---

### 4. Module Nhật ký Hệ thống (`/api/audit-logs`)

| Method | Endpoint | Mô tả chức năng | Đăng nhập | Quyền yêu cầu (Permission) |
| :--- | :--- | :--- | :---: | :--- |
| `GET` | `/api/audit-logs` | Truy vấn nhật ký thay đổi dữ liệu của hệ thống | ✅ | `audit.read` |

---

## 🔒 Cơ chế bảo mật Token qua HttpOnly Cookie

Để đảm bảo an toàn tuyệt đối trước các cuộc tấn công **XSS (Cross-Site Scripting)**, hệ thống không trả Access Token hay Refresh Token về JSON body để Client lưu vào `localStorage`. Thay vào đó, hệ thống lưu trữ trực tiếp vào Cookie bảo mật:

1.  **Đăng nhập thành công (`POST /api/auth/login`):**
    - Hệ thống thiết lập cookie `accessToken` với `Path=/` (tự động đính kèm ở các request gọi API nghiệp vụ như lấy sách, người dùng...).
    - Hệ thống thiết lập cookie `refreshToken` với `Path=/api/auth` (chỉ gửi lên khi cần refresh token hoặc logout).
    - Body trả về chỉ chứa thông tin profile cơ bản của người dùng (`user`), không chứa mã token.
2.  **Đọc Token tự động:**
    - Backend tự động đọc cookie `accessToken` để xác thực phiên làm việc.
    - _(Tương thích đa nền tảng)_: Vẫn hỗ trợ đọc từ header `Authorization: Bearer <token>` nếu client là ứng dụng Di động (Mobile App) không hỗ trợ cookie.

---

## 🛡️ Ràng buộc Validation & Nghiệp vụ Quan trọng

Hệ thống tích hợp bộ lọc **FluentValidation** chặt chẽ trước khi tiếp nhận dữ liệu:

- **Đăng ký sinh viên:**
  - Mã số sinh viên (`studentCode`) **bắt buộc** chỉ chứa số, độ dài từ 8 đến 12 chữ số (chặn các mã rác chứa chữ cái).
  - Email đăng ký bắt buộc phải thuộc tên miền `@gmail.com` hoặc các tên miền giáo dục kết thúc bằng `.edu.vn`.
- **Độ mạnh mật khẩu:** Bắt buộc tối thiểu 8 ký tự, có chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt.
- **Toàn vẹn quan hệ (DB Checks):** Tự động truy vấn MongoDB ở bước validate để đảm bảo `BranchId`, `RoleId` hay `PermissionId` truyền lên phải tồn tại thực tế trong database.
- **An toàn phân trang:** Tự động điều chỉnh các tham số `page` và `limit` về giá trị hợp lệ nếu Client truyền số âm hoặc số 0, tránh lỗi crash database.
