# Admin API-First Remediation Implementation Plan

> **For agentic workers:** Implement this plan task-by-task. Keep the checkboxes current, run the verification listed in each task, and do not start a later frontend migration before its backend contract is green.

**Goal:** Make the scoped admin, auth, media, promotion, reporting, and cross-app flows production-ready by enforcing backend trust boundaries, persisting real data, removing mock fallbacks, and aligning all clients on typed API contracts.

**Architecture:** ASP.NET Core remains the single authority for authentication, authorization, validation, business logic, reporting aggregates, media ingestion, and persistence. Admin capabilities move behind explicit `api/admin/...` contracts guarded by named permissions; reader/public routes remain separate. MongoDB stores settings, campaigns, media metadata, promotions, reviews, roles, and report source data; Cloudinary is accessed only by the backend. `apps/admin` and `apps/web` consume typed wrappers and surface real loading/error/empty states without fabricating data or mutation success.

**Tech Stack:** ASP.NET Core/.NET 9, MongoDB.Driver, Redis, Cloudinary HTTP API, ImageSharp, xUnit, FluentAssertions, Next.js/React/TypeScript

## Global Constraints

- Do not redesign the RBAC taxonomy, MongoDB/Redis topology, or unrelated reader/library modules.
- Backend authorization is mandatory; frontend permission checks are UX only.
- Never return password reset credentials, Cloudinary secrets, or other stored secrets to a client.
- Do not accept client-supplied identity claims for Google login; derive identity only from a verified provider credential.
- All image upload/delete operations in scope go through the backend and a persisted `FileAsset` record.
- Do not preserve demo/base64 upload success, hardcoded counts, sample rows, local-only mutations, or success toasts after failed requests.
- Keep public, authenticated-reader, and admin contracts distinct. Temporary compatibility routes are allowed only when a named consumer still needs them and must be removed within the same migration task.
- Preserve the existing untracked `.claude/settings.local.json`; it is user-owned and outside this plan.

## Target Route and Permission Matrix

| Capability | Target route | Trust boundary |
|---|---|---|
| Google session | `POST /api/auth/google` | Public input, server-verified Google credential |
| Password recovery | `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` | Public, neutral response, single-use expiring token |
| Admin reviews | `GET /api/admin/reviews`, `PATCH /api/admin/reviews/{id}/status`, `DELETE /api/admin/reviews/{id}` | `review.moderate` |
| Admin reports | `GET /api/admin/reports/*` | report read permission |
| Admin payment | `GET /api/admin/payments/orders`, `GET /api/admin/payments/revenue-summary` | payment/report read permission |
| Admin settings | `GET/PUT /api/admin/settings` | `setting.read` / `setting.update` |
| Admin roles | `GET/POST/PUT /api/admin/roles`, permission assignment routes | existing role permissions |
| Admin campaigns | `GET/POST /api/admin/email-campaigns`, `POST /api/admin/email-campaigns/{id}/send` | notification broadcast permission |
| Admin media | `POST/GET/DELETE /api/admin/media...` | `file.manage` |
| Admin promotions | `/api/admin/banners`, `/api/admin/flash-sales`, `/api/admin/vouchers` | matching promotion management permission |
| Reader promotions | active/current/apply routes under existing public API | Public or authenticated reader as dictated by action |

Exact permission constants should be added to `apps/api/Common/Constants/Permissions.cs` and seeded through `apps/api/Database/Seed/PermissionSeed.cs`; reuse an existing semantically correct permission instead of creating duplicates.

---

## Task 1: Lock the Trust Boundaries and Contract Tests

**Files:**
- Modify: `apps/api/Common/Constants/Permissions.cs`
- Modify: `apps/api/Database/Seed/PermissionSeed.cs`
- Modify: `apps/api/Common/Auth/AuthGuard.cs` only if multiple-permission semantics are missing
- Create: `apps/api.Tests/Security/AdminAuthorizationTests.cs`
- Create: `apps/api.Tests/Contracts/AdminRouteContractTests.cs`
- Modify: `apps/api.Tests/TestSupport/MongoFixture.cs`

- [ ] **Step 1: Add failing authorization tests**

