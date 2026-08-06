# Admin API-First Remediation Design

## Goal

Đưa toàn bộ các luồng quản trị hiện đang mock, fallback giả, lệch contract hoặc bảo mật chưa đúng trong LibraryHub về trạng thái **production-ready** theo nguyên tắc:

- mọi dữ liệu hiển thị là dữ liệu thật từ database
- frontend không tự xử lý business logic thay backend
- mọi upload ảnh đi qua backend
- backend validate, optimize và lưu metadata media thật
- admin/web/api dùng contract đồng bộ, rõ public vs protected vs admin
- loại bỏ các lỗ hổng auth/admin API nghiêm trọng hiện có

## Scope

### In scope

- Chuẩn hóa auth và admin authorization cho các API liên quan đến admin, media, payment admin, reviews moderation, notifications/email campaigns.
- Sửa flow Google login để backend verify Google token trước khi tạo session.
- Sửa forgot/reset password để không trả reset token về client.
- Chuẩn hóa route và request/response contract giữa backend, `apps/admin`, và `apps/web` cho các module đang lệch.
- Xây dựng một media upload pipeline duy nhất qua backend cho banner, media library, book cover, avatar và các ảnh quản trị trong phạm vi đang được dùng.
- Validate type/size/dimensions và optimize ảnh ở backend trước khi upload Cloudinary.
- Lưu metadata media thật trong database và dùng metadata đó để render/xóa/list.
- Xóa mock/default/fallback giả khỏi các trang admin đã xác định:
  - settings
  - email campaigns
  - reports
  - dashboard
  - reviews admin
  - roles/permissions admin
  - banners
  - flash sale
  - vouchers
  - media library
- Thêm hoặc chỉnh các admin report endpoints để dashboard/reports dùng dữ liệu thật từ DB thay vì số hardcode hoặc phép ghép approximation ở frontend.
- Đồng bộ lại reader/web consumers cho banner, flash sale, payment, review visibility và media consumer nếu bị ảnh hưởng bởi contract mới.
- Bổ sung test/backend verification cho các đường đi quan trọng của auth, permission, media và reporting.

### Out of scope

- Không redesign lại toàn bộ mô hình RBAC, role hierarchy hay permission taxonomy.
- Không thay đổi storage stack MongoDB/Redis hoặc chuyển sang dịch vụ khác.
- Không xây dựng một hệ thống Digital Asset Management nhiều phiên bản/transform pipeline phức tạp ngoài những profile cần cho banner, cover, avatar và generic media.
- Không xây dựng nền tảng email marketing nâng cao (segment automation, A/B test, drip campaign, provider failover).
- Không viết một analytics warehouse riêng hoặc hệ thống BI ngoài các report/aggregate endpoint cần để thay dữ liệu mock hiện có.
- Không mở rộng sang các module nghiệp vụ chưa liên quan trực tiếp đến các trang/admin flow đang không đạt yêu cầu.

## Current problems being solved

### Security problems

- `POST /api/auth/google` hiện cho phép đăng nhập chỉ bằng email mà không verify token Google ở server.
- `POST /api/auth/forgot-password` hiện tạo reset token rồi trả token đó về response.
- Các API admin payment (`all-orders`, `revenue-stats`) hiện không bị bảo vệ đúng mức.
- Media upload/delete hiện chưa yêu cầu admin permission phù hợp.
- Một số API promotions chỉ chặn bằng `[Authorize]` thay vì permission-based authorization.
- Endpoint email campaign hiện `AllowAnonymous` dù là hành động quản trị.

### Contract and behavior problems

- FE admin và BE đang lệch contract ở reviews, reports, roles, promotions.
- Có các page admin vừa gọi API thật vừa fallback local/default sample data.
- Có page admin catch lỗi API nhưng vẫn toast thành công như thể đã ghi DB.
- Settings và email campaign đang hiển thị như có thể dùng thật nhưng thực tế chưa persist đúng.
- Media upload đang bị chia hai đường: có chỗ upload qua backend, có chỗ upload thẳng Cloudinary demo.
- Reports/dashboard có chỉ số hardcoded hoặc approximation client-side thay vì aggregate thật.

## Design principles

