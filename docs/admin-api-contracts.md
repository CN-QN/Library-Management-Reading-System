# Admin API Contracts

LibraryHub has one administrative client: `apps/admin`. The reader client in `apps/web` no longer exposes duplicate `/admin` pages.

## Trust boundaries

- Public: active banners, current flash sale, voucher application, Google credential exchange, and password recovery requests.
- Authenticated reader: profile/avatar, reading, reader-owned reviews, payment QR/status/history, and notifications.
- Admin: every route under `/api/admin` requires its named backend permission. UI permission checks only control visibility.

## Administrative routes

| Area | Routes | Permission |
|---|---|---|
| Payments | `GET /api/admin/payments/orders`, `GET /api/admin/payments/revenue-summary` | `payment.read` or `report.view` |
| Reports | dashboard, revenue, borrowing trend, status breakdowns under `/api/admin/reports` | `report.view` |
| Reviews | list/moderate/delete under `/api/admin/reviews` | `review.moderate` |
| Roles | `/api/admin/roles` and nested permission routes | matching `role.*` permission |
| Settings | `GET/PUT /api/admin/settings` | `setting.read` / `setting.update` |
| Campaigns | list/create/send under `/api/admin/email-campaigns` | `notification.broadcast` |
| Media | upload/list/detail/delete under `/api/admin/media` | `file.manage` |
| Promotions | `/api/admin/banners`, `/flash-sales`, `/vouchers` | matching `promotion.*.manage` permission |

## Authentication

`POST /api/auth/google` accepts `{ "credential": "<Google ID token>" }`. The API verifies issuer, audience, expiry, and verified email before creating a LibraryHub session. Configure the same client ID as `Google__ClientId` on the API and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` on the web app.

Password recovery always returns a neutral response. Reset tokens are random, stored only as SHA-256 hashes, expire after 15 minutes, are consumed atomically, and revoke active sessions after a successful reset. SMTP configuration is mandatory for delivery.

## Media profiles

All images are decoded and re-encoded as JPEG by the API, unsafe metadata is stripped, and dimensions are bounded:

| Profile | Maximum dimensions |
|---|---|
| `banner` | 1920 × 1080 |
| `book-cover` | 1200 × 1800 |
| `avatar` | 512 × 512 |
| `generic-media` | 2048 × 2048 |

Admin upload uses multipart fields `file`, `usageType`, `category`, and optional `referenceId`. Reader avatars use `POST /api/media/avatar`. Deletion accepts only a persisted media record ID.

## Configuration and reports

See `.env.example` and `apps/web/.env.example` for Google, SMTP, Cloudinary, SePay, MongoDB, Redis, and JWT variables. Real secrets must not be stored in `appsettings.json` or frontend variables.

Active borrowings are `OPEN` or `OVERDUE`; overdue means active with `expectedReturnAt` before the API UTC clock. Revenue includes `SUCCESS` payment orders. Trends return complete UTC date buckets, including zeros. All values are derived from MongoDB.