Cover anonymous, authenticated-without-permission, and permitted users for payment admin, media, promotion mutation, review moderation, settings, role mutation, reports, and email campaign routes. Assert `401`, `403`, and success-path authorization independently.

- [ ] **Step 2: Add route-shape contract tests**

Assert that public routes remain callable without an admin permission and that sensitive actions exist only under the intended admin route namespace. Include an assertion that the legacy anonymous email campaign action is unavailable.

- [ ] **Step 3: Define and seed missing permissions**

Add only the minimum permissions needed for promotion management, payment/report read, media management, settings, review moderation, and notification broadcast. Make seed behavior idempotent and preserve existing role assignments.

- [ ] **Step 4: Add `RequireAnyPermission` only if needed**

If a route legitimately accepts one of several existing permissions, implement the behavior in `AuthGuard.cs` and test its OR semantics. Do not weaken `RequirePermission` or treat authentication as authorization.

- [ ] **Step 5: Run focused tests**

```powershell
dotnet test apps/api.Tests/apps.api.Tests.csproj --filter "FullyQualifiedName~AdminAuthorizationTests|FullyQualifiedName~AdminRouteContractTests"
```

Expected: tests describe the desired boundaries; failures at this point identify controllers to migrate in later tasks.

---

## Task 2: Harden Google Login and Password Recovery

**Files:**
- Create: `apps/api/Configuration/GoogleSettings.cs`
- Modify: `apps/api/appsettings.json`
- Modify: `.env.example`
- Modify: `apps/api/Modules/Auth/DTOs/AuthDtos.cs`
- Modify: `apps/api/Modules/Auth/Services/AuthService.cs`
- Modify: `apps/api/Modules/Auth/Controllers/AuthController.cs`
- Modify: `apps/api/Program.cs`
- Create: `apps/api/Modules/Auth/Services/IGoogleTokenVerifier.cs`
- Create: `apps/api/Modules/Auth/Services/GoogleTokenVerifier.cs`
- Create: `apps/api/Modules/Auth/Services/IPasswordRecoveryService.cs`
- Create: `apps/api/Modules/Auth/Services/PasswordRecoveryService.cs`
- Create: `apps/api.Tests/Modules/Auth/AuthSecurityTests.cs`
- Modify: `apps/web/src/components/auth/LoginForm.tsx`
- Modify: `apps/web/src/store/auth-store.ts` if session bootstrap changes
- Create or modify: `apps/web/src/lib/api/auth.ts`

- [ ] **Step 1: Write failing auth security tests**

Test invalid signature, wrong audience, unverified email, missing credential, and valid Google credential. Test forgot-password response equivalence for known/unknown email, absence of token/code in response, expiry, successful one-time reset, and rejected token reuse.

- [ ] **Step 2: Introduce provider and recovery abstractions**

Wrap Google token verification and recovery delivery behind interfaces so unit tests do not call external services. Bind the configured Google client ID from environment-backed settings and fail closed when it is missing.

- [ ] **Step 3: Replace the Google request contract**

Change `POST /api/auth/google` to accept a credential/token only. Verify signature, issuer, audience, expiry, and verified email; use provider `sub` plus verified email to find/create the local user, then issue the normal LibraryHub session.

- [ ] **Step 4: Make password recovery opaque and single-use**

Return the same neutral response whether the account exists or not. Store only a hashed reset token with expiry, deliver the raw token through the backend email abstraction, atomically consume it on successful reset, and revoke existing sessions according to current auth policy.

- [ ] **Step 5: Migrate the web login UI**

Remove the hardcoded Google identity from `LoginForm.tsx`; pass the real Google credential to the typed auth wrapper. Update forgot-password UI to show the neutral server message and never expect a returned token.

- [ ] **Step 6: Verify auth flows**

```powershell
dotnet test apps/api.Tests/apps.api.Tests.csproj --filter "FullyQualifiedName~AuthSecurityTests"
npm --prefix apps/web run lint
npm --prefix apps/web run build
```

Expected: forged credentials cannot create sessions; recovery never exposes credentials; the web client compiles against the new DTO.

---

## Task 3: Normalize Admin Routes and Typed Client Contracts

