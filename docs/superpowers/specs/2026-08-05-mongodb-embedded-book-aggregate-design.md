# MongoDB Embedded Book Aggregate Design

## Goal

Thiết kế lại catalog của LibraryHub theo đúng bản chất MongoDB document modeling cho đề tài **Hệ thống Quản lý Thư viện số và Đọc sách trực tuyến**: một document `books` chứa trọn aggregate của một cuốn sách, bao gồm metadata hiển thị, tác giả, thể loại, nhà xuất bản và toàn bộ chương/nội dung chương.

MongoDB là hệ quản trị dữ liệu chính. Redis chỉ phục vụ các dữ liệu có tính tạm thời hoặc cần truy cập nhanh như session, cache tiến trình đọc và bảng xếp hạng sách xu hướng.

## Scope

### In scope

- Thay đổi entity `Book` thành aggregate có các subdocument nhúng:
  - `authors[]`
  - `categories[]`
  - `publisher`
  - `chapters[]`
- Nhúng toàn bộ nội dung chương và paragraphs trong `books`.
- Viết lại seed để tạo complete book aggregate trong một lần insert.
- Viết lại repository/service cho việc đọc, tạo, sửa, archive, publish và reorder chapter trong mảng `books.chapters`.
- Điều chỉnh DTO mapping để book detail trả dữ liệu trực tiếp từ aggregate.
- Bỏ các module catalog độc lập không còn phù hợp với domain:
  - Author CRUD và collection `authors`
  - Category CRUD và collection `categories`
  - Publisher CRUD và collection `publishers`
  - Chapter collection `chapters`
  - Quan hệ trung gian `book_authors` và `book_categories`
- Cập nhật `MongoDbContext`, dependency injection, `IndexCreator` và các reference liên quan.
- Xóa/reset dữ liệu catalog cũ trong môi trường development trước khi seed schema mới.
- Bổ sung validation kích thước document và kiểm thử aggregate.

### Out of scope

- Không thay đổi mô hình auth/RBAC.
- Không thay đổi `book_copies`, borrowing, reservation, fine hoặc nghiệp vụ kho vật lý.
- Không thay đổi `reading_progress`, `reading_sessions`, `view_events`, reviews, notifications, audit logs hoặc system settings, ngoại trừ các reference tới `Book` cần compile và chạy đúng.
- Không chuyển dữ liệu tiến trình đọc hoặc dữ liệu trending từ MongoDB/Redis sang cấu trúc khác.
- Không giữ các API/UI CRUD độc lập cho author, category, publisher sau migration. Các thông tin này được quản lý trong form tạo/sửa sách.

## Domain decision

Một author, category hoặc publisher trong đề tài này là metadata gắn với sách, không phải aggregate độc lập. Chúng được lưu trực tiếp trong book dưới dạng embedded value object. Không lưu foreign key hoặc join collection cho catalog.

Một chapter chỉ thuộc đúng một book và luôn được đọc cùng book. Vì vậy chapter là embedded entity trong `Book.Chapters`, có `ChapterId` riêng để cập nhật/xóa/publish/reorder trong mảng.

Các dữ liệu có vòng đời hoặc tần suất ghi độc lập vẫn là collection riêng:

- `books`: catalog và digital content aggregate.
- `book_copies`: bản sao vật lý.
- `borrowings`, `borrowing_items`, `reservations`, `fines`: nghiệp vụ lưu thông.
- `reading_progress`: một bản ghi theo user/book.
- `reading_sessions`, `view_events`: event/time-series style data.
- `reviews`: nhiều người dùng ghi độc lập.
- auth/RBAC, notifications, audit logs, system settings.

## Target document shape

