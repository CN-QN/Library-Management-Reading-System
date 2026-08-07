# Reader Self-Registration Without StudentCode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove `StudentCode` from reader self-registration and auth-facing responses so email becomes the only public-facing identifier for signup, login, and profile flows.

**Architecture:** Keep the persistence model backward-compatible by leaving `User.StudentCode` in the database entity and legacy/internal flows, while narrowing the auth contract to `email`, `password`, and `fullName` only. Implement the change in three vertical slices: backend auth contract/service, backend integration coverage, and reader web contract/validation cleanup.

**Tech Stack:** ASP.NET Core 9, FluentValidation, MongoDB.Driver, xUnit, FluentAssertions, Next.js 16.2.10, React 19.2.4, react-hook-form, Zod, Zustand, ESLint

## Global Constraints

- Remove `StudentCode` from the request contract of `POST /api/auth/register`.
- Remove `StudentCode` validation from the backend register validator.
- Remove duplicate-`StudentCode` checks and `StudentCode` assignment from `AuthService.RegisterAsync`.
- Keep `User.StudentCode` in the entity/database for backward-compatible persistence.
- Remove `StudentCode` from auth-facing response DTOs used by register/login/profile.
- Keep the default `STUDENT` role assignment unchanged after self-registration.
- Align frontend and backend password rules to a minimum length of 8 characters.
- Do not refactor unrelated admin flows, user management flows, or perform data migration.
- Verify self-registration, login, and profile flows still work after the contract change.

---

## File Structure

- `apps/api/Modules/Auth/DTOs/AuthDtos.cs` — owns the auth request/response contracts. This is where `RegisterRequest` and `UserProfileDto` must stop exposing `StudentCode`.
- `apps/api/Modules/Auth/Validators/RegisterValidator.cs` — owns self-registration validation rules. This is where the `StudentCode` validation path must be deleted while preserving the email/password/full-name rules.
- `apps/api/Modules/Auth/Services/AuthService.cs` — owns registration, session creation, and auth-facing profile mapping. This is where the service must stop depending on `StudentCode` for self-registration and response shaping.
- `apps/api.Tests/Modules/Auth/AuthRegistrationContractTests.cs` — new integration-style auth tests focused on register/login/profile contract behavior after the change.
- `apps/web/src/components/auth/RegisterForm.tsx` — owns reader signup form validation and payload shape. This is where the password minimum and backend error presentation must match the new backend contract.
- `apps/web/src/store/auth-store.ts` — owns the auth user shape cached in the reader portal. This is where the ghost `studentCode` field must be removed from the reader-facing user type.

### Task 1: Remove StudentCode from backend auth contracts and service

**Files:**
- Modify: `apps/api/Modules/Auth/DTOs/AuthDtos.cs`
- Modify: `apps/api/Modules/Auth/Validators/RegisterValidator.cs`
- Modify: `apps/api/Modules/Auth/Services/AuthService.cs`

**Interfaces:**
- Consumes: existing `RegisterRequest`, `UserProfileDto`, `RegisterValidator`, and `AuthService.RegisterAsync(RegisterRequest request)`.
- Produces:
  - `public class RegisterRequest { public string Email { get; set; } public string Password { get; set; } public string FullName { get; set; } }`
  - `public class UserProfileDto { public string Id { get; set; } public string Email { get; set; } public string FullName { get; set; } public string? PhoneNumber { get; set; } public bool NotifyBookAvailable { get; set; } public string? BranchId { get; set; } public string? Avatar { get; set; } public List<string> Roles { get; set; } public List<string> Permissions { get; set; } }`
  - `Task<LoginResponse> AuthService.RegisterAsync(RegisterRequest request)` that no longer checks or assigns `StudentCode`.

- [ ] **Step 1: Write the failing contract expectations directly into the auth integration test file stub**

Create `apps/api.Tests/Modules/Auth/AuthRegistrationContractTests.cs` with this starter content:

```csharp
using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using api.Tests.TestSupport;
using FluentAssertions;
using MongoDB.Driver;
using Xunit;

namespace api.Tests.Modules.Auth;

public sealed class AuthRegistrationContractTests : IClassFixture<ApiWebApplicationFactory>
{
    private readonly ApiWebApplicationFactory _factory;

    public AuthRegistrationContractTests(ApiWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public void Register_request_contract_does_not_expose_student_code()
    {
        typeof(api.Auth.DTOs.RegisterRequest).GetProperties().Select(x => x.Name)
            .Should().BeEquivalentTo(["Email", "Password", "FullName"]);
    }

    [Fact]
    public void User_profile_contract_does_not_expose_student_code()
    {
        typeof(api.Auth.DTOs.UserProfileDto).GetProperties().Select(x => x.Name)
            .Should().NotContain("StudentCode");
    }
}
```

- [ ] **Step 2: Run the backend auth contract tests to verify they fail**

Run:

```bash
dotnet test apps/api.Tests/apps.api.Tests.csproj --filter "FullyQualifiedName~AuthRegistrationContractTests"
```

Expected: FAIL because `RegisterRequest` still has `StudentCode` and `UserProfileDto` still has `StudentCode`.

- [ ] **Step 3: Remove StudentCode from the auth DTOs**

Update `apps/api/Modules/Auth/DTOs/AuthDtos.cs` so the relevant classes look like this:

```csharp
public class RegisterRequest
{
    public string Email { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public string FullName { get; set; } = string.Empty;
}

public class UserProfileDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public bool NotifyBookAvailable { get; set; } = true;
    public string? BranchId { get; set; }
    public string? Avatar { get; set; }
    public List<string> Roles { get; set; } = new();
    public List<string> Permissions { get; set; } = new();
}
```

- [ ] **Step 4: Remove StudentCode rules from the registration validator**

Edit `apps/api/Modules/Auth/Validators/RegisterValidator.cs` to delete the `RuleFor(x => x.StudentCode)` block entirely. The file should keep only the `Email`, `Password`, and `FullName` rules, ending like this:

```csharp
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Họ tên là bắt buộc.")
            .MinimumLength(2).WithMessage("Họ tên tối thiểu 2 ký tự.")
            .MaximumLength(50).WithMessage("Họ tên tối đa 50 ký tự.")
            .Must(name => !string.IsNullOrWhiteSpace(name)).WithMessage("Họ tên không được chứa toàn khoảng trắng.");
```

- [ ] **Step 5: Remove StudentCode checks and mappings from AuthService**

Edit `apps/api/Modules/Auth/Services/AuthService.cs` in three places.

1. Replace the registration method body section with:

```csharp
    public async Task<LoginResponse> RegisterAsync(RegisterRequest request)
    {
        var emailExists = await _context.Users.Find(u => u.Email == request.Email).AnyAsync();
        if (emailExists)
        {
            throw new ConflictException(ErrorCodes.USER_001, "Email này đã được đăng ký.");
        }

        var user = new User
        {
            Email = request.Email,
            FullName = request.FullName,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Status = StatusValues.User.ACTIVE
        };
        await _context.Users.InsertOneAsync(user);

        var studentRole = await _context.Roles.Find(r => r.Code == "STUDENT").FirstOrDefaultAsync();
        if (studentRole != null)
        {
            var userRole = new UserRole
            {
                UserId = user.Id,
                RoleId = studentRole.Id
            };
            await _context.UserRoles.InsertOneAsync(userRole);
        }

        return await GenerateLoginSessionAsync(user, "DefaultDevice", "0.0.0.0");
    }
```

2. In `GetProfileAsync`, remove the `StudentCode = user.StudentCode,` line so the DTO mapping is:

```csharp
        return new UserProfileDto
        {
            Id = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            PhoneNumber = user.PhoneNumber,
            NotifyBookAvailable = user.NotifyBookAvailable,
            BranchId = user.BranchId,
            Avatar = user.Avatar,
            Roles = roles,
            Permissions = permissions
        };
```

3. In `GenerateLoginSessionAsync`, remove the `StudentCode = user.StudentCode,` line so the `UserProfileDto` mapping is:

```csharp
            User = new UserProfileDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                BranchId = user.BranchId,
                Avatar = user.Avatar,
                Roles = roles,
                Permissions = permissions
            }
```

- [ ] **Step 6: Run the focused backend auth contract tests again**

Run:

```bash
dotnet test apps/api.Tests/apps.api.Tests.csproj --filter "FullyQualifiedName~AuthRegistrationContractTests"
```

Expected: PASS for the DTO contract assertions.

- [ ] **Step 7: Commit the backend auth contract cleanup**

```bash
git add apps/api/Modules/Auth/DTOs/AuthDtos.cs apps/api/Modules/Auth/Validators/RegisterValidator.cs apps/api/Modules/Auth/Services/AuthService.cs apps/api.Tests/Modules/Auth/AuthRegistrationContractTests.cs
git commit -m "refactor(auth): remove student code from reader register contract"
```

### Task 2: Add end-to-end backend coverage for register, login, and profile without StudentCode

**Files:**
- Modify: `apps/api.Tests/Modules/Auth/AuthRegistrationContractTests.cs`
- Test: `apps/api.Tests/Modules/Auth/AuthRegistrationContractTests.cs`

**Interfaces:**
- Consumes:
  - `POST /api/auth/register` body `{ email, password, fullName }`
  - `POST /api/auth/login` body `{ email, password }`
  - `GET /api/auth/profile`
  - `ApiWebApplicationFactory : WebApplicationFactory<Program>`
- Produces:
  - Regression tests proving register/login/profile work without `studentCode`
  - Assertions that auth responses do not include a `studentCode` field

- [ ] **Step 1: Expand the failing test file with register/login/profile flow tests**

Append these tests to `apps/api.Tests/Modules/Auth/AuthRegistrationContractTests.cs`:

```csharp
    [Fact]
    public async Task Register_succeeds_with_email_password_and_full_name_only()
    {
        using var client = _factory.CreateClient();
        var email = $"reader-{Guid.NewGuid():N}@gmail.com";

        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            email,
            password = "ReaderPass123!",
            fullName = "Reader Contract Test"
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = JsonNode.Parse(await response.Content.ReadAsStringAsync())!.AsObject();
        body["success"]!.GetValue<bool>().Should().BeTrue();
        body["data"]!["user"]!["email"]!.GetValue<string>().Should().Be(email);
        body["data"]!["user"]!["fullName"]!.GetValue<string>().Should().Be("Reader Contract Test");
        body["data"]!["user"]!["studentCode"].Should().BeNull();
    }

    [Fact]
    public async Task Register_rejects_password_shorter_than_eight_characters()
    {
        using var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            email = $"short-{Guid.NewGuid():N}@gmail.com",
            password = "Aa1!aa",
            fullName = "Short Password"
        });

        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);

        var body = JsonNode.Parse(await response.Content.ReadAsStringAsync())!.AsObject();
        body["message"]!.GetValue<string>().Should().Be("Validation failed");
        body["details"]!.AsArray()
            .Any(detail => detail!["field"]!.GetValue<string>() == "Password"
                        && detail["message"]!.GetValue<string>() == "Mật khẩu tối thiểu 8 ký tự.")
            .Should().BeTrue();
    }

    [Fact]
    public async Task Login_and_profile_responses_do_not_expose_student_code_for_self_registered_reader()
    {
        using var client = _factory.CreateClient(new() { HandleCookies = true });
        var email = $"profile-{Guid.NewGuid():N}@gmail.com";
        const string password = "ReaderPass123!";

        var registerResponse = await client.PostAsJsonAsync("/api/auth/register", new
        {
            email,
            password,
            fullName = "Profile Reader"
        });
        registerResponse.EnsureSuccessStatusCode();

        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new
        {
            email,
            password
        });
        loginResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var loginBody = JsonNode.Parse(await loginResponse.Content.ReadAsStringAsync())!.AsObject();
        loginBody["data"]!["user"]!["studentCode"].Should().BeNull();

        var profileResponse = await client.GetAsync("/api/auth/profile");
        profileResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var profileBody = JsonNode.Parse(await profileResponse.Content.ReadAsStringAsync())!.AsObject();
        profileBody["data"]!["studentCode"].Should().BeNull();
        profileBody["data"]!["email"]!.GetValue<string>().Should().Be(email);
    }
```