**Files:**
- Modify: `apps/api/Modules/Payment/Controllers/PaymentsController.cs`
- Modify: `apps/api/Modules/Catalog/Controllers/ReviewsController.cs`
- Modify: `apps/api/Modules/Roles/Controllers/RolesController.cs`
- Modify: `apps/api/Modules/System/Controllers/SettingsController.cs`
- Modify: `apps/api/Modules/Promotions/Controllers/BannersController.cs`
- Modify: `apps/api/Modules/Promotions/Controllers/FlashSaleController.cs`
- Modify: `apps/api/Modules/Promotions/Controllers/VouchersController.cs`
- Modify: `apps/api/Modules/Notifications/Controllers/NotificationsController.cs`
- Create: `apps/admin/src/lib/api/reviews.ts`
- Create: `apps/admin/src/lib/api/payments.ts`
- Create: `apps/admin/src/lib/api/promotions.ts`
- Create: `apps/admin/src/lib/api/campaigns.ts`
- Modify: `apps/admin/src/lib/api/settings.ts`
- Modify: `apps/admin/src/lib/api/roles.ts`
- Modify: `apps/admin/src/lib/api/reports.ts`
- Modify: `apps/web/src/lib/api/reviews.ts`
- Modify: `apps/web/src/lib/api/payment.ts`

- [ ] **Step 1: Finalize request/response DTOs before page edits**

Define stable paged-list, filter, mutation, and summary DTOs. Use the existing `ApiResponse<T>` envelope consistently and avoid `any`, anonymous response shapes, and frontend-derived status values.

- [ ] **Step 2: Split admin and reader routes**

Move admin payment, review moderation, settings, promotion management, and campaign actions behind `api/admin/...` controllers/routes with permission attributes. Keep only genuine public or authenticated-reader operations in their existing reader-facing controllers.

- [ ] **Step 3: Complete role and permission contracts**

Ensure list/create/update role, list permissions, add/remove permission, and add/remove user role all have typed request/response contracts and invalidate the affected user's permission cache after assignment changes.

- [ ] **Step 4: Update typed API wrappers**

Centralize routes in `apps/admin/src/lib/api/*` and `apps/web/src/lib/api/*`. Wrappers return typed payloads and propagate failures; they must not insert fallback data.

- [ ] **Step 5: Remove compatibility routes after consumers compile**

Search both clients for legacy payment/admin, mixed review, and promotion mutation paths before deleting their backend aliases.

- [ ] **Step 6: Verify contracts and clients**

```powershell
rg -n "payments/admin|delete-cloudinary|email-broadcast|AllowAnonymous" apps/api apps/admin/src apps/web/src
dotnet test apps/api.Tests/apps.api.Tests.csproj --filter "FullyQualifiedName~AdminRouteContractTests|FullyQualifiedName~AdminAuthorizationTests"
npm --prefix apps/admin run lint
npm --prefix apps/web run lint
```

Expected: no sensitive legacy route remains; wrapper modules are the only client locations containing admin endpoint strings.

---

## Task 4: Build the Persisted Backend Media Pipeline

**Files:**
- Modify: `apps/api/Database/Entities/FileAsset.cs`
- Modify: `apps/api/Database/MongoDbContext.cs`
- Modify: `apps/api/Database/Indexes/IndexCreator.cs`
- Modify: `apps/api/Modules/Files/DTOs/FileUploadRequestDto.cs`
- Modify: `apps/api/Modules/Files/DTOs/FileUploadResponseDto.cs`
- Modify: `apps/api/Modules/Files/Services/IFileService.cs`
- Modify: `apps/api/Modules/Files/Services/FileService.cs`
- Replace or remove: `apps/api/Modules/Media/Controllers/MediaController.cs`
- Modify: `apps/api/Modules/Files/Controllers/FilesController.cs`
- Modify: `apps/api/Program.cs`
- Modify: `apps/api/api.csproj`
- Create: `apps/api/Modules/Media/MediaUsageProfile.cs`
- Create: `apps/api/Modules/Media/IMediaProcessor.cs`
- Create: `apps/api/Modules/Media/ImageSharpMediaProcessor.cs`
- Create: `apps/api/Modules/Media/ICloudinaryClient.cs`
- Create: `apps/api/Modules/Media/CloudinaryClient.cs`
- Create: `apps/api.Tests/Modules/Media/MediaPipelineTests.cs`

