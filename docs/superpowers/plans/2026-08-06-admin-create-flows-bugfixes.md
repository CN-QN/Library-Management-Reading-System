# Admin Create Flows and Book Metadata Cleanup Implementation Plan

**Goal:** Fix the reported admin create-flow regressions, remove `StudentCode` from admin-created user input, replace raw branch IDs with a real branch selection, and remove editable metadata slugs from the book form.

**Architecture:** Keep legacy persistence fields backward-compatible while narrowing create contracts. Use functional React state updates for modal forms, make media upload available inside banner creation, normalize role codes consistently, and generate book metadata slugs from names at the API boundary rather than asking administrators to type them.

**Scope:** `apps/admin`, relevant ASP.NET Core API modules, and focused regression tests. No data migration and no unrelated reader UI changes.

## Confirmed causes

- Banner, voucher, and flash-sale modal fields use `setForm({ ...form, field: value })`. Under the current React Compiler build, handlers can retain an older form snapshot, causing later keystrokes to overwrite previous ones.
- Banner creation filters Media to `usageType === "banner"` and exposes only a select. There is no file input in the banner modal.
- `CreateUserRequest`, `CreateUserValidator`, `UsersService.CreateUserAsync`, and the admin create-user page still require `StudentCode`.
- The create-user page accepts a raw branch ID even though the backend requires a 24-character MongoDB ObjectId.
- The role form accepts arbitrary input while `CreateRoleValidator` rejects dots. The reported `ADMIN.TEST` payload therefore returns 422.
- Book publisher slug is generated client-side, but author/category slug fields are editable and can remain empty. Slug generation is not consistently enforced by the API.

---

## Task 1: Fix one-character modal inputs for promotions

**Files:**
- Modify: `apps/admin/src/app/(admin)/banners/page.tsx`
- Modify: `apps/admin/src/app/(admin)/vouchers/page.tsx`
- Modify: `apps/admin/src/app/(admin)/flash-sale/page.tsx`

### Steps

- [ ] Replace every object-form update with a functional update, for example:

```tsx
onChange={(event) =>
  setForm((current) => ({ ...current, title: event.target.value }))
}
```

- [ ] Apply the same pattern to text, numeric, datetime, select, and checkbox fields in all three modals.
- [ ] Keep `openCreate`/`openEdit` resetting the complete form object so values from a previous modal session cannot leak.
- [ ] Add a small shared typed helper only if it makes all three pages simpler; do not introduce a generic form framework.
- [ ] Run admin lint/typecheck and manually verify typing at least five characters continuously in every field.

### Acceptance

- Voucher, flash-sale, and banner inputs retain the entire typed value without requiring refocus.
- Changing one field does not reset any other field.

---

## Task 2: Allow selecting or uploading a banner image in the banner modal

**Files:**
- Modify: `apps/admin/src/app/(admin)/banners/page.tsx`
- Modify: `apps/admin/src/lib/api/media.ts` only if upload typing/error handling needs refinement
- Verify: `apps/api/Modules/Admin/AdminMediaController.cs`
- Verify: `apps/api/Modules/Media/MediaPipeline.cs`

### Steps

- [ ] Keep the existing Media select for reuse of uploaded banner assets.
- [ ] Add an `accept="image/*"` file input inside the create/edit banner modal.
- [ ] When a file is chosen, upload it through `mediaApi.upload(file, "banner", "promotions")`, append the returned asset to local Media state, select its ID, and show its preview.
- [ ] Disable save/upload controls while upload is in progress and surface backend upload errors through the existing toast.
- [ ] Clear the pending file input when the modal closes or upload succeeds.
- [ ] Confirm `mediaApi.list()` returns the uploaded asset and that the `usageType === "banner"` filter does not hide it.

### Acceptance

- Admin can either reuse an existing banner image or upload a new one without leaving the modal.
- The created banner sends a valid `mediaId` and displays the uploaded image.

---

## Task 3: Remove StudentCode from admin user creation and add branch selection

**Files:**
- Modify: `apps/api/Modules/Users/DTOs/UserDtos.cs`
- Modify: `apps/api/Modules/Users/Validators/CreateUserValidator.cs`
- Modify: `apps/api/Modules/Users/Services/UsersService.cs`
- Modify: `apps/admin/src/lib/api/users.ts`
- Modify: `apps/admin/src/app/(admin)/users/create/page.tsx`
- Add: a read-only branches endpoint/DTO under the most appropriate API module
- Add: admin branches API typing/client helper
- Add/Modify: focused API integration tests under `apps/api.Tests/Modules/Users/`

### Contract

```csharp
public class CreateUserRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? BranchId { get; set; }
}
```

```ts
export interface CreateUserInput {
  email: string;
  password: string;
  fullName: string;
  branchId?: string;
}
```

### Steps