- [ ] **Step 2: Run the new register/login/profile tests to verify current failures**

Run:

```bash
dotnet test apps/api.Tests/apps.api.Tests.csproj --filter "FullyQualifiedName~AuthRegistrationContractTests.Register|FullyQualifiedName~AuthRegistrationContractTests.Login"
```

Expected: FAIL until the service/DTO changes from Task 1 are in place, or FAIL if any response still exposes `studentCode` or validation mismatches remain.

- [ ] **Step 3: Fix any remaining auth response or validation mismatch discovered by the tests**

If any response still serializes `studentCode`, ensure `UserProfileDto` is the only auth-facing shape returned from register/login/profile and contains no `StudentCode` property. The final DTO must remain:

```csharp
public class UserProfileDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public bool NotifyBookAvailable { get; set; } = true;
    public string? BranchId { get; set; }
    public string? Avatar { get; set; }
    public List<string> Roles { get; set; } = new();
    public List<string> Permissions { get; set; } = new();
}
```

If the password validation assertion fails, ensure the backend validator keeps:

```csharp
RuleFor(x => x.Password)
    .NotEmpty().WithMessage("Mật khẩu là bắt buộc.")
    .MinimumLength(8).WithMessage("Mật khẩu tối thiểu 8 ký tự.")
    .MaximumLength(32).WithMessage("Mật khẩu tối đa 32 ký tự.")
    .Matches(@"[A-Z]").WithMessage("Mật khẩu phải chứa ít nhất 1 chữ hoa.")
    .Matches(@"[a-z]").WithMessage("Mật khẩu phải chứa ít nhất 1 chữ thường.")
    .Matches(@"[0-9]").WithMessage("Mật khẩu phải chứa ít nhất 1 chữ số.")
    .Matches(@"[!@#$%^&*()_+=\-\[\]{};':\"",.<>/?|\\~`]").WithMessage("Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt.");
```

- [ ] **Step 4: Run the focused auth test suite until it passes**

Run:

```bash
dotnet test apps/api.Tests/apps.api.Tests.csproj --filter "FullyQualifiedName~AuthRegistrationContractTests"
```

Expected: PASS with register/login/profile verified and no `studentCode` in the auth responses.

- [ ] **Step 5: Run a broader backend regression pass for auth-related tests**

Run:

```bash
dotnet test apps/api.Tests/apps.api.Tests.csproj --filter "FullyQualifiedName~Auth"
```

Expected: PASS for `AuthSecurityTests` and `AuthRegistrationContractTests`.

- [ ] **Step 6: Commit the backend regression coverage**

```bash
git add apps/api.Tests/Modules/Auth/AuthRegistrationContractTests.cs
git commit -m "test(auth): cover student-code-free reader registration"
```

### Task 3: Align the reader web signup flow and auth store with the new contract

**Files:**
- Modify: `apps/web/src/components/auth/RegisterForm.tsx`
- Modify: `apps/web/src/store/auth-store.ts`

**Interfaces:**
- Consumes:
  - backend register request `{ email: string; password: string; fullName: string; }`
  - backend auth user payload without `studentCode`
  - `Validation failed` response with `details` entries shaped like `{ field, code, message }`
- Produces:
  - reader signup form enforcing an 8-character minimum password
  - `User` auth store type without `studentCode`
  - signup UI that prefers field-level backend validation messages when present

- [ ] **Step 1: Write the failing frontend expectations as explicit code targets**

Use this target shape while editing `apps/web/src/components/auth/RegisterForm.tsx` and `apps/web/src/store/auth-store.ts`:

```ts
const registerSchema = z.object({
  fullName: z.string().min(2, 'Họ và tên độc giả phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không đúng định dạng'),
  password: z
    .string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .regex(/[A-Z]/, 'Phải chứa chữ hoa')
    .regex(/[a-z]/, 'Phải chứa chữ thường')
    .regex(/[0-9]/, 'Phải chứa chữ số')
    .regex(/[\W_]/, 'Phải chứa ký tự đặc biệt'),
  confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
});
```

and:

```ts
export interface User {
  id: string;
  email: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string | null;
  branchId?: string;
  branchName?: string;
  role?: string;
  roles?: string[];
  permissions?: string[];
}
```

- [ ] **Step 2: Update the signup schema and copy to the 8-character minimum**

In `apps/web/src/components/auth/RegisterForm.tsx`, change both the schema and placeholder text.

1. Replace:

```ts
.min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
```

with:

```ts
.min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
```

2. Replace the password placeholder:

```tsx
placeholder="Tối thiểu 6 ký tự"
```

with:

```tsx
placeholder="Tối thiểu 8 ký tự"
```

- [ ] **Step 3: Prefer backend validation detail messages over the generic title**

Still in `apps/web/src/components/auth/RegisterForm.tsx`, update the `catch` block to extract the first backend validation detail message when present:

```ts
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.details?.[0]?.message
          || err.response?.data?.message
          || err.response?.data?.title
        : undefined;
      setSubmitError(message || 'Đăng ký thất bại. Vui lòng thử lại sau.');
    }