- [ ] **Step 1: Add failing media tests**

Cover permission denial, empty file, MIME/signature mismatch, unsupported format, oversized input, invalid decode, invalid dimensions, each usage profile, persisted metadata, list/filter/paging, delete-by-record-ID, Cloudinary failure, and database failure cleanup behavior.

- [ ] **Step 2: Expand the `FileAsset` record**

Persist Cloudinary public ID, secure URL, original filename, width, height, byte size, MIME/format, category, usage type, uploader ID, timestamps, and optional reference metadata. Add indexes for usage/category/created date and any uniqueness invariant on provider identity.

- [ ] **Step 3: Implement bounded image processing**

Decode the image server-side and apply explicit `banner`, `book-cover`, `avatar`, and `generic-media` policies. Validate bytes independently from the claimed MIME type, cap input/output dimensions and bytes, normalize orientation, strip unsafe metadata, and compress/convert before upload.

- [ ] **Step 4: Implement upload/list/delete orchestration**

`POST /api/admin/media/upload` authorizes, validates, transforms, uploads, persists, and returns the stored record. `GET /api/admin/media` pages and filters DB records. `DELETE /api/admin/media/{id}` loads the record server-side, deletes Cloudinary by stored public ID, and removes/marks the DB record only according to a documented failure policy.

- [ ] **Step 5: Remove insecure/demo behavior**

Delete public Cloudinary config exposure, URL-to-public-ID guessing, base64 success fallback, and success responses when Cloudinary is unconfigured. Missing provider configuration must be a clear server/configuration error.

- [ ] **Step 6: Verify media behavior**

```powershell
dotnet test apps/api.Tests/apps.api.Tests.csproj --filter "FullyQualifiedName~MediaPipelineTests"
rg -n "api.cloudinary.com/v1_1/demo|data:.*base64|delete-cloudinary|Cloudinary.*ApiSecret" apps/admin/src apps/web/src apps/api/Modules
```

Expected: all uploads are processed and persisted by the backend; no frontend has Cloudinary upload code or receives secrets.

---

## Task 5: Persist Settings and Email Campaigns

**Files:**
- Modify: `apps/api/Database/Entities/SystemSetting.cs`
- Create: `apps/api/Database/Entities/EmailCampaign.cs`
- Create: `apps/api/Database/Entities/EmailSubscriber.cs`
- Modify: `apps/api/Database/MongoDbContext.cs`
- Modify: `apps/api/Database/Indexes/IndexCreator.cs`
- Modify: `apps/api/Modules/System/DTOs/SettingDtos.cs`
- Modify: `apps/api/Modules/System/Controllers/SettingsController.cs`
- Create: `apps/api/Modules/System/Services/ISettingsService.cs`
- Create: `apps/api/Modules/System/Services/SettingsService.cs`
- Create: `apps/api/Modules/Notifications/DTOs/EmailCampaignDtos.cs`
- Modify: `apps/api/Modules/Notifications/Services/INotificationService.cs`
- Modify: `apps/api/Modules/Notifications/Services/NotificationService.cs`
- Modify: `apps/api/Modules/Notifications/Controllers/NotificationsController.cs`
- Modify: `apps/api/Program.cs`
- Create: `apps/api.Tests/Modules/System/SettingsTests.cs`
- Create: `apps/api.Tests/Modules/Notifications/EmailCampaignTests.cs`
- Modify: `apps/admin/src/app/(admin)/settings/page.tsx`
- Modify: `apps/admin/src/app/(admin)/email-campaigns/page.tsx`

- [ ] **Step 1: Test persistence and secret semantics**

Settings tests cover grouped reads, updates, validation, permissions, masked secret reads, blank-means-keep, and explicit replacement. Campaign tests cover create/list/send/status/history, real subscriber count, provider failure, retry/idempotency, and authorization.

- [ ] **Step 2: Implement grouped settings service**

