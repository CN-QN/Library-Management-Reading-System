# LibraryHub - Hệ thống Quản lý Thư viện & Đọc sách Trực tuyến (Monolith Core)

> Admin/API remediation: admin capabilities use permission-protected `/api/admin/*` contracts, a persisted backend media pipeline, verified Google credentials, opaque password recovery, and MongoDB-derived reports. See [Admin API Contracts](docs/admin-api-contracts.md).

LibraryHub là lõi dịch vụ Backend (API) kết hợp ứng dụng Web (Client & Admin) phục vụ quản lý thư viện nội bộ trường học, mượn trả sách vật lý, và cổng đọc sách trực tuyến dành cho sinh viên. Hệ thống được thiết kế theo hướng **Modular Monolith**, sẵn sàng mở rộng thành microservices, sử dụng các công nghệ hiện đại đảm bảo hiệu năng và tính bảo mật cao.

---

## 🚀 Công nghệ sử dụng

- **Backend Runtime & Framework:** .NET 9.0 (ASP.NET Core Web API).
- **Frontend Framework:** Next.js (Admin & Client Web App).
- **Cơ sở dữ liệu chính:** MongoDB 7.0 (lưu trữ dữ liệu phi cấu trúc, hiệu năng đọc ghi cao).
- **Caching & Cửa sổ giao dịch:** Redis 7.0 (lưu cache quyền hạn, quản lý phiên đăng nhập, chống spam API, khóa phân tán Distributed Lock).
- **Containerization:** Docker & Docker Compose (Quản lý toàn bộ 8 services môi trường và ứng dụng).
- **Thư viện bổ trợ nổi bật:**
  - `StackExchange.Redis` - Kết nối và thực thi lệnh cache/lock trên Redis.
  - `FluentValidation` - Thực hiện kiểm tra định dạng và logic nghiệp vụ.
  - `BCrypt.Net-Next` - Mã hóa mật khẩu người dùng.
  - `Serilog` - Nhật ký hệ thống (Structured Logging).

---