1. **Backend owns business logic**: frontend chỉ gửi intent, file, bộ lọc hoặc tham số truy vấn; backend chịu trách nhiệm validate, authorize, transform và persist.
2. **No mock fallback on production paths**: nếu API lỗi thì UI hiển thị lỗi thật; không bơm dữ liệu giả hoặc success giả vào các đường đi thật.
3. **One contract per capability**: mỗi module có route và DTO rõ ràng; admin dùng admin contract, reader dùng public/reader contract.
4. **One upload pipeline**: mọi upload ảnh dùng cùng flow backend, chỉ khác profile xử lý và metadata.
5. **Clear trust boundaries**: public route, authenticated reader route và admin route phải tách rõ để tránh FE dựa vào assumptions sai.
6. **Targeted change only**: chỉ cải tổ những vùng cần để đạt production-readiness cho admin/API hiện có, không refactor lan man.

## Target architecture

## 1. Route layering and trust boundary

API sẽ được phân lớp theo ý nghĩa nghiệp vụ và mức tin cậy:

- **Public reader routes**: dữ liệu công khai như banner active, flash sale current, book browsing, voucher apply nếu thực sự là public action hợp lệ.
- **Authenticated reader routes**: profile, reading progress, payment QR creation, my orders, user review CRUD, notification inbox.
- **Admin routes**: settings, campaign sending, reviews moderation, roles/permissions, promotions management, media management, admin reports, payment admin views.

Với các khu vực đang hỗn hợp public/admin, ưu tiên đưa các thao tác quản trị về namespace rõ ràng kiểu `api/admin/...` để frontend không còn nhầm route reader với route quản trị. Các route cũ có thể giữ tạm thời trong bước chuyển nếu thật sự cần cho compatibility nội bộ, nhưng mục tiêu cuối là admin pages gọi trực tiếp contract admin mới.

## 2. Authorization model

- Các route admin phải dùng `RequirePermission(...)` hoặc `RequireAnyPermission(...)`, không chỉ `[Authorize]`.
- Các nhóm quyền tối thiểu cần siết lại trong đợt này:
  - promotions management
  - media management
  - payment admin read/reporting
  - review moderation
  - notification/email broadcast
  - settings read/update
  - role create/update/assign permission
- `apps/admin` vẫn giữ `AuthGate` cho session check, nhưng UI admin cũng phải đọc profile/permissions thật và ẩn/chặn các thao tác nếu user không đủ quyền. Đây chỉ là UX layer; backend vẫn là nguồn enforcement chính.

## 3. Auth hardening design

### Google login

`POST /api/auth/google` sẽ chuyển sang nhận Google credential/token thực sự từ frontend. Backend phải:

1. verify token với Google
2. xác nhận audience/client phù hợp cấu hình
3. lấy subject/email đã verify từ provider response
4. mới tra/tạo local user
5. mới tạo session nội bộ của LibraryHub

Không dùng email gửi từ client làm nguồn tin cậy trực tiếp.

### Forgot/reset password

- `forgot-password` chỉ trả thông điệp trung tính, không trả token.
- reset token được tạo, lưu và dùng nội bộ server-side.
- flow gửi token/mã xác minh đi qua email sending backend thực tế.
- token bị vô hiệu hóa sau khi reset thành công hoặc hết hạn.

## 4. API contract normalization

### Reviews admin

Tách riêng admin moderation khỏi reader review listing.

Admin contract mục tiêu:

- `GET /api/admin/reviews`
- `PATCH /api/admin/reviews/{id}/status`
- `DELETE /api/admin/reviews/{id}`

Các endpoint này trả/filter/paginate theo nhu cầu quản trị, không ép admin page phải dùng chung endpoint public đang yêu cầu `bookId`.

### Reports and dashboard

Frontend admin không còn tự ghép số từ nhiều API rời và không còn dùng dữ liệu hardcoded. Backend sẽ cung cấp report contracts rõ hơn, ví dụ:

- `GET /api/admin/reports/dashboard-summary`
- `GET /api/admin/reports/revenue-summary`
- `GET /api/admin/reports/borrowing-trend`
- `GET /api/admin/reports/status-breakdowns`

Implementation có thể gộp hoặc tách endpoint tùy tổ chức service, nhưng frontend sẽ chỉ đọc dữ liệu tổng hợp thật từ backend.

### Roles and permissions

Admin role management sẽ dùng đầy đủ contract thật cho:

- list roles
- create role
- update role
- list permissions
- assign/remove permission to role
- assign/remove role for user

Không giữ modal cấu hình permission chỉ cập nhật local state.