Map `EMAIL`, `SEPAY`, `CLOUDINARY`, and `BORROWING_POLICY` to typed DTO sections. Keep secret values server-side; return only a mask plus `isConfigured`, and audit settings mutations.

- [ ] **Step 3: Implement minimum viable campaign persistence**

Persist subject, body, type, creator, timestamps, status, recipient/sent/failed counts, and failure summary. Load actual subscribers, send through the backend email provider, and persist the final result without pretending partial/failed sends succeeded.

- [ ] **Step 4: Migrate both admin pages**

Load real records through typed wrappers, show loading/error/empty states, submit real mutations, and refresh from the server response. Remove hardcoded Cloudinary credentials, sample campaigns/subscribers, local-only inserts, and timer-based fake saves.

- [ ] **Step 5: Verify settings and campaigns**

```powershell
dotnet test apps/api.Tests/apps.api.Tests.csproj --filter "FullyQualifiedName~SettingsTests|FullyQualifiedName~EmailCampaignTests"
rg -n "DEFAULT_CAMPAIGNS|DEFAULT_SUBSCRIBERS|987654321012345|setTimeout" "apps/admin/src/app/(admin)/settings" "apps/admin/src/app/(admin)/email-campaigns"
npm --prefix apps/admin run build
```

Expected: the pages reflect DB state and provider results; no secret or fake success is exposed.

---

## Task 6: De-Mock Reviews, Roles, and Permission-Aware Admin UX

**Files:**
- Modify: `apps/api/Modules/Catalog/DTOs/ReviewDtos.cs`
- Modify: `apps/api/Modules/Catalog/Services/IReviewService.cs`
- Modify: `apps/api/Modules/Catalog/Services/ReviewService.cs`
- Modify: `apps/api/Modules/Catalog/Controllers/ReviewsController.cs`
- Modify: `apps/api/Modules/Roles/DTOs/RoleDtos.cs`
- Modify: `apps/api/Modules/Roles/Services/RolesService.cs`
- Modify: `apps/api/Modules/Roles/Controllers/RolesController.cs`
- Create: `apps/api.Tests/Modules/Catalog/AdminReviewTests.cs`
- Create: `apps/api.Tests/Modules/Roles/RolePermissionTests.cs`
- Modify: `apps/admin/src/context/auth-context.tsx`
- Modify: `apps/admin/src/components/auth-gate.tsx`
- Modify: `apps/admin/src/lib/permissions.ts`
- Modify: `apps/admin/src/app/(admin)/reviews/page.tsx`
- Modify: `apps/admin/src/app/(admin)/roles/page.tsx`
- Modify: `apps/admin/src/components/users/assign-role-modal.tsx`
- Modify: `apps/admin/src/components/layout/sidebar.tsx`

- [ ] **Step 1: Test admin review query and moderation**

Cover paging, book/user/status/rating filters, moderation state transitions, delete, missing review, and permission checks. Verify public reader listing excludes reviews not visible under the moderation state.

- [ ] **Step 2: Test real role mutations and cache invalidation**

Cover create/update, duplicate names, permission add/remove, user role add/remove, missing IDs, and invalidating cached permissions so changes take effect on the next protected request.

- [ ] **Step 3: Implement and consume the admin review contract**

The admin page must use the admin list endpoint instead of a public `bookId`-scoped route. After moderation/delete, reconcile from the server response or refetch; never optimistically report success after a failed request.

- [ ] **Step 4: Replace local role state with server state**

Remove `DEFAULT_ROLES` and the local permission sync. Load roles and permissions, submit each mutation, handle conflicts/errors, and refresh authoritative state.

- [ ] **Step 5: Enforce permission-aware UX**

Expose the authenticated admin's real permissions in `auth-context`, guard route actions and sidebar entries, and disable/hide individual mutation controls when permission is absent. Keep backend tests as the security guarantee.

- [ ] **Step 6: Verify modules**

```powershell
dotnet test apps/api.Tests/apps.api.Tests.csproj --filter "FullyQualifiedName~AdminReviewTests|FullyQualifiedName~RolePermissionTests"
rg -n "DEFAULT_ROLES|Local fallback|sample|mock" "apps/admin/src/app/(admin)/reviews" "apps/admin/src/app/(admin)/roles"
npm --prefix apps/admin run lint
```