```json
{
  "_id": "book-id",
  "title": "Dế Mèn Phiêu Lưu Ký",
  "slug": "de-men-phieu-luu-ky",
  "isbn": "9786041000001",
  "summary": "Cuộc phiêu lưu của chú dế mèn",
  "language": "vi",
  "accessType": "FREE",
  "status": "PUBLISHED",
  "coverAssetId": "cover-url-or-asset-id",
  "authors": [
    {
      "authorId": "embedded-author-id",
      "name": "Tô Hoài",
      "slug": "to-hoai",
      "role": "AUTHOR",
      "order": 1
    }
  ],
  "categories": [
    {
      "categoryId": "embedded-category-id",
      "name": "Văn học",
      "slug": "van-hoc"
    }
  ],
  "publisher": {
    "publisherId": "embedded-publisher-id",
    "name": "Nhà xuất bản Kim Đồng",
    "slug": "nxb-kim-dong"
  },
  "chapters": [
    {
      "chapterId": "chapter-01",
      "number": 1,
      "title": "Tôi sống độc lập từ thuở bé",
      "summary": "...",
      "content": {
        "introduction": "...",
        "paragraphs": [
          {
            "paragraphId": "paragraph-01",
            "order": 1,
            "text": "Bởi tôi ăn uống điều độ..."
          }
        ],
        "conclusion": "..."
      },
      "wordCount": 2350,
      "readingTime": 12,
      "status": "PUBLISHED",
      "createdBy": "system",
      "createdAt": "2026-08-05T00:00:00Z",
      "updatedAt": "2026-08-05T00:00:00Z",
      "publishedAt": "2026-08-05T00:00:00Z"
    }
  ],
  "totalChapters": 1,
  "stats": {
    "viewCount": 0,
    "readingCount": 0,
    "rating": 0,
    "ratingCount": 0
  },
  "createdBy": "system",
  "createdAt": "2026-08-05T00:00:00Z",
  "updatedAt": "2026-08-05T00:00:00Z"
}
```

`authorId`, `categoryId`, `publisherId` và `chapterId` là identity nội bộ của embedded object, không phải reference tới collection catalog. Chúng giúp update/reorder ổn định và giữ cho API có identifier rõ ràng.

## Application behavior

### Seed

1. Seed auth/RBAC, branch và các collection độc lập như hiện tại.
2. Không tạo collection author/category/publisher/chapter.
3. Dựng danh sách metadata embedded trong code seed.
4. Dựng mỗi book cùng danh sách chapters và content hoàn chỉnh.
5. Insert complete books bằng `InsertManyAsync`.
6. `TotalChapters` được tính từ số chapter được seed, không cần bước update thứ hai.
7. Seed phải idempotent: nếu `books` đã có dữ liệu thì không chèn trùng; development reset phải xóa catalog cũ trước khi chạy seed schema mới.

### Book reads

- `GET /api/books`, search và filter truy vấn trực tiếp fields của `books`.
- Filter tác giả dùng `authors.authorId` hoặc `authors.slug`.
- Filter category dùng `categories.categoryId` hoặc `categories.slug`.
- Filter publisher dùng `publisher.publisherId` hoặc `publisher.slug`.
- Book detail trả embedded metadata và danh sách chapter từ một document, không gọi repository khác để ghép tên.
- `GET /api/books/{bookId}/chapters` đọc `Book.Chapters`, sort theo `number`.
- `GET /api/books/{bookId}/chapters/{chapterId}` tìm chapter trong mảng embedded.
- `GET /api/books/{bookId}/chapters/{chapterId}/content` trả content của chapter embedded.

### Chapter writes

Các route chapter hiện có được giữ nếu frontend đang dùng, nhưng implementation chuyển sang `books`:

- Create: kiểm tra book tồn tại, kiểm tra `number` chưa dùng trong cùng book, tạo `ChapterId`, tính word count/reading time, push vào `chapters`, tăng `totalChapters`.
- Update: cập nhật đúng phần tử bằng filter `_id + chapters.chapterId`; nếu đổi number thì kiểm tra uniqueness trong cùng book.
- Publish: set status và publishedAt của embedded chapter.
- Archive/delete: set status `ARCHIVED`, không xóa vật lý chapter khỏi aggregate.
- Reorder: validate danh sách chapter IDs thuộc đúng book và không trùng, sau đó thay mảng theo thứ tự mới; number được chuẩn hóa từ 1.
- Mọi update chapter phải cập nhật `Book.UpdatedAt`.
- Chapter không tồn tại hoặc không thuộc book trả 404; chapter number trùng trả 400/conflict theo convention hiện tại.

### Book writes

- Create/update book nhận embedded authors/categories/publisher trong request DTO thay cho IDs và lookup.
- Update không còn gọi AuthorRepository, CategoryRepository hoặc PublisherRepository.
- Book response map trực tiếp embedded object.
- Delete/archive book không cascade sang catalog collection vì không còn collection catalog riêng.

