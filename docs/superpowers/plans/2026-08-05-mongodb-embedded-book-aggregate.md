# MongoDB Embedded Book Aggregate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the relational-style catalog schema with a MongoDB `books` aggregate that embeds author/category/publisher metadata and every chapter/content document, while preserving independent library, reading, Redis, review, and audit workflows.

**Architecture:** `Book` becomes the only catalog/digital-content aggregate. Embedded value objects (`BookAuthorSnapshot`, `BookCategorySnapshot`, `BookPublisherSnapshot`) and embedded entities (`BookChapter`, `ChapterContent`, `Paragraph`) are stored inside one `books` document; chapter CRUD updates that document atomically. Standalone collections and repositories for authors, categories, publishers, chapters, and join tables are removed, while collections with independent lifecycles remain unchanged.

**Tech Stack:** ASP.NET Core/.NET 9, MongoDB.Driver, MongoDB BSON serialization, Redis, xUnit, FluentAssertions, ASP.NET Core integration testing

## Global Constraints

- MongoDB is the primary database; Redis remains responsible for sessions, reading-progress cache, and trending data.
- `books` must embed `authors[]`, `categories[]`, `publisher`, `chapters[]`, chapter content, and paragraphs.
- Remove standalone catalog collections and code: `authors`, `categories`, `publishers`, `chapters`, `book_authors`, and `book_categories`.
- Do not change auth/RBAC, book copies, borrowing, reservations, fines, reading progress, reading sessions, view events, reviews, notifications, audit logs, or system settings except for compile-safe `Book` references.
- The application aggregate-size guard is exactly 12 MB; reject writes before MongoDB's 16 MB BSON limit.
- Preserve the existing book/reader routes where they are still needed; chapter routes operate on embedded chapters.
- Development reset may delete only the six removed catalog collections; never delete unrelated collections.
- Seed must be idempotent and insert complete book aggregates without a separate chapter seed/update pass.
- Do not create a fallback chapter collection or hybrid overflow model in this implementation.

---

## File map

**Modify:**
- `apps/api/Database/Entities/Book.cs` — replace foreign-key arrays and publisher ID with embedded catalog and chapter properties.
- `apps/api/Database/Entities/Chapter.cs` — remove standalone MongoDB entity usage; move reusable nested content types into embedded book model files or delete after references are migrated.
- `apps/api/Database/MongoDbContext.cs` — expose only `Books` for catalog/digital content; remove six obsolete collection properties.
- `apps/api/Database/Indexes/IndexCreator.cs` — remove obsolete collection indexes and add embedded-field indexes.
- `apps/api/Database/Seed/SeedRunner.cs` — seed complete embedded book documents and clean removed collections in development.
- `apps/api/Repositories/Interfaces/IBookRepository.cs` — add embedded chapter operations and remove chapter-count-only API that is no longer needed.
- `apps/api/Repositories/Implementations/BookRepository.cs` — implement embedded metadata filtering and atomic chapter updates.
- `apps/api/Modules/Catalog/DTOs/Requests/CreateBookDto.cs` — accept embedded author/category/publisher values.
- `apps/api/Modules/Catalog/DTOs/Requests/UpdateBookDto.cs` — accept embedded metadata updates.
- `apps/api/Modules/Catalog/DTOs/Responses/BookResponseDto.cs` — return embedded metadata and chapter summaries.
- `apps/api/Modules/Catalog/Services/BookService.cs` — map embedded values directly and remove author/category/publisher repository dependencies.
- `apps/api/Modules/DigitalContent/DTOs/ChapterDtos.cs` — use embedded chapter/content types and preserve route contracts.
- `apps/api/Modules/DigitalContent/Services/ChapterService.cs` — operate on `Book.Chapters` through `IBookRepository`.
- `apps/api/Modules/DigitalContent/Controllers/ChaptersController.cs` — pass both `bookId` and `chapterId` consistently to service methods and preserve reader/admin responses.
- `apps/api/Program.cs` — remove obsolete service/repository registrations.
- `apps/admin/src/lib/api/books.ts` — replace ID-only book input/output types with embedded metadata contracts.
- `apps/admin/src/components/books/book-form.tsx` — submit embedded author/category/publisher snapshots and stop calling removed catalog CRUD endpoints.
- `apps/admin/src/app/(admin)/categories/page.tsx` — remove the standalone author/category CRUD screen because those resources are now book metadata.
- `apps/admin/src/lib/api/authors.ts` — delete after admin references are removed.
- `apps/admin/src/lib/api/categories.ts` — delete after admin references are removed; keep reader-specific category browsing logic in its own client.
- `apps/admin/src/components/categories/author-form-modal.tsx` — delete after the standalone catalog screen is removed.
- `apps/admin/src/components/categories/category-form-modal.tsx` — delete after the standalone catalog screen is removed.
- `apps/web/src/lib/api/books.ts`, `apps/web/src/lib/api/categories.ts`, category pages, and book types — browse/filter using embedded book categories or the books search endpoint rather than standalone `/api/categories` data.
- Any remaining files found by compile/search that directly reference removed catalog entities or repositories — migrate to embedded `Book` values or remove only if the endpoint is explicitly out of scope.