Expected: review and role pages are fully server-backed and unauthorized actions are unavailable in both API and UI.

---

## Task 7: Split and Persist Promotion Management

**Files:**
- Modify: `apps/api/Modules/Promotions/Controllers/BannersController.cs`
- Modify: `apps/api/Modules/Promotions/Controllers/FlashSaleController.cs`
- Modify: `apps/api/Modules/Promotions/Controllers/VouchersController.cs`
- Create or modify: promotion services/DTOs under `apps/api/Modules/Promotions/`
- Modify: `apps/api/Database/Entities/Banner.cs`
- Modify: `apps/api/Database/Entities/FlashSale.cs`
- Modify: `apps/api/Database/Entities/Voucher.cs`
- Modify: `apps/api/Database/Indexes/IndexCreator.cs`
- Create: `apps/api.Tests/Modules/Promotions/PromotionContractTests.cs`
- Modify: `apps/admin/src/app/(admin)/banners/page.tsx`
- Modify: `apps/admin/src/app/(admin)/flash-sale/page.tsx`
- Modify: `apps/admin/src/app/(admin)/vouchers/page.tsx`
- Modify: `apps/web/src/app/(reader)/page.tsx` and its banner/flash-sale data components

- [ ] **Step 1: Test public/admin separation and invariants**

Public tests cover active banners/current flash sale and valid voucher application. Admin tests cover paged list, CRUD, activation windows, status transitions, banner ordering, invalid date/discount combinations, uniqueness, and permissions.

- [ ] **Step 2: Implement explicit public and admin contracts**

Public endpoints return only active, currently valid data. Admin endpoints expose management fields and use permission attributes. Put date/status/order/discount validation in backend services, not pages.

- [ ] **Step 3: Connect banners to persisted media**

Banner create/update accepts a stored media record ID, verifies it exists and has a compatible usage profile, and stores a stable reference plus the response projection needed by readers.

- [ ] **Step 4: Migrate admin pages**

Remove `DEFAULT_BANNERS`, `DEFAULT_FLASH_SALES`, and any voucher local-only behavior. Use the media pipeline for banner images and report real mutation errors.

- [ ] **Step 5: Migrate reader consumers**

Update homepage banner/flash-sale consumers and voucher application to the public/reader contracts. Empty promotion sets render a genuine empty state without invented content.

- [ ] **Step 6: Verify promotions**

```powershell
dotnet test apps/api.Tests/apps.api.Tests.csproj --filter "FullyQualifiedName~PromotionContractTests"
rg -n "DEFAULT_BANNERS|DEFAULT_FLASH_SALES|api.cloudinary.com" apps/admin/src apps/web/src
npm --prefix apps/admin run build
npm --prefix apps/web run build
```

Expected: management writes persist, readers see only valid promotions, and no client directly uploads promotion media.

---

## Task 8: Migrate Media Library, Book Covers, and Avatars

**Files:**
- Create: `apps/admin/src/lib/api/media.ts`
- Modify: `apps/admin/src/app/(admin)/media/page.tsx`
- Modify: `apps/admin/src/components/books/book-form.tsx`
- Modify: admin/user avatar components in scope
- Modify: `apps/web/src/app/(admin)/admin/media/page.tsx` if this legacy admin surface remains routed
- Modify: `apps/web/src/app/(admin)/admin/books/page.tsx` if this legacy admin surface remains routed
- Modify: web profile/avatar components that upload images

- [ ] **Step 1: Inventory every upload consumer**

Search for Cloudinary URLs, multipart uploads, file inputs, cover/avatar/banner image mutations, and `FileAsset` use. Decide whether duplicate admin pages under `apps/web/src/app/(admin)` are migrated or removed; do not leave a second insecure admin surface.

- [ ] **Step 2: Migrate the admin media library**

List persisted assets with pagination/category filters, upload through `POST /api/admin/media/upload`, render dimensions/size/format from returned metadata, and delete by record ID with confirmation and real failure handling.

- [ ] **Step 3: Migrate cover and avatar uploaders**