- [ ] Remove `StudentCode` from `CreateUserRequest` and its validator rules.
- [ ] Remove the duplicate-student-code query and request mapping from `UsersService.CreateUserAsync`.
- [ ] Preserve the existing unique legacy database index by assigning a non-public internal value such as `ADMIN-${Guid.NewGuid():N}` during persistence. Do not accept or display this value in the create form.
- [ ] Keep existing legacy `UserDto.StudentCode` and other admin/list flows unchanged unless separately requested; this task narrows the create contract only.
- [ ] Add a permission-protected read-only endpoint returning active branches as `{ id, code, name }`.
- [ ] Replace the raw “Chi nhánh (ID)” input with a select populated from that endpoint. Include an empty option when branch is optional.
- [ ] Align admin email validation with the backend rule; use one shared documented rule rather than the current frontend `gmail/.edu.vn` versus backend `gmail-only` mismatch.
- [ ] Map backend validation `details` to `email`, `password`, `fullName`, or `branchId` fields instead of parsing English keywords from the message.

### Tests

- [ ] Reflection test proves `CreateUserRequest` exposes only `Email`, `Password`, `FullName`, and `BranchId`.
- [ ] Creating two users without `studentCode` succeeds and assigns the default `STUDENT` role.
- [ ] Invalid branch IDs return 422 rather than an unhandled MongoDB 500.
- [ ] A valid branch selected from the endpoint is persisted and returned.

---

## Task 4: Make role creation accept predictable administrator input

**Files:**
- Modify: `apps/admin/src/app/(admin)/roles/page.tsx`
- Modify: `apps/api/Modules/Roles/Validators/CreateRoleValidator.cs` only if dot-separated codes are intentionally supported
- Add/Modify: focused role validation tests under `apps/api.Tests/Modules/Roles/`

### Decision and implementation

- [ ] Use underscore-based stored role codes to remain consistent with seeded roles such as `SUPER_ADMIN`.
- [ ] Normalize frontend input before submission: trim, uppercase, replace spaces/dots/hyphens with `_`, collapse repeated underscores, and remove unsupported characters. Example: `ADMIN.TEST` becomes `ADMIN_TEST`.
- [ ] Show the normalized code in the input before submit and add inline help: “Chỉ dùng chữ in hoa, số và `_`.”
- [ ] Surface backend `details[0].message` in the form instead of only a generic toast.
- [ ] Keep the backend regex `^[A-Z0-9_]+$` unless product requirements explicitly require dots as stored identifiers.

### Acceptance

- Entering `ADMIN.TEST` creates role code `ADMIN_TEST`, or clearly blocks submission with an inline explanation before the request.
- Duplicate role codes produce a readable conflict message.

---

## Task 5: Remove editable metadata slugs from book create/edit forms

**Files:**
- Modify: `apps/admin/src/components/books/book-form.tsx`
- Modify: `apps/admin/src/lib/api/books.ts`
- Modify: `apps/api/Modules/Catalog/DTOs/BookMetadataDtos.cs`
- Modify: `apps/api/Modules/Catalog/Services/BookService.cs`
- Modify: `apps/api/Modules/Catalog/Validators/CreateBookValidator.cs` if nested validation currently requires slug
- Add/Modify: `apps/api.Tests/Database/BookEmbeddedModelTests.cs` or focused catalog service tests

### Contract behavior

- Admin supplies publisher/author/category IDs and names, not slugs.
- API generates each embedded slug from its corresponding name during create and update.
- Response DTOs continue returning slugs because reader URLs/search may consume them.

### Steps

- [ ] Remove publisher, author, and category slug inputs from both create and edit UI.
- [ ] Remove `publisherSlug` from react-hook-form values and stop making administrators manage snapshot slugs.
- [ ] Make request slug properties optional or introduce request-specific metadata DTOs without slug while retaining response DTO slug fields.
- [ ] Centralize Vietnamese-safe slug generation in the API and reuse it for book title, publisher, author, and category snapshots.
- [ ] On create/update, ignore client-provided slug values and generate from `Name`; preserve stable existing slugs on edit only if the product requires stable metadata URLs, otherwise regenerate deterministically when names change.
- [ ] Define empty-name behavior explicitly: reject a metadata row that has an ID but no name; discard a completely empty row.

### Tests

- [ ] Creating a book with author/category/publisher names and no metadata slugs succeeds.
- [ ] Vietnamese names generate normalized slugs (`Tô Hoài` → `to-hoai`).
- [ ] Editing metadata cannot inject a client-controlled slug.
- [ ] Book response still contains generated metadata slugs.

---

## Task 6: Regression verification

- [ ] Run focused API tests for Users, Roles, Catalog, Media, and Promotions.
- [ ] Run `dotnet test apps/api.Tests/apps.api.Tests.csproj --filter "FullyQualifiedName~Users|FullyQualifiedName~Roles|FullyQualifiedName~Book|FullyQualifiedName~Media"`.
- [ ] Run `npm --prefix apps/admin run lint` and the admin build/typecheck command.
- [ ] Smoke test these exact flows:
  1. Create two users using email/password/full name and a selected branch, with no student-code field.
  2. Create `ADMIN.TEST` and confirm the stored code is normalized to `ADMIN_TEST`.
  3. Type multi-character values into every voucher, flash-sale, and banner field without refocusing.
  4. Upload a banner image inside the modal and create the banner.
  5. Create and edit a book without seeing any publisher/author/category slug input; confirm generated slugs in the API response.

## Out of scope

- Removing legacy `User.StudentCode` from persistence or migrating existing data.
- Refactoring all existing admin pages that display historical student codes.
- Changing reader-facing book URLs or the top-level book slug contract.
- Creating a pull request automatically.