The admin and reader applications are part of this schema migration: deleting backend catalog CRUD without updating these contracts is not an acceptable partial implementation.

**Delete after references are migrated:**
- `apps/api/Database/Entities/Author.cs`
- `apps/api/Database/Entities/Category.cs`
- `apps/api/Database/Entities/Publisher.cs`
- `apps/api/Database/Entities/BookAuthor.cs`
- `apps/api/Database/Entities/BookCategory.cs`
- `apps/api/Repositories/Interfaces/IAuthorRepository.cs`
- `apps/api/Repositories/Interfaces/ICategoryRepository.cs`
- `apps/api/Repositories/Interfaces/IPublisherRepository.cs`
- `apps/api/Repositories/Implementations/AuthorRepository.cs`
- `apps/api/Repositories/Implementations/CategoryRepository.cs`
- `apps/api/Repositories/Implementations/PublisherRepository.cs`
- `apps/api/Modules/Catalog/Services/IAuthorService.cs`
- `apps/api/Modules/Catalog/Services/AuthorService.cs`
- `apps/api/Modules/Catalog/Services/CategoryService.cs`
- `apps/api/Modules/Catalog/Services/PublisherService.cs`
- `apps/api/Modules/Catalog/Controllers/AuthorsController.cs`
- `apps/api/Modules/Catalog/Controllers/CategoriesController.cs`
- `apps/api/Modules/Catalog/Controllers/PublishersController.cs`
- `apps/api/Database/Entities/Chapter.cs` only after `ChapterContent`, `Paragraph`, and all DTO mappings are moved to embedded model types.
- Any author/category/publisher DTOs and validators used only by the deleted CRUD endpoints.

**Create:**
- `apps/api/Database/Entities/BookEmbeddedModels.cs` — `BookAuthorSnapshot`, `BookCategorySnapshot`, `BookPublisherSnapshot`, `BookChapter`, and nested content types with BSON attributes.
- `apps/api/Common/Validation/BookDocumentSizeGuard.cs` — BSON-size validation against the 12 MB application threshold.
- `apps/api.Tests/apps.api.Tests.csproj` — xUnit test project referencing the API project and test packages.
- `apps/api.Tests/Database/BookEmbeddedModelTests.cs` — BSON round-trip and nested model tests.
- `apps/api.Tests/Common/BookDocumentSizeGuardTests.cs` — under/over 12 MB tests.
- `apps/api.Tests/Repositories/EmbeddedChapterRepositoryTests.cs` — repository filter/update behavior tests using a test MongoDB fixture or repository abstraction.
- `apps/api.Tests/Modules/ChapterServiceTests.cs` — duplicate, publish, archive, reorder, and word-count behavior tests.
- `apps/api.Tests/Database/SeedRunnerTests.cs` — complete aggregate/idempotency/cleanup tests where the test infrastructure supports MongoDB.
- `apps/api.Tests/TestSupport/TestBooks.cs` — concrete builders for books, chapters, content, and generated paragraph payloads used by all tests.
- `apps/api.Tests/TestSupport/MongoFixture.cs` — isolated MongoDB database fixture; tests skip with an explicit message when `MONGODB_TEST_CONNECTION_STRING` is unavailable.

---

## Task 1: Define embedded Book aggregate models and DTO contracts

**Files:**
- Create: `apps/api/Database/Entities/BookEmbeddedModels.cs`
- Modify: `apps/api/Database/Entities/Book.cs`
- Modify: `apps/api/Database/Entities/Chapter.cs` or delete after moving reusable nested types
- Modify: `apps/api/Modules/Catalog/DTOs/Requests/CreateBookDto.cs`
- Modify: `apps/api/Modules/Catalog/DTOs/Requests/UpdateBookDto.cs`
- Modify: `apps/api/Modules/Catalog/DTOs/Responses/BookResponseDto.cs`
- Modify: `apps/api/Modules/DigitalContent/DTOs/ChapterDtos.cs`
- Create: `apps/api.Tests/apps.api.Tests.csproj` — xUnit project referencing `apps/api/api.csproj` and test packages.
- Test: `apps/api.Tests/Database/BookEmbeddedModelTests.cs`

**Interfaces:**
- Produces `Book.Authors: List<BookAuthorSnapshot>`, `Book.Categories: List<BookCategorySnapshot>`, `Book.Publisher: BookPublisherSnapshot?`, `Book.Chapters: List<BookChapter>`, and `Book.TotalChapters`.
- Produces `BookChapter.ChapterId`, `Number`, `Title`, `Summary`, `Content`, `WordCount`, `ReadingTime`, `Status`, `CreatedBy`, `CreatedAt`, `UpdatedAt`, and `PublishedAt`.
- Produces DTOs that carry embedded metadata rather than `PublisherId`, `AuthorIds`, or `CategoryIds`.

- [ ] **Step 1: Write the failing BSON round-trip tests**