Use `book-cover` and `avatar` usage types respectively. Store/submit the returned media ID or server-approved URL according to the owning entity contract; never upload directly or infer provider IDs from URLs.

- [ ] **Step 4: Remove duplicate/demo upload code**

Delete direct `fetch` calls to Cloudinary demo, `/media/delete-cloudinary`, base64 asset construction, and copied legacy media state.

- [ ] **Step 5: Verify all upload consumers**

```powershell
rg -n "api.cloudinary.com|delete-cloudinary|FormData\(|type=\"file\"" apps/admin/src apps/web/src
npm --prefix apps/admin run lint
npm --prefix apps/web run lint
```

Expected: every remaining file input routes through the typed backend media client and uses an explicit usage profile.

---

## Task 9: Implement DB-Derived Reports and Dashboard

**Files:**
- Create: `apps/api/Modules/Reports/DTOs/AdminReportDtos.cs`
- Create: `apps/api/Modules/Reports/Services/IAdminReportService.cs`
- Create: `apps/api/Modules/Reports/Services/AdminReportService.cs`
- Create: `apps/api/Modules/Reports/Controllers/AdminReportsController.cs`
- Modify: `apps/api/Program.cs`
- Create: `apps/api.Tests/Modules/Reports/AdminReportTests.cs`
- Modify: `apps/admin/src/lib/api/reports.ts`
- Modify: `apps/admin/src/app/(admin)/dashboard/page.tsx`
- Modify: `apps/admin/src/app/(admin)/reports/page.tsx`
- Modify: `apps/admin/src/components/dashboard/stat-card.tsx`
- Modify: `apps/admin/src/components/dashboard/borrowing-trend-chart.tsx`
- Modify: `apps/admin/src/app/(admin)/transactions/page.tsx`

- [ ] **Step 1: Define report semantics in tests**

Seed fixed books, users, borrowings, fines, and payment orders. Assert totals, active/overdue definitions at a fixed clock, date buckets/time zone, revenue inclusion rules, payment status counts, fine summary, and empty-database zero results.

- [ ] **Step 2: Implement server-side aggregates**

Provide dashboard summary, revenue summary, borrowing trend, and status breakdown contracts from MongoDB aggregation pipelines/services. Accept validated date range and granularity where required; return ordered complete buckets including zero-value dates.

- [ ] **Step 3: Protect payment and report data**

Move transaction list and revenue summary behind the admin permission matrix. Ensure reader `my-orders`, QR creation, webhook, and access checks retain their intended distinct boundaries.

- [ ] **Step 4: Replace frontend approximations**

Remove `fallbackPoints`, client-side heuristic joins, hardcoded cards, `DEFAULT_TRANSACTIONS`, and fallback sample tables. Dashboard/reports/transactions consume typed report/payment wrappers and render server values, loading, empty, and error states.

- [ ] **Step 5: Verify reporting**

```powershell
dotnet test apps/api.Tests/apps.api.Tests.csproj --filter "FullyQualifiedName~AdminReportTests"
rg -n "fallbackPoints|approximation|hardcoded|DEFAULT_TRANSACTIONS|payments/admin" apps/admin/src
npm --prefix apps/admin run build
```

Expected: every displayed metric in scope can be traced to a tested DB aggregate and sensitive payment data requires permission.

---

## Task 10: Cross-App Regression, Cleanup, and Documentation

**Files:**
- Modify: `apps/web/src/lib/api/payment.ts`
- Modify: `apps/web/src/lib/api/reviews.ts`
- Modify: `apps/web/src/components/features/payment/PaymentModal.tsx`
- Modify: `apps/web/src/components/features/profile/PaymentHistoryTab.tsx`
- Modify: `apps/web/src/components/reader/book-detail/ReviewsSection.tsx`
- Modify: `.env.example`
- Modify: `README.md`
- Modify: `docs/SYSTEM_ARCHITECTURE.md`
- Create: `docs/admin-api-contracts.md`

- [ ] **Step 1: Verify reader payment and review behavior**

Smoke test QR creation, webhook/status polling, completed-payment access unlock, order history, review create/update/delete, and moderation visibility. Keep SignalR plus polling fallback behavior unless a test proves the contract change requires adjustment.