## 🛠️ Yêu cầu chuẩn bị (Prerequisites)

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt các công cụ sau:
1.  **Docker Desktop** (Bắt buộc để chạy nhanh MongoDB, Redis và các dịch vụ). [Tải Docker](https://www.docker.com/products/docker-desktop/).
2.  **.NET 9.0 SDK** (Nếu muốn chạy hoặc debug backend bằng mã nguồn cục bộ). [Tải .NET 9.0](https://dotnet.microsoft.com/download/dotnet/9.0).
3.  Một IDE lập trình bất kỳ: **Visual Studio 2022**, **JetBrains Rider**, hoặc **VS Code**.

---

## ⚙️ Hướng dẫn khởi chạy bằng Docker Compose (Khuyên dùng)

Hệ thống được cấu hình sẵn một tệp `docker-compose.yml` tối ưu để khởi động toàn bộ 8 dịch vụ chỉ với một dòng lệnh:

### Bước 1: Clone dự án và thiết lập tệp môi trường
Mở terminal tại thư mục chứa dự án và tạo tệp cấu hình `.env`:
```bash
cp .env.example .env
```

### Bước 2: Khởi chạy toàn bộ hệ thống
Chạy lệnh sau để tự động tải image, xây dựng code và chạy các container:
```bash
docker-compose up --build -d
```

### Bước 3: Bản đồ cổng truy cập hệ thống (Port Map Reference)

Khi Docker khởi động thành công, các dịch vụ sẽ lắng nghe tại các địa chỉ sau:

| Dịch vụ | Cổng Host | Địa chỉ truy cập | Mô tả chức năng |
| :--- | :--- | :--- | :--- |
| **Web Client** | `3000` | [http://localhost:3000](http://localhost:3000) | **Reader Portal:** Giao diện cho Độc giả/Sinh viên đọc sách trực tuyến, mượn sách. |
| **Admin Web** | `3001` | [http://localhost:3001](http://localhost:3001) | **Admin Portal (Template):** Giao diện quản trị viên (hiện tại là trang mặc định của Next.js). |
| **Backend API** | `5000` | [http://localhost:5000](http://localhost:5000) | **Production API Gateway:** Điểm kết nối chính từ các frontend tới backend. |
| **Dev API** | `5210` | [http://localhost:5210](http://localhost:5210) | **Swagger API Playground:** Xem chi tiết tài liệu API và test API cục bộ. |
| **Mongo Express**| `8081` | [http://localhost:8081](http://localhost:8081) | **MongoDB Admin UI:** Giao diện quản trị, xem và sửa dữ liệu trực tiếp trong MongoDB. |
| **Redis Commander**| `8082` | [http://localhost:8082](http://localhost:8082) | **Redis Admin UI:** Giao diện xem cache và các key/lock đang hoạt động trên Redis. |
| **MongoDB Database**| `27017`| `localhost:27017` | Kết nối trực tiếp từ MongoDB Compass. |
| **Redis Server** | `6379` | `localhost:6379` | Kết nối trực tiếp từ Redis CLI. |

---

## 📡 Danh sách API Routes (API Reference)

### 1. Xác thực & Tài khoản (`/api/auth`)
| Method | Endpoint | Mô tả chức năng | Quyền yêu cầu |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Đăng ký tài khoản độc giả mới | Không yêu cầu (Chỉ Gmail) |
| `POST` | `/api/auth/login` | Đăng nhập hệ thống (Tự cấp cookie) | Không yêu cầu |
| `POST` | `/api/auth/logout` | Đăng xuất người dùng (Xóa cookie) | Đăng nhập |
| `GET` | `/api/auth/profile` | Xem thông tin chi tiết tài khoản hiện tại | Đăng nhập |

### 2. Quản lý Mượn - Trả sách vật lý (`/api/borrowings`)
*Đòi hỏi quyền hạn cụ thể của Thủ thư để tránh sinh viên tự duyệt mượn trả.*
| Method | Endpoint | Mô tả chức năng | Quyền yêu cầu (Permission) |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/borrowings` | Tạo phiếu mượn sách mới tại quầy | `loan.create` (Thủ thư) |
| `GET` | `/api/borrowings` | Danh sách phiếu mượn (Lọc theo user/status) | `user.read` |
| `GET` | `/api/borrowings/{id}` | Chi tiết phiếu mượn | Đăng nhập |
| `POST` | `/api/borrowings/{id}/return` | Duyệt trả sách mượn (Tự tính phạt quá hạn)| `loan.return` (Thủ thư) |
| `POST` | `/api/borrowings/items/{itemId}/renew` | Gia hạn mượn sách (Max 2 lần) | `loan.extend` |
| `PATCH` | `/api/borrowings/items/{itemId}/status`| Báo hỏng hoặc làm mất sách (Tự tính phạt) | `loan.return` (Thủ thư) |

### 3. Đặt trước sách khi hết bản sao (`/api/reservations`)
| Method | Endpoint | Mô tả chức năng | Quyền yêu cầu (Permission) |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/reservations` | Đặt xếp hàng trước sách (Chỉ cho khi hết bản sao) | Đăng nhập |
| `GET` | `/api/reservations` | Tìm kiếm, xem hàng đợi đặt trước | Đăng nhập |
| `POST` | `/api/reservations/{id}/cancel` | Hủy lượt đặt trước sách (Dồn vị trí hàng đợi)| Đăng nhập |
| `POST` | `/api/reservations/{id}/fulfill` | Hoàn thành giao sách đặt trước cho người mượn | `reservation.approve` (Thủ thư) |

### 4. Quản lý Tiền phạt (`/api/fines`)
| Method | Endpoint | Mô tả chức năng | Quyền yêu cầu (Permission) |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/fines` | Tra cứu danh sách tiền phạt quá hạn/hỏng sách | Đăng nhập |
| `POST` | `/api/fines/{id}/pay` | Thanh toán tiền phạt tại quầy thủ thư | `fine.waive` (Thủ thư) |
| `POST` | `/api/fines/{id}/waive` | Miễn giảm tiền phạt (Lý do cụ thể) | `fine.waive` (Librarian/Admin) |

### 5. Tiến trình đọc sách trực tuyến (`/api/reading`)
| Method | Endpoint | Mô tả chức năng | Quyền yêu cầu |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/reading/progress` | Autosave tiến trình đọc (Lưu tạm vào Redis Hash) | Đăng nhập |
| `GET` | `/api/reading/progress/{bookId}`| Lấy vị trí đọc gần nhất của sách | Đăng nhập |
| `POST` | `/api/reading/sessions/start` | Khởi tạo phiên đọc sách mới | Đăng nhập |
| `POST` | `/api/reading/sessions/{id}/heartbeat`| Gửi heartbeat định kỳ để tính tích lũy thời gian| Đăng nhập |
| `POST` | `/api/reading/sessions/{id}/end` | Kết thúc phiên đọc sách | Đăng nhập |

### 6. Tìm kiếm & Gợi ý sách nâng cao (`/api/search`)
*Không yêu cầu đăng nhập (Public APIs).*
| Method | Endpoint | Mô tả chức năng | Quyền yêu cầu |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/search` | Tìm kiếm sách nâng cao (Lookup Author & Category) | Không yêu cầu |
| `GET` | `/api/search/suggestions`| Autocomplete gợi ý nhanh từ khóa khi gõ | Không yêu cầu |
| `GET` | `/api/search/trending` | Sách thịnh hành (Tính động 7 ngày, cache Redis) | Không yêu cầu |
| `GET` | `/api/search/recommendations`| Gợi ý cá nhân hóa (Dựa trên lịch sử sách đã đọc) | Đăng nhập / Khách |

### 7. Hệ thống Thông báo (`/api/notifications`)
| Method | Endpoint | Mô tả chức năng | Quyền yêu cầu (Permission) |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | Lấy danh sách thông báo của user (phân trang) | Đăng nhập |
| `GET` | `/api/notifications/unread-count`| Số lượng thông báo chưa đọc | Đăng nhập |
| `POST` | `/api/notifications/{id}/read`| Đánh dấu một thông báo đã đọc | Đăng nhập |
| `POST` | `/api/notifications/read-all`| Đánh dấu toàn bộ thông báo đã đọc | Đăng nhập |
| `POST` | `/api/notifications/send` | Gửi thông báo cá nhân cho một sinh viên cụ thể | `notification.send` (Admin/Thủ thư) |
| `POST` | `/api/notifications/broadcast`| Phát thông báo hệ thống cho mọi user hoạt động | `notification.broadcast` (Admin/Thủ thư) |

---

## 🔒 Các nghiệp vụ nền tảng & Bảo mật cốt lõi

### 1. Phân quyền động an toàn (RBAC & Redis):
Hệ thống sử dụng bộ lọc `[RequirePermission(Permissions.XXX)]` để chặn truy cập API trái phép. Danh sách quyền hạn được phân tích từ vai trò (`user_roles`) của người dùng và lưu trữ tức thì trên Redis. Mỗi cuộc gọi API chỉ tốn chưa tới 1ms để check quyền trên Redis Cache, không gây nghẽn database chính.

### 2. Chặn tranh chấp mượn sách bằng Distributed Lock:
Khi gọi API mượn sách, hệ thống áp dụng cơ chế khóa phân tán Redis `borrow_lock:{copyId}` trong 10 giây. Điều này đảm bảo tại một thời điểm, một bản sao sách vật lý duy nhất chỉ được xử lý mượn bởi một thủ thư, loại bỏ hoàn toàn lỗi tranh chấp dữ liệu khi nhiều người mượn cùng lúc.

### 3. Đồng bộ tiến trình đọc chạy ngầm (Sync Worker & BulkWrite):
Khi độc giả cuộn trang đọc sách trực tuyến, Web Client liên tục gọi API Autosave. Để giảm tải 95% IOPS ghi cho MongoDB, backend chỉ ghi tiến trình vào **Redis Hash** và đưa khóa vào hàng đợi dirty set `reading_progress:dirty`.
Một tiến trình chạy nền **`ReadingProgressSyncWorker`** (Hosted Service) tự động quét hàng đợi này mỗi 30 giây, chuyển dữ liệu và đồng bộ hàng loạt vào MongoDB bằng lệnh `BulkWriteAsync` tối ưu.

### 4. Thuật toán chống xung đột đa thiết bị (Versioning):
Khi lưu tiến trình đọc, hệ thống so khớp trường `Version` từ thiết bị gửi lên với Version trên hệ thống. Nếu sinh viên mở sách trên nhiều thiết bị và thiết bị cũ gửi lên phiên bản nhỏ hơn phiên bản đang lưu, backend từ chối ghi và trả về tiến trình mới nhất của thiết bị kia để ứng dụng tự đồng bộ lại giao diện.