```csharp
[Fact]
public void Book_round_trips_embedded_metadata_and_chapters_through_bson()
{
    var book = TestBooks.WithOnePublishedChapter();

    var document = book.ToBsonDocument();
    var roundTripped = BsonSerializer.Deserialize<Book>(document);

    roundTripped.Authors.Should().ContainSingle(a => a.Name == "Tô Hoài");
    roundTripped.Categories.Should().ContainSingle(c => c.Slug == "van-hoc");
    roundTripped.Publisher!.Name.Should().Be("NXB Kim Đồng");
    roundTripped.Chapters.Should().ContainSingle(c => c.Content!.Paragraphs[0].Text.Contains("ăn uống"));
}

[Fact]
public void Book_chapter_identity_is_not_a_foreign_key_collection_reference()
{
    var chapter = TestBooks.WithOnePublishedChapter().Chapters.Single();

    chapter.ChapterId.Should().NotBeNullOrWhiteSpace();
    chapter.Number.Should().Be(1);
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `dotnet test apps/api.Tests/apps.api.Tests.csproj --filter FullyQualifiedName~BookEmbeddedModelTests`
Expected: FAIL because `Book` has no embedded metadata/chapter properties and the test project/models are not implemented.

- [ ] **Step 3: Add concrete test builders and implement the embedded model types**

Create `apps/api.Tests/TestSupport/TestBooks.cs` with concrete methods used by the tests (`WithOnePublishedChapter()`, `WithParagraphText(int bytes)`, `Chapter(int number)`, `WithChapter(string bookId, string chapterId)`) so every fixture in this plan compiles without placeholder helpers. Create `apps/api.Tests/TestSupport/MongoFixture.cs` with a unique database name, cleanup in `DisposeAsync`, and an explicit skip/assumption message when `MONGODB_TEST_CONNECTION_STRING` is absent.

Use BSON attributes with explicit field names. The core model must have this shape:

```csharp
public sealed class BookAuthorSnapshot
{
    [BsonElement("authorId")] public string AuthorId { get; set; } = Guid.NewGuid().ToString("N");
    [BsonElement("name")] public string Name { get; set; } = string.Empty;
    [BsonElement("slug")] public string Slug { get; set; } = string.Empty;
    [BsonElement("role")] public string Role { get; set; } = "AUTHOR";
    [BsonElement("order")] public int Order { get; set; }
}

public sealed class BookCategorySnapshot
{
    [BsonElement("categoryId")] public string CategoryId { get; set; } = Guid.NewGuid().ToString("N");
    [BsonElement("name")] public string Name { get; set; } = string.Empty;
    [BsonElement("slug")] public string Slug { get; set; } = string.Empty;
}

public sealed class BookPublisherSnapshot
{
    [BsonElement("publisherId")] public string PublisherId { get; set; } = Guid.NewGuid().ToString("N");
    [BsonElement("name")] public string Name { get; set; } = string.Empty;
    [BsonElement("slug")] public string Slug { get; set; } = string.Empty;
}