- [ ] **Step 2: Scan for all forbidden production fallbacks**

```powershell
rg -n "DEFAULT_BANNERS|DEFAULT_FLASH_SALES|DEFAULT_CAMPAIGNS|DEFAULT_SUBSCRIBERS|DEFAULT_ROLES|DEFAULT_TRANSACTIONS|api.cloudinary.com/v1_1/demo|delete-cloudinary|sentCount = 14|Local fallback sync" apps/api apps/admin/src apps/web/src
rg -n "AllowAnonymous|\[Authorize\]" apps/api/Modules/Payment apps/api/Modules/Media apps/api/Modules/Promotions apps/api/Modules/Notifications apps/api/Modules/System apps/api/Modules/Roles
```

Review every remaining match. UI skeletons, harmless display defaults, reader polling fallback, and unrelated search fallback are not part of this remediation; document why any scoped match remains.

- [ ] **Step 3: Run the full verification suite**

```powershell
dotnet build apps/api/api.csproj
dotnet test apps/api.Tests/apps.api.Tests.csproj
npm --prefix apps/admin run lint
npm --prefix apps/admin run build
npm --prefix apps/web run lint
npm --prefix apps/web run build
```

- [ ] **Step 4: Perform manual smoke tests against real services**

Use a seeded permitted admin and a normal reader. Verify Google login, password recovery delivery/reset, permission denial, settings persistence across restart, campaign send/history, review moderation, role assignment, banner/flash sale/voucher lifecycle, media validation/upload/delete, dashboard/report correctness, reader homepage, and payment access unlock.

- [ ] **Step 5: Update operational documentation**

Document environment variables, Google audience configuration, email provider setup, Cloudinary setup, media limits/profiles, permission mapping, route matrix, report semantics/time zone, and failure behavior. Never place live credentials or reset tokens in docs/examples.

- [ ] **Step 6: Review the final diff**

```powershell
git diff --check
git status --short
git diff --stat
```

Expected: changes are limited to the scoped auth/admin/media/reporting contracts, their consumers, tests, and documentation; user-owned files remain untouched.

---

## Recommended Delivery Sequence

1. Merge Tasks 1–3 together as the contract/security foundation.
2. Merge Task 4 before any media consumer migration.
3. Deliver Tasks 5–8 as small vertical slices; each slice includes backend persistence, typed wrapper, page migration, and tests.
4. Deliver Task 9 after payment/report semantics are fixed.
5. Finish with Task 10 cleanup and full regression.

Do not run old and new write paths in parallel. During migration, a temporary read alias may exist for a named consumer, but all mutations must have one authoritative backend path.

## Definition of Done

- Every sensitive endpoint in scope enforces a named backend permission and has `401/403/success` tests.
- Google identity is accepted only after server verification; password recovery never returns a credential and tokens are expiring/single-use.
- Settings, campaigns, reviews, roles, promotions, media, transactions, dashboard, and reports read/write real persisted data.
- All image uploads are validated, optimized, uploaded, and recorded by the backend; deletion uses stored provider metadata.
- Admin and reader applications compile against typed, separated contracts.
- No scoped page substitutes sample data on API failure or reports mutation success when persistence failed.
- Report figures are deterministic, documented MongoDB aggregates with fixed semantics.
- Full backend tests and both frontend lint/build pipelines pass, followed by the manual smoke checklist.

## Self-Review Checklist

- Security coverage: auth verification, recovery secrecy, permission enforcement, secret masking, and provider trust boundaries are explicit.
- Contract coverage: public/reader/admin routes and typed consumers are migrated in dependency order.
- Persistence coverage: settings, campaigns, media metadata, promotions, reviews, roles, and report source data remain server-authoritative.
- Media coverage: validation, optimization profiles, Cloudinary failure handling, metadata persistence, list/filter, and delete are tested.
- De-mock coverage: every sample/default identified in the spec and current code scan has an owning task and removal check.
- Cross-app coverage: reader banner, flash sale, voucher, payment, review visibility, cover/avatar, Google login, and recovery flows are verified.
- Scope control: no RBAC redesign, storage migration, analytics warehouse, advanced DAM, or advanced marketing automation is introduced.
