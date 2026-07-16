# Sơ đồ Kiến trúc Hệ thống (System Architecture Diagram)

Tài liệu này mô tả sơ đồ kiến trúc tổng thể của dự án **LibraryHub (Hệ thống Quản lý Thư viện và Đọc sách Online)** do **Người 1 (Tech Lead)** xây dựng, phục vụ cho việc tích hợp và bàn giao cho các thành viên trong nhóm.

---

## 1. Sơ đồ Kiến trúc Tổng thể (System Overview)

Dưới đây là sơ đồ tương tác giữa Client (Next.js Apps), Reverse Proxy (Nginx), Backend (ASP.NET Core API) và Database Layer (MongoDB & Redis).

```mermaid
graph TD
    %% Clients
    subgraph Clients ["Client Applications"]
        AdminApp["Next.js Admin Portal<br/>(Người 4 - Port 3001)"]
        StudentApp["Next.js Reader Portal<br/>(Người 5 - Port 3000)"]
    end

    %% Gateway
    subgraph Gateway ["Reverse Proxy Gateway"]
        Nginx["Nginx Gateway<br/>(Port 80)"]
    end

    %% Backend Services
    subgraph Backend ["Core API Service (.NET 9)"]
        API["ASP.NET Core API<br/>(Port 5000)"]
        
        %% Components
        AuthGuard["AuthGuard Filter<br/>(JWT & RBAC Check)"]
        RateLimiter["RateLimit Middleware<br/>(Sliding Window)"]
        AuditLog["AuditLog Middleware<br/>(Mutation Tracking)"]
        ErrorHandler["Exception Handling Middleware"]
        
        API --> RateLimiter
        RateLimiter --> ErrorHandler
        ErrorHandler --> AuthGuard
        AuthGuard --> AuditLog
    end

    %% Cache & DB
    subgraph Databases ["Polyglot Database Layer"]
        Redis[("Redis Cache<br/>(Port 6379)")]
        MongoDB[("MongoDB Primary DB<br/>(Port 27017)")]
    end

    %% Relations
    AdminApp -->|HTTP Requests| Nginx
    StudentApp -->|HTTP Requests| Nginx
    Nginx -->|Proxy Pass| API

    %% DB Interactions
    AuthGuard -->|Read/Write Session & Permissions| Redis
    RateLimiter -->|Sliding Window Counter| Redis
    
    API -->|CRUD Operations| MongoDB
    AuthGuard -->|Cache Miss: Fetch Permissions| MongoDB
    AuditLog -->|Persist Audit Logs| MongoDB
```

---

## 2. Luồng Dữ liệu Phân Quyền (RBAC Flow with Cache)

Hệ thống sử dụng cơ chế **Polyglot Persistence** kết hợp giữa MongoDB (lưu trữ lâu dài) và Redis (cache hiệu năng cao) để tối ưu hóa việc phân quyền:

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant AuthGuard as AuthGuard (API)
    participant Redis as Redis Cache
    participant MongoDB as MongoDB

    Client->>AuthGuard: Gửi Request + Authorization Header (JWT Bearer)
    AuthGuard->>AuthGuard: Giải mã JWT, lấy UserId & SessionId
    
    AuthGuard->>Redis: Kiểm tra session có hợp lệ? (key: session:{sessionId})
    alt Session không tồn tại hoặc đã bị thu hồi
        Redis-->>AuthGuard: Session Invalid
        AuthGuard-->>Client: Trả về lỗi 401 Unauthorized
    end

    AuthGuard->>Redis: Lấy tập quyền hạn (key: permission:user:{userId})
    alt Cache Hit (Có trong Redis)
        Redis-->>AuthGuard: Trả về mảng Quyền (Permissions)
    else Cache Miss (Không có trong Redis)
        AuthGuard->>MongoDB: Truy vấn UserRoles + RolePermissions
        MongoDB-->>AuthGuard: Trả về danh sách Quyền của User
        AuthGuard->>Redis: Cache lại vào Redis (TTL: 10 phút)
    end

    AuthGuard->>AuthGuard: So khớp Quyền của API với Quyền của User
    alt User có quyền hợp lệ
        AuthGuard-->>Client: Cho phép đi tiếp vào Controller xử lý
    else User thiếu quyền
        AuthGuard-->>Client: Trả về lỗi 403 Forbidden
    end
```

---

## 3. Quy tắc lưu trữ Dữ liệu (Storage Strategy)

| Dữ liệu | Database chính | Cơ chế bổ trợ / Cache | Lý do chọn |
| :--- | :--- | :--- | :--- |
| **Tài khoản, Vai trò, Quyền hạn** | MongoDB | Cache danh sách quyền trên Redis | Truy vấn nhiều, ít thay đổi. Cần tốc độ đọc cao. |
| **Phiên làm việc (Auth Session)** | Redis | Lưu bản phụ ở MongoDB | Đăng xuất từ xa cần kiểm tra nhanh. Hết hạn tự hủy (TTL). |
| **Thông tin sách, chương** | MongoDB | Không (hoặc CDN ảnh bìa) | Tài liệu lớn (chương sách dài), tìm kiếm text search. |
| **Tiến trình đọc (Reading Progress)** | MongoDB | Lưu tạm thời trên Redis | Sinh viên cuộn trang liên tục (ghi dữ liệu tần suất cực cao). Lưu tạm trên Redis rồi sync định kỳ giúp tránh nghẽn MongoDB. |
| **Sách xu hướng (Trending)** | Redis Sorted Set | Sync thống kê sang MongoDB | Cần tính điểm lượt đọc/lượt mở trong ngày thời gian thực. Redis Sorted Set xử lý bảng xếp hạng cực tốt. |
| **Nhật ký hệ thống (Audit Log)** | MongoDB | Không | Dữ liệu ghi một lần (Write-once), chỉ đọc khi kiểm toán, không cần cache. |