```

- [ ] **Step 4: Remove the ghost studentCode field from the reader auth store type**

Edit `apps/web/src/store/auth-store.ts` so the `User` interface becomes:

```ts
export interface User {
  id: string;
  email: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string | null;
  branchId?: string;
  branchName?: string;
  role?: string;
  roles?: string[];
  permissions?: string[];
}
```

No other logic change is required in this file.

- [ ] **Step 5: Run the web lint check to verify the reader portal still typechecks cleanly**

Run:

```bash
npm --prefix apps/web run lint
```

Expected: PASS with no TypeScript/ESLint errors caused by removing `studentCode` from the auth store type.

- [ ] **Step 6: Manually smoke the reader signup flow against the running API**

Run the backend and reader app, then verify this exact sequence in the browser:

1. Open `/register`.
2. Enter a password with 7 characters such as `Aa1!aaa`.
3. Confirm the form blocks submission with `Mật khẩu phải có ít nhất 8 ký tự`.
4. Enter a valid password such as `Aa1!aaaa`.
5. Submit a new `@gmail.com` address.
6. Confirm the success state appears.
7. Log in with the new account.
8. Confirm the reader session works and no UI expects a `studentCode` field.

Expected: register succeeds without any `studentCode` input, and the user can log in immediately afterward.

- [ ] **Step 7: Commit the reader web contract alignment**

```bash
git add apps/web/src/components/auth/RegisterForm.tsx apps/web/src/store/auth-store.ts
git commit -m "fix(web): align reader signup with email-only auth contract"
```

## Spec Coverage Check

- Remove `StudentCode` from `POST /api/auth/register` request contract — covered by Task 1.
- Remove `StudentCode` validation from backend register validator — covered by Task 1.
- Remove duplicate-check and assignment logic from `AuthService.RegisterAsync` — covered by Task 1.
- Keep `User.StudentCode` in the entity/database — preserved by omission in all tasks; no task edits the entity.
- Remove `StudentCode` from auth-facing register/login/profile responses — covered by Tasks 1 and 2.
- Align frontend signup payload and password minimum with backend — covered by Task 3.
- Remove ghost `studentCode` typing from `apps/web` auth state — covered by Task 3.
- Verify self-registration, login, and profile still work — covered by Tasks 2 and 3.

## Placeholder Scan

- No `TODO`, `TBD`, or deferred implementation notes remain.
- Each code-edit step includes concrete replacement code.
- Each verification step includes exact commands or exact manual smoke actions.

## Type Consistency Check

- `RegisterRequest` is consistently defined as `{ Email, Password, FullName }` across Tasks 1 and 2.
- `UserProfileDto` is consistently defined without `StudentCode` across Tasks 1 and 2.
- Reader `User` auth store type is consistently defined without `studentCode` in Task 3.
- Backend validation minimum password length is consistently 8 and matched by the frontend schema in Task 3.