public sealed class BookChapter
{
    [BsonElement("chapterId")] public string ChapterId { get; set; } = Guid.NewGuid().ToString("N");
    [BsonElement("number")] public int Number { get; set; }
    [BsonElement("title")] public string Title { get; set; } = string.Empty;
    [BsonElement("summary")] public string? Summary { get; set; }
    [BsonElement("content")] public ChapterContent Content { get; set; } = new();
    [BsonElement("wordCount")] public int WordCount { get; set; }
    [BsonElement("readingTime")] public int ReadingTime { get; set; }
    [BsonElement("status")] public string Status { get; set; } = "DRAFT";
    [BsonElement("createdBy")] public string? CreatedBy { get; set; }
    [BsonElement("createdAt")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    [BsonElement("updatedAt")] public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    [BsonElement("publishedAt")] public DateTime? PublishedAt { get; set; }
}
```

Move `ChapterContent`, `Paragraph`, and any required nested content types into the embedded model file without changing JSON field names consumed by the reader. Remove `Book.PublisherId`, `Book.AuthorIds`, and `Book.CategoryIds`; add `Authors`, `Categories`, `Publisher`, and `Chapters`.

- [ ] **Step 4: Update request/response DTOs**

Replace ID-only catalog fields with embedded DTOs that map one-to-one to the model. Keep `ChapterContent` paragraph fields compatible with current reader payloads. A create request must accept `Authors`, `Categories`, `Publisher`, and optional `Chapters`; chapter creation continues to receive one chapter through the chapter route.

- [ ] **Step 5: Run the focused tests**

Run: `dotnet test apps/api.Tests/apps.api.Tests.csproj --filter FullyQualifiedName~BookEmbeddedModelTests`
Expected: PASS with all BSON fields and nested content preserved.

- [ ] **Step 6: Commit**

```bash
git add apps/api/Database/Entities apps/api/Modules/Catalog/DTOs apps/api/Modules/DigitalContent/DTOs apps/api.Tests
git commit -m "feat(api): add embedded MongoDB book aggregate models"
```

---

## Task 2: Add the aggregate size guard

**Files:**
- Create: `apps/api/Common/Validation/BookDocumentSizeGuard.cs`
- Create: `apps/api.Tests/Common/BookDocumentSizeGuardTests.cs`
- Modify: `apps/api/api.csproj` only if shared testable code requires a package already absent

**Interfaces:**
- Produces `BookDocumentSizeGuard.MaxBytes = 12 * 1024 * 1024`.
- Produces `BookDocumentSizeGuard.Validate(Book book)` that throws a domain validation exception before writes when `book.ToBson().Length > MaxBytes`.

- [ ] **Step 1: Write failing size-guard tests**

```csharp
[Fact]
public void Validate_accepts_book_below_12_mb()
{
    var book = TestBooks.WithParagraphText(11 * 1024 * 1024);

    Action act = () => BookDocumentSizeGuard.Validate(book);

    act.Should().NotThrow();
}

[Fact]
public void Validate_rejects_book_above_12_mb_before_write()
{
    var book = TestBooks.WithParagraphText(12 * 1024 * 1024 + 1);

    Action act = () => BookDocumentSizeGuard.Validate(book);

    act.Should().Throw<InvalidOperationException>()
        .WithMessage("Book document exceeds the 12 MB application limit*");
}
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `dotnet test apps/api.Tests/apps.api.Tests.csproj --filter FullyQualifiedName~BookDocumentSizeGuardTests`
Expected: FAIL because the guard does not exist.

- [ ] **Step 3: Implement the guard**

Serialize with `book.ToBson()`, compare byte length to exactly `12 * 1024 * 1024`, and throw before repository calls. Do not catch and ignore serialization failures.

- [ ] **Step 4: Run focused and build tests**

Run:
- `dotnet test apps/api.Tests/apps.api.Tests.csproj --filter FullyQualifiedName~BookDocumentSizeGuardTests`
- `dotnet build apps/api/api.csproj`

Expected: focused tests pass; API build has 0 errors.

- [ ] **Step 5: Commit**

```bash
git add apps/api/Common/Validation apps/api.Tests apps/api/api.csproj
git commit -m "feat(api): guard embedded book document size"
```

---

## Task 3: Rewrite BookRepository for embedded metadata and chapters

**Files:**
- Modify: `apps/api/Repositories/Interfaces/IBookRepository.cs`
- Modify: `apps/api/Repositories/Implementations/BookRepository.cs`
- Test: `apps/api.Tests/Repositories/EmbeddedChapterRepositoryTests.cs`

**Interfaces:**
- Preserve existing book reads/search/trending methods.
- Add exact methods:
  - `Task<BookChapter?> GetChapterByIdAsync(string bookId, string chapterId)`
  - `Task<List<BookChapter>> GetChaptersByBookIdAsync(string bookId)`
  - `Task<BookChapter?> GetChapterByNumberAsync(string bookId, int number)`
  - `Task<bool> AddChapterAsync(string bookId, BookChapter chapter)`
  - `Task<bool> ReplaceChapterAsync(string bookId, string chapterId, BookChapter chapter)`
  - `Task<bool> UpdateChapterAsync(string bookId, string chapterId, UpdateDefinition<Book> update)`
  - `Task<bool> ReplaceChaptersAsync(string bookId, IReadOnlyList<BookChapter> chapters)`
  - `Task<bool> ArchiveChapterAsync(string bookId, string chapterId)`

- [ ] **Step 1: Write failing repository behavior tests**

```csharp
[Fact]
public async Task AddChapter_pushes_into_the_book_aggregate_and_updates_total()
{
    var repository = Fixture.CreateBookRepositoryWithEmptyBook();

    var added = await repository.AddChapterAsync("book-1", TestBooks.Chapter(1));
    var book = await repository.GetByIdAsync("book-1");

    added.Should().BeTrue();
    book!.Chapters.Should().ContainSingle();
    book.TotalChapters.Should().Be(1);
}

[Fact]
public async Task GetChapter_requires_both_book_and_chapter_identity()
{
    var repository = Fixture.CreateRepositoryWithChapter("book-1", "chapter-1");

    (await repository.GetChapterByIdAsync("book-2", "chapter-1")).Should().BeNull();
}
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `dotnet test apps/api.Tests/apps.api.Tests.csproj --filter FullyQualifiedName~EmbeddedChapterRepositoryTests`
Expected: FAIL because the new repository methods and embedded filters do not exist.

- [ ] **Step 3: Implement embedded repository operations**

Use MongoDB filters matching both `_id == bookId` and `chapters.chapterId == chapterId`. Use `$push` plus `$inc` for create, positional `$set` for chapter replacement/status updates, and `$set` for the complete reordered chapter array plus `totalChapters` for reorder. Every update must also set `updatedAt`.

Change search filters from `CategoryIds`/`AuthorIds` to `AnyEq(b => b.Categories, snapshot => snapshot.CategoryId/Slug)` and equivalent author/publisher fields. Keep book-copy availability lookup unchanged. Apply `BookDocumentSizeGuard` before full-document replacement operations.

- [ ] **Step 4: Run focused repository tests**

Run: `dotnet test apps/api.Tests/apps.api.Tests.csproj --filter FullyQualifiedName~EmbeddedChapterRepositoryTests`
Expected: PASS with no chapter from a different book being returned or updated.

- [ ] **Step 5: Commit**

```bash
git add apps/api/Repositories apps/api.Tests/Repositories
 git commit -m "feat(api): persist chapters inside book aggregates"
```

---

## Task 4: Rewrite BookService and ChapterService behavior

**Files:**
- Modify: `apps/api/Modules/Catalog/Services/BookService.cs`
- Modify: `apps/api/Modules/DigitalContent/Services/ChapterService.cs`
- Modify: `apps/api/Modules/DigitalContent/Controllers/ChaptersController.cs`
- Modify: `apps/api/Modules/Catalog/Controllers/BooksController.cs` only if response/request route binding needs adjustment
- Create: `apps/api.Tests/Modules/ChapterServiceTests.cs`

**Interfaces:**
- `BookService` constructor depends on `IBookRepository` and logger only for catalog metadata mapping.
- `ChapterService` depends on `IBookRepository` and logger only; no `IChapterRepository` or separate book count repository.
- Chapter service methods use exact signatures:
  - `Task<BookChapter?> GetByIdAsync(string bookId, string chapterId)`
  - `Task<List<BookChapter>> GetByBookIdAsync(string bookId)`
  - `Task<ChapterContentDto?> GetContentAsync(string bookId, string chapterId)`
  - `Task<BookChapter> CreateAsync(string bookId, CreateChapterDto dto, string userId)`
  - `Task<BookChapter?> UpdateAsync(string bookId, string chapterId, UpdateChapterDto dto, string userId)`
  - `Task<BookChapter?> PublishAsync(string bookId, string chapterId, string userId)`
  - `Task<bool> DeleteAsync(string bookId, string chapterId)`
  - `Task<bool> ReorderChaptersAsync(string bookId, List<string> orderedChapterIds)`

- [ ] **Step 1: Write failing service tests**

```csharp
[Fact]
public async Task Create_rejects_duplicate_chapter_number_in_the_same_book()
{
    var service = Fixture.CreateChapterServiceWithChapter("book-1", number: 1);

    Func<Task> act = () => service.CreateAsync(
        "book-1",
        new CreateChapterDto { Number = 1, Title = "Duplicate", Content = TestContent.OneParagraph() },
        "admin");

    await act.Should().ThrowAsync<InvalidOperationException>()
        .WithMessage("Chapter number 1 already exists in this book.");
}

[Fact]
public async Task Reorder_normalizes_numbers_and_rejects_ids_from_another_book()
{
    var service = Fixture.CreateChapterServiceWithChapters("book-1", "chapter-1", "chapter-2");

    await service.ReorderChaptersAsync("book-1", new List<string> { "chapter-2", "chapter-1" });

    (await service.GetByIdAsync("book-1", "chapter-2"))!.Number.Should().Be(1);
}
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `dotnet test apps/api.Tests/apps.api.Tests.csproj --filter FullyQualifiedName~ChapterServiceTests`
Expected: FAIL because services still depend on standalone chapter repositories and old IDs.

- [ ] **Step 3: Implement BookService mapping**

Map `Book.Authors`, `Book.Categories`, `Book.Publisher`, and chapter summaries directly into response DTOs. Remove all calls to `IAuthorRepository`, `ICategoryRepository`, and `IPublisherRepository`. Create/update requests must copy embedded values and invoke `BookDocumentSizeGuard` through repository write paths.

- [ ] **Step 4: Implement ChapterService against the embedded repository contract**

For create, validate the book exists and chapter number uniqueness, calculate word count and reading time, assign a new `ChapterId`, then call `AddChapterAsync`. For update/publish/archive, load by both book/chapter IDs and call the corresponding atomic repository operation. Reorder must verify the supplied IDs are exactly the existing IDs with no duplicates, assign numbers `1..N`, and call `ReplaceChaptersAsync`.

- [ ] **Step 5: Update controller route binding**

Keep routes:
- `GET /api/books/{bookId}/chapters`
- `GET /api/books/{bookId}/chapters/{chapterId}`
- `GET /api/books/{bookId}/chapters/{chapterId}/content`
- `POST /api/books/{bookId}/chapters`
- `PUT /api/books/{bookId}/chapters/{chapterId}`
- `PATCH /api/books/{bookId}/chapters/{chapterId}/publish`
- `DELETE /api/books/{bookId}/chapters/{chapterId}`
- `PATCH /api/books/{bookId}/chapters/reorder`

Ensure every service call passes `bookId`; never allow a chapter ID alone to update a chapter in another book.

- [ ] **Step 6: Run service tests and build**

Run:
- `dotnet test apps/api.Tests/apps.api.Tests.csproj --filter FullyQualifiedName~ChapterServiceTests`
- `dotnet build apps/api/api.csproj`

Expected: tests pass; build has 0 errors.

- [ ] **Step 7: Commit**

```bash
git add apps/api/Modules apps/api.Tests/Modules
 git commit -m "feat(api): move chapter services to embedded books"
```

---

## Task 5: Rewrite seed and development catalog cleanup

**Files:**
- Modify: `apps/api/Database/Seed/SeedRunner.cs`
- Modify: `apps/api/Database/Indexes/IndexCreator.cs`
- Modify: `apps/api/Database/MongoDbContext.cs`
- Create/modify: `apps/api.Tests/Database/SeedRunnerTests.cs`

**Interfaces:**
- `SeedRunner.RunSeedAsync()` seeds books containing complete embedded metadata and chapters.
- Development cleanup is restricted to collection names: `authors`, `categories`, `publishers`, `chapters`, `book_authors`, `book_categories`.
- `MongoDbContext` no longer exposes obsolete collection properties.

- [ ] **Step 1: Write failing seed tests**

```csharp
[Fact]
public async Task Seed_creates_complete_books_without_standalone_catalog_collections()
{
    await Fixture.RunSeedAsync();

    var book = await Fixture.Database.GetCollection<Book>("books")
        .Find(Builders<Book>.Filter.Empty)
        .FirstAsync();

    book.Authors.Should().NotBeEmpty();
    book.Categories.Should().NotBeEmpty();
    book.Publisher.Should().NotBeNull();
    book.Chapters.Should().NotBeEmpty();
    (await Fixture.Database.ListCollectionNames().ToListAsync())
        .Should().NotContain(new[] { "authors", "categories", "publishers", "chapters", "book_authors", "book_categories" });
}
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `dotnet test apps/api.Tests/apps.api.Tests.csproj --filter FullyQualifiedName~SeedRunnerTests`
Expected: FAIL because current seed creates separate metadata/chapter collections.

- [ ] **Step 3: Implement catalog cleanup and embedded seed**

At the beginning of catalog seeding, drop only the six obsolete collections when running the configured development environment. Replace `SeedAuthorsAsync`, `SeedPublishersAsync`, `SeedCategoriesAsync`, `SeedBooksAsync`, and `SeedChaptersAsync` with metadata arrays and a single `SeedBooksAsync` that builds each `Book` and its `Chapters` before `InsertManyAsync`. Set `TotalChapters = book.Chapters.Count`; do not perform a second chapter insert or count/update pass. Preserve book copies by consuming the returned `books` list and their IDs.

Keep idempotency: if `Books` already contains data, return existing books and do not append duplicates. Log aggregate counts (`books`, embedded chapters) and cleanup collection names.

- [ ] **Step 4: Update index creation**

Delete index creation for author/category/publisher/join/chapter collections. Add indexes on `Books` for `Status`, `AccessType`, `CreatedAt`, embedded author/category/publisher IDs/slugs, and preserve unique slug, ISBN, and text indexes. Use explicit field definitions if strongly typed nested expressions are ambiguous.

- [ ] **Step 5: Run seed tests and build**

Run:
- `dotnet test apps/api.Tests/apps.api.Tests.csproj --filter FullyQualifiedName~SeedRunnerTests`
- `dotnet build apps/api/api.csproj`

Expected: seed tests pass; build has 0 errors.

- [ ] **Step 6: Commit**

```bash
git add apps/api/Database apps/api.Tests/Database
 git commit -m "feat(api): seed complete embedded book aggregates"
```

---

## Task 6: Update admin and reader contracts for embedded catalog metadata

**Files:**
- Modify: `apps/admin/src/lib/api/books.ts`
- Modify: `apps/admin/src/components/books/book-form.tsx`
- Modify: `apps/web/src/types/Book.ts`
- Modify: `apps/web/src/types/BookDetail.ts`
- Modify: `apps/web/src/lib/api/books.ts`
- Modify: `apps/web/src/lib/api/categories.ts` and category pages that currently call `/api/categories`
- Modify: admin book/chapter pages only where response field names or chapter URLs change
- Create: `apps/admin/src/lib/api/catalog-metadata.ts` — local embedded metadata option types/builders used by the book form, if the existing book response does not provide reusable options.
- Delete: `apps/admin/src/lib/api/authors.ts`
- Delete: `apps/admin/src/lib/api/categories.ts` after all admin references are removed
- Delete: `apps/admin/src/components/categories/author-form-modal.tsx`
- Delete: `apps/admin/src/components/categories/category-form-modal.tsx`
- Delete or replace: `apps/admin/src/app/(admin)/categories/page.tsx`
- Test: admin/web package typecheck and lint scripts from their manifests

**Interfaces:**
- Admin `Book` types expose `authors`, `categories`, `publisher`, and embedded chapter summaries.
- Admin create/update payloads send embedded snapshots, not `authorIds`, `categoryIds`, or `publisherId`.
- Reader book/category views consume the embedded fields returned by `GET /api/books` and `GET /api/books/{id}`.

- [ ] **Step 1: Capture the compile baseline and write the failing contract fixture**

The current `apps/admin/package.json` and `apps/web/package.json` do not define a `typecheck` script, so use the installed TypeScript compiler directly:

```powershell
npm --prefix apps/admin exec -- tsc --noEmit
npm --prefix apps/web exec -- tsc --noEmit
```

Expected baseline: the old ID-based contracts compile before the migration. Then create `apps/admin/src/lib/api/embedded-book-contract.fixture.ts` with the new `CreateBookInput` object below and update the types only enough to make this fixture compile; the existing form/client references to `authorIds`, `categoryIds`, and `publisherId` must become the intentional red compile failures that drive the next steps.

- [ ] **Step 2: Add the concrete embedded payload contract fixture**

Create `apps/admin/src/lib/api/embedded-book-contract.fixture.ts` with this exact contract:

```ts
import type { CreateBookInput } from "./books";

export const embeddedBookFixture: CreateBookInput = {
  title: "Dế Mèn Phiêu Lưu Ký",
  slug: "de-men-phieu-luu-ky",
  authors: [{ authorId: "author-1", name: "Tô Hoài", slug: "to-hoai", role: "AUTHOR", order: 1 }],
  categories: [{ categoryId: "category-1", name: "Văn học", slug: "van-hoc" }],
  publisher: { publisherId: "publisher-1", name: "NXB Kim Đồng", slug: "nxb-kim-dong" },
};

if ("authorIds" in embeddedBookFixture || "categoryIds" in embeddedBookFixture || "publisherId" in embeddedBookFixture) {
  throw new Error("Embedded book payload must not contain catalog foreign-key fields");
}
```

Run `npm --prefix apps/admin exec -- tsc --noEmit` and expect stale form/API references to fail until the migration is complete.

- [ ] **Step 3: Verify the new payload contract after implementation**

After updating the admin types and form, run the same compiler command and verify the fixture compiles without the runtime guard throwing. Do not add a new test runner dependency for this contract fixture.

- [ ] **Step 4: Update admin book form**

Load selectable metadata from the book API or a local embedded metadata editor; do not call removed `/api/authors` or `/api/categories` CRUD clients. Build `authors`, `categories`, and `publisher` snapshots in the request. Keep chapter management using the existing book-scoped chapter routes.

- [ ] **Step 5: Remove standalone admin catalog UI**

Remove the admin categories/authors page and its API clients/modals. Replace sidebar/navigation links with the book management route or remove only the obsolete link. Do not remove book, chapter, copy, borrowing, user, report, or settings screens.

- [ ] **Step 6: Update reader category and book views**

Change category browse/search to use `Book.categories[].slug` through the books endpoint. Map `Book.authors[].name`, `Book.categories[].name`, `Book.publisher.name`, and `Book.chapters[]` in reader types/components. Preserve reader routes and reading-progress requests.

- [ ] **Step 7: Run frontend checks**

Run:

```powershell
npm --prefix apps/admin exec -- tsc --noEmit
npm --prefix apps/admin run lint
npm --prefix apps/web exec -- tsc --noEmit
npm --prefix apps/web run lint
```

Expected: all four checks pass. The `typecheck` script is intentionally not used because neither package defines one.

- [ ] **Step 8: Commit**

```bash
git add apps/admin apps/web
 git commit -m "refactor(ui): consume embedded book catalog metadata"
```

---

## Task 7: Remove obsolete catalog services, repositories, entities, DI, and indexes

**Files:**
- Delete only the author/category/publisher/chapter standalone files listed in the file map after all references are migrated.
- Modify: `apps/api/Program.cs`
- Modify: `apps/api/Database/MongoDbContext.cs`
- Modify: `apps/api/Database/Indexes/IndexCreator.cs` if any obsolete references remain.
- Modify: any controllers/routes that expose the deleted independent CRUD APIs to remove them from runtime.

**Interfaces:**
- Application startup must compile without `IChapterRepository`, `IAuthorRepository`, `ICategoryRepository`, or `IPublisherRepository`.
- No runtime code may request the removed collections.

- [ ] **Step 1: Write the failing reference check**

Run the repository search before deletion and record all remaining references:

```powershell
rg "IChapterRepository|ChapterRepository|IAuthorRepository|AuthorRepository|ICategoryRepository|CategoryRepository|IPublisherRepository|PublisherRepository|BookAuthors|BookCategories|GetCollection<Chapter>|GetCollection<Author>|GetCollection<Category>|GetCollection<Publisher>" apps/api
```

Expected: matches exist in DI, services, entities, and/or controllers.

- [ ] **Step 2: Remove obsolete registrations and files**

Remove these registrations from `apps/api/Program.cs`:

```csharp
builder.Services.AddScoped<IChapterRepository, ChapterRepository>();
builder.Services.AddScoped<IAuthorRepository, AuthorRepository>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<IPublisherRepository, PublisherRepository>();
```

Remove obsolete author/category/publisher CRUD service registrations if present. Delete only files whose references are already gone. Do not delete book-copy, circulation, reading, review, notification, audit, auth, or settings code.

- [ ] **Step 3: Verify no stale references remain**

Run:

```powershell
rg "IChapterRepository|ChapterRepository|IAuthorRepository|AuthorRepository|ICategoryRepository|CategoryRepository|IPublisherRepository|PublisherRepository|BookAuthors|BookCategories|GetCollection<Chapter>|GetCollection<Author>|GetCollection<Category>|GetCollection<Publisher>" apps/api
```

Expected: no output. If a match belongs to an out-of-scope module, migrate it to embedded `Book` access instead of retaining a removed collection dependency.

- [ ] **Step 4: Run build and all tests**

Run:
- `dotnet build apps/api/api.csproj`
- `dotnet test apps/api.Tests/apps.api.Tests.csproj`

Expected: 0 build errors and all tests pass.

- [ ] **Step 5: Commit**

```bash
git add -A apps/api apps/api.Tests
 git commit -m "refactor(api): remove relational catalog collections"
```

---

## Task 8: Integration/regression verification and final schema audit

**Files:**
- Modify: `apps/api.Tests/` only for missing regression coverage discovered during verification.
- Modify: `apps/admin` or `apps/web` only if a contract check identifies a migration defect.
- Do not modify production files unless a verified test exposes a defect; if so, fix the smallest root-cause change and rerun the covering test.

**Interfaces:**
- Final branch must satisfy the design spec acceptance criteria and preserve unrelated workflows.

- [ ] **Step 1: Run complete backend and frontend checks**

Run:

```powershell
dotnet restore apps/api/api.csproj
dotnet build apps/api/api.csproj --no-restore
dotnet test apps/api.Tests/apps.api.Tests.csproj
npm --prefix apps/admin exec -- tsc --noEmit
npm --prefix apps/admin run lint
npm --prefix apps/web exec -- tsc --noEmit
npm --prefix apps/web run lint
```

Expected: restore/build/test/typecheck/lint complete successfully. Report pre-existing warnings and package scripts that are unavailable separately from errors.

- [ ] **Step 2: Audit schema and code references**

Run:

```powershell
rg "GetCollection<Author>|GetCollection<Category>|GetCollection<Publisher>|GetCollection<Chapter>|book_authors|book_categories|\"chapters\"|PublisherId|AuthorIds|CategoryIds" apps/api apps/admin apps/web
rg "ReadingProgress|ReadingSession|ViewEvent|BookCopy|Borrowing|Review|Redis" apps/api
```

Expected: first command has no obsolete catalog schema or ID-only contract references; second confirms independent workflows remain present.

- [ ] **Step 3: Verify startup seed idempotency**

Start the API twice against the development MongoDB instance, inspect logs, and confirm:
- first run creates complete books and embedded chapters;
- obsolete catalog collections are removed only in development;
- second run reports existing books and does not duplicate books or chapters;
- book copies still reference valid book IDs.

- [ ] **Step 4: Verify API contracts**

Exercise these endpoints with seeded data:

```text
GET /api/books
GET /api/books/{bookId}
GET /api/books/{bookId}/chapters
GET /api/books/{bookId}/chapters/{chapterId}
GET /api/books/{bookId}/chapters/{chapterId}/content
POST /api/books/{bookId}/chapters
PUT /api/books/{bookId}/chapters/{chapterId}
PATCH /api/books/{bookId}/chapters/{chapterId}/publish
PATCH /api/books/{bookId}/chapters/reorder
DELETE /api/books/{bookId}/chapters/{chapterId}
```

Confirm that a chapter ID from another book returns not found and cannot be mutated. Confirm reader book detail, category browsing, and admin book/chapter pages render the embedded fields.

- [ ] **Step 5: Review final diff and commit any test-only additions**

Run:

```powershell
git diff main...HEAD --stat
git diff main...HEAD --check
git status --short
```

Expected: all changes are limited to embedded catalog redesign, tests, frontend contract migration, and design/plan documentation; no unrelated files are staged.

- [ ] **Step 6: Commit final verification additions**

```bash
git add apps/api.Tests
 git commit -m "test(api): verify embedded book aggregate workflows"
```

Skip this commit only when no test files changed during the task; report that no additional commit was needed.

---

## Self-Review Checklist

- Spec coverage: Tasks 1–2 cover embedded schema, nested BSON serialization, and the exact 12 MB guard; Tasks 3–5 cover repository/service/controller reads and writes plus seed/reset/indexes; Task 6 covers frontend contract migration and removal of standalone catalog UI; Task 7 covers deletion of obsolete backend catalog code and DI; Task 8 covers build, tests, startup idempotency, endpoint contracts, and independent workflow regression.
- Placeholder scan: No TODO/TBD/“implement later” steps; all commands, paths, contracts, and acceptance checks are concrete. Test builders and MongoDB fixture paths are explicitly defined.
- Type consistency: `BookChapter`, `ChapterContent`, and embedded snapshot names are used consistently across `Book`, repository, service, DTO, frontend types, and tests; all chapter service calls carry both `bookId` and `chapterId`.
- Scope check: No task changes Redis, reading progress, trending, auth/RBAC, physical inventory, circulation, reviews, notifications, audit logs, or settings behavior.
- Frontend contract coverage: Admin and reader callers of removed author/category endpoints are explicitly migrated or deleted before backend collections/controllers are removed.