### Settings

Frontend settings phải map trực tiếp vào `SystemSettings` read/write API. Nếu cần nhóm key theo scope (`EMAIL`, `SEPAY`, `CLOUDINARY`, `BORROWING_POLICY`) thì grouping nằm ở tầng DTO/service, không nằm ở mock state của page.

## 5. Media pipeline design

## Single ingestion pipeline

Backend sẽ có một upload flow thống nhất cho admin media:

- `POST /api/admin/media/upload`
- `GET /api/admin/media`
- `GET /api/admin/media/{id}` nếu cần cho detail/reference
- `DELETE /api/admin/media/{id}`

Frontend gửi file và metadata tối thiểu như `category`, `usageType`, `alt/title` nếu có. Backend chịu trách nhiệm:

1. authorize user
2. validate MIME type
3. validate file size
4. decode ảnh an toàn
5. validate dimensions hợp lệ
6. chọn optimization profile theo `usageType`
7. resize/compress/convert trước khi upload Cloudinary
8. upload bằng Cloudinary credentials server-side
9. persist metadata vào DB
10. trả record media chuẩn cho frontend dùng lại

## Usage profiles

Ít nhất hỗ trợ các profile sau trong scope này:

- `banner`
- `book-cover`
- `avatar`
- `generic-media`

Mỗi profile có thể có giới hạn max width/height và mức nén khác nhau. Mục tiêu không phải xây một transformation engine toàn năng, mà là áp dụng policy phù hợp cho các loại ảnh đang dùng.

## Media persistence

Mỗi asset được quản lý như một bản ghi thật trong DB, ví dụ dựa trên `FileAsset` hiện có hoặc một entity media/file thống nhất. Metadata cần đủ để các page admin và web không phải tự suy từ URL:

- id
- cloudinary public id
- secure url
- original file name
- width / height
- byte size
- mime type / format
- category / usage type
- uploaded by
- created at
- optional reference metadata

Delete media phải đi qua media record id hoặc identifier server-side rõ ràng, không để FE truyền thẳng URL rồi backend phải suy diễn mơ hồ từ đó.

## 6. Admin module remediation design

### Settings

- Page settings load dữ liệu thật từ backend theo các nhóm cấu hình.
- Save action persist thật, không `setTimeout` giả.
- Với các giá trị nhạy cảm như secrets, backend DTO có thể hỗ trợ hiển thị masked value và update theo semantics rõ ràng (ví dụ gửi giá trị mới thì thay, để trống thì giữ nguyên) để tránh FE phải giữ secret thật trong state một cách không cần thiết.

### Email campaigns

Admin email module sẽ được đưa về trạng thái thật ở mức vừa đủ cho scope này:

- persist campaign thật
- load subscriber thật
- send campaign thật qua backend
- persist send history / status ở mức hợp lý
- bỏ success giả khi API thất bại

Không đi xa đến automation/segmentation phức tạp. Trọng tâm là từ UI tới backend và DB đều là thật.

### Roles and permissions

- Role list đọc thật từ DB.
- Tạo role dùng API thật.
- Permission config modal đọc permission thật và lưu thật.
- Assign role cho user dùng API thật và refresh state từ response/GET sau mutation.

### Reviews admin

- Dùng admin review endpoints riêng.
- Hỗ trợ filter, paging, status, moderation và delete theo contract thật.
- Không fallback sample data nếu endpoint lỗi.

### Promotions

#### Banners
- Reader homepage dùng endpoint public/banner active phù hợp.
- Admin banners page dùng admin endpoints riêng cho list/create/update/status/delete/reorder nếu cần.
- Upload ảnh banner dùng media backend pipeline.

#### Flash sale
- Tách current public flash sale cho homepage và admin management routes cho CRUD/status.
- Không fallback `DEFAULT_FLASH_SALES` ở admin path.

#### Vouchers
- Reader/public flow cho apply voucher tách khỏi admin CRUD.
- Admin voucher page dùng DB thật, error thật, mutation thật.

### Media library

- Load asset list từ DB thật.
- Upload tất cả qua backend.
- Delete qua backend dùng media record id.
- Category filter dựa trên metadata thật đã persist.

### Reports and dashboard