## Size and validation policy

MongoDB giới hạn một BSON document ở 16 MB. Vì chapters chứa content, implementation phải:

- Tính kích thước BSON dự kiến trước khi insert/update aggregate.
- Dùng ngưỡng ứng dụng thấp hơn 16 MB để chừa khoảng an toàn cho metadata và tăng trưởng, cụ thể `12 MB`.
- Từ chối create/update nếu vượt ngưỡng bằng lỗi validation rõ ràng, không ghi document dở dang.
- Kiểm thử một aggregate sát ngưỡng và một aggregate vượt ngưỡng.
- Không tạo cơ chế tự tách chapter sang collection khác trong scope này; nếu dữ liệu tương lai vượt 12 MB thì phải điều chỉnh domain model trong một thiết kế riêng.

## Indexes

Giữ các index cần cho aggregate:

- `books.slug` unique.
- `books.isbn` sparse/unique theo convention hiện tại nếu ISBN không bắt buộc.
- Text index trên `books.title` và `books.summary`.
- `books.status`, `books.accessType`, `books.createdAt` cho list/filter/sort.
- `books.authors.authorId`, `books.authors.slug` nếu query filter dùng các field này.
- `books.categories.categoryId`, `books.categories.slug` nếu query filter dùng các field này.
- `books.publisher.publisherId`, `books.publisher.slug` nếu query filter dùng các field này.
- Không tạo index collection `chapters`, `book_authors`, `book_categories`, `authors`, `categories`, `publishers` sau khi các collection này được loại bỏ.

## Cleanup and data transition

Đây là redesign schema cho môi trường phát triển, không phải migration production backward-compatible. Trước khi seed schema mới:

- Xóa collections catalog cũ nếu tồn tại.
- Xóa các entity/repository/DI registrations không còn sử dụng.
- Không xóa collection độc lập ngoài scope.
- Seed lại database từ đầu và ghi log rõ số book, số chapter embedded, số collection đã cleanup.
- Kiểm tra không còn code đọc `Chapter` collection hoặc các join collection.

Nếu triển khai production sau này, cần một migration riêng có backup, dry-run, count reconciliation và rollback; migration production không nằm trong scope này.

## Testing strategy

### Unit tests

- Serialize/deserialize `Book` với authors, categories, publisher, chapters và nested paragraphs.
- Create chapter từ chối chapter number trùng.
- Update chapter không cập nhật nhầm book khác.
- Publish/archive chapter cập nhật đúng embedded element.
- Reorder từ chối IDs thiếu/thừa/trùng và chuẩn hóa number.
- Tính word count/reading time.
- Size guard từ chối aggregate vượt 12 MB.

### Integration tests

- Seed database tạo book aggregate và không tạo catalog collections độc lập.
- Book detail trả metadata + chapters từ một document.
- Chapter list/content đọc đúng từ embedded array.
- Create/update/publish/archive/reorder chapter cập nhật đúng `books`.
- Search/filter theo embedded author/category/publisher.
- Existing reading progress và book copy flows vẫn dùng `bookId` bình thường.

### Regression checks

- `dotnet build apps/api/api.csproj`.
- Chạy test backend hiện có.
- Kiểm tra startup seed idempotency bằng cách chạy ứng dụng hai lần.
- Kiểm tra frontend contract cho các route sách/đọc sách trước khi xóa API catalog độc lập.

## Acceptance criteria

- Không còn `authors`, `categories`, `publishers`, `chapters`, `book_authors`, `book_categories` trong schema runtime sau reset/seed.
- Một document `books` chứa đủ metadata catalog và toàn bộ chapter/content của sách.
- Không còn join/lookup repository để dựng book detail.
- CRUD chapter hoạt động trên embedded array và giữ nguyên các route cần thiết cho reader/admin.
- Seed chạy idempotent và không cần bước insert chapter riêng.
- Aggregate bị từ chối trước khi vượt ngưỡng 12 MB.
- Build và test backend pass; các warning tồn tại phải được phân loại là pre-existing hoặc được xử lý trong phạm vi thay đổi.
- Không ảnh hưởng dữ liệu/luồng Redis reading progress, trending và các collection nghiệp vụ độc lập.