- Dashboard stat cards, trend chart, revenue blocks, breakdown tables đều đọc từ aggregate/report API thật.
- Loại bỏ toàn bộ số hardcoded và approximate fallback dùng để “trám” khi backend chưa có dữ liệu tổng hợp.
- Nếu một chỉ số chưa thể tính đúng với hiệu năng chấp nhận được, backend phải quyết định cách tính chuẩn và trả rõ semantics; frontend không tự bịa dữ liệu để lấp UI.

## 7. Reporting design

Backend sẽ gom các phép tính report cần thiết về service/controller dành cho admin. Tối thiểu cần bao phủ:

- total books
- total users
- active borrowings
- overdue borrowings
- borrowing trend theo ngày
- payment revenue summary
- payment order status counts
- fine summary
- book/user/borrowing status breakdowns

Mục tiêu là frontend admin không còn phải tự query nhiều endpoint rời rồi suy luận bằng heuristic. Các aggregate này đọc từ MongoDB thật, và nếu cần có thể tận dụng Redis cho cache ngắn hạn trong tương lai, nhưng việc thêm cache không bắt buộc trong đợt này.

## 8. Cross-app consistency

`apps/admin` và `apps/web` phải cùng tuân theo contract backend mới ở các vùng bị ảnh hưởng:

- banner / flash sale consumer trên homepage reader
- payment modal / order status / access check
- review visibility/moderation state
- avatar/book cover/media consumption
- auth flows liên quan Google login hoặc reset password

Các client API wrapper typed sẽ được cập nhật trước, sau đó pages/components dùng wrapper đó. Điều này giúp giảm việc sửa contract rải rác trực tiếp trong component.

## Implementation phases

## Phase 1 — Security and contract foundation

- Harden auth flows.
- Siết permission cho admin routes.
- Tạo/chuẩn hóa admin contracts cho reviews, reports, roles, settings, payment admin, notifications/email campaign.
- Cập nhật frontend API wrappers để dùng contract mới.

**Success condition:** backend là nguồn authority đúng và route/DTO nền tảng đã chốt.

## Phase 2 — Shared media pipeline

- Xây upload/list/delete media backend.
- Tích hợp Cloudinary server-side + image optimization.
- Persist metadata media thật.
- Chuyển banners/media library và các uploader trong scope sang flow backend thống nhất.

**Success condition:** không còn upload ảnh trực tiếp từ FE ở các luồng trong scope.

## Phase 3 — Admin de-mock modules

- Remediate settings, email campaigns, reviews admin, roles/permissions, promotions, media library.
- Loại bỏ mock/default/fallback giả.
- Mutation path phải báo lỗi thật nếu BE thất bại.

**Success condition:** admin pages trong scope đều đọc/ghi DB thật.

## Phase 4 — Reporting, consistency, regression

- Hoàn thiện report aggregates thật.
- Sửa admin dashboard/reports.
- Đồng bộ reader/web consumers bị ảnh hưởng.
- Chạy verification và tests.

**Success condition:** số liệu admin là số liệu thật và các app còn lại vẫn hoạt động đúng trên contract mới.

## Risks and mitigations

### Breaking contract risk

**Risk:** đổi route/DTO làm hỏng đồng thời admin và web.

**Mitigation:** cập nhật typed API modules trước, sau đó mới thay component/page; rollout theo phase thay vì sửa mọi page cùng lúc.

### Media optimization risk

**Risk:** resize/compress sai profile làm giảm chất lượng hoặc hỏng use case.

**Mitigation:** profile riêng cho banner/cover/avatar/generic, giới hạn và policy rõ ngay từ backend service.

### Email scope explosion

**Risk:** email campaigns biến thành một dự án marketing system lớn.

**Mitigation:** chỉ làm campaign, subscriber, send, history và persistence cần để page admin là thật.

### Reporting complexity risk

**Risk:** tổng hợp số liệu từ nhiều collection làm implementation kéo dài.

**Mitigation:** chỉ triển khai các aggregate cần để thay toàn bộ số hardcoded hiện có; không mở rộng BI ngoài scope.

### Auth UX change risk

**Risk:** thay đổi Google login/forgot password có thể ảnh hưởng login screens.

**Mitigation:** sửa đồng thời backend và FE, test end-to-end từng flow sau khi chốt contract.

## Testing strategy

### Backend tests

- Verify Google login rejects unverified/fake credential input.
- Verify forgot-password no longer returns reset token.
- Verify reset token expiry/invalid reuse behavior.
- Verify admin endpoints reject non-admin/non-permitted users.
- Verify public endpoints remain accessible where intended.
- Verify media upload validation for file type/size and optimized asset creation.
- Verify media delete acts on stored metadata/records correctly.
- Verify report endpoints return DB-derived aggregates.
- Verify reviews admin endpoints use correct moderation contract.

### Frontend verification

- Admin pages in scope load from real API without sample fallback.
- Failed mutations surface error state instead of success toast.
- Upload widgets use backend pipeline and render returned metadata.
- Dashboard/reports render API results without hardcoded placeholders.
- Reader homepage still loads banner/flash sale correctly.
- Payment flow still reaches success and unlocks access correctly.

### Regression checks

- `dotnet build` and relevant backend tests.
- Admin frontend build/lint/type checks if configured.
- Web frontend build/lint/type checks if configured.
- Manual smoke test for auth, media upload, promotions, settings, reviews moderation, reports.

## Acceptance criteria

- Không còn endpoint admin nhạy cảm trong scope này chỉ bảo vệ bằng `[Authorize]` nếu nghiệp vụ yêu cầu permission cụ thể.
- `POST /api/auth/google` chỉ đăng nhập sau khi server verify Google token hợp lệ.
- `POST /api/auth/forgot-password` không trả reset token hoặc mã xác minh về client.
- Payment admin APIs không còn public.
- Media upload/delete/list admin đi qua backend permission-based flow.
- Frontend admin/web trong scope dùng contract backend đồng bộ; không còn lệch body/query/route giữa FE và BE.
- Không còn fallback sample/default data trên các đường đi quản trị trong scope.
- Không còn success giả khi mutation API thất bại.
- Settings page persist thật vào DB.
- Email campaigns/subscribers/history dùng dữ liệu thật và send flow thật ở mức scope đã định.
- Reviews admin dùng admin moderation contract đúng.
- Role create/permission assign/role assignment là thao tác thật qua API.
- Banners, flash sale, vouchers và media library dùng dữ liệu thật từ DB.
- Dashboard/reports không còn số hardcoded và dùng aggregate/report API thật.
- Mọi upload ảnh trong scope đi qua backend, được validate/optimize, và lưu metadata thật.
- Reader-facing consumers bị ảnh hưởng vẫn hoạt động đúng sau khi đổi contract.

## File/area impact summary

### Backend
- `apps/api/Modules/Auth/**`
- `apps/api/Modules/Media/**`
- `apps/api/Modules/Payment/**`
- `apps/api/Modules/Promotions/**`
- `apps/api/Modules/Catalog/**` (reviews admin split)
- `apps/api/Modules/Notifications/**`
- `apps/api/Modules/System/**`
- `apps/api/Modules/Roles/**`
- `apps/api/Modules/Users/**`
- report aggregate service/controller area to be introduced or expanded
- media/file entity persistence area

### Admin frontend
- `apps/admin/src/lib/api-client.ts`
- typed API modules under `apps/admin/src/lib/api/**`
- `apps/admin/src/app/(admin)/settings/page.tsx`
- `apps/admin/src/app/(admin)/email-campaigns/page.tsx`
- `apps/admin/src/app/(admin)/reports/page.tsx`
- `apps/admin/src/app/(admin)/dashboard/page.tsx`
- `apps/admin/src/app/(admin)/reviews/page.tsx`
- `apps/admin/src/app/(admin)/roles/page.tsx`
- `apps/admin/src/app/(admin)/banners/page.tsx`
- `apps/admin/src/app/(admin)/flash-sale/page.tsx`
- `apps/admin/src/app/(admin)/vouchers/page.tsx`
- `apps/admin/src/app/(admin)/media/page.tsx`
- related upload forms/components

### Web frontend
- auth flows affected by Google/reset password
- homepage banner/flash sale consumers
- payment modal / payment status flows
- review consumers affected by moderation visibility
- avatar/cover/media consumers if using changed media records/contracts

## Success definition

Khi hoàn tất thiết kế này trong implementation, LibraryHub admin sẽ không còn là tập hợp các màn hình “demo thật giả lẫn lộn”, mà trở thành một hệ thống quản trị có backend authority rõ ràng, upload pipeline thống nhất, dữ liệu DB thật, route/DTO đồng bộ giữa các app, và các lỗ hổng admin/auth nổi bật đã được xử lý trong cùng một initiative.