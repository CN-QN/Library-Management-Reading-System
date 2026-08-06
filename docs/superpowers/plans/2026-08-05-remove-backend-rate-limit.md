# Remove Backend Rate Limit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Disable the backend rate-limit middleware so API requests are no longer blocked with 429 responses, without changing any other backend behavior.

**Architecture:** The change is intentionally minimal: remove the `RateLimitMiddleware` registration from the ASP.NET Core request pipeline and leave the middleware file, Redis integration, authentication, audit logging, and all other backend services untouched. Verification focuses on confirming the middleware is no longer wired into startup and that the backend still builds.

**Tech Stack:** ASP.NET Core (.NET 9), custom middleware pipeline, PowerShell, git

## Global Constraints

- Change only the backend rate-limit behavior requested by the user.
- Do not delete the middleware source file or alter unrelated backend services.
- Verify the backend still builds after removing the middleware registration.
- Create a git branch before pushing because the current branch is `main`.

---

### Task 1: Remove the middleware registration

**Files:**
- Modify: `apps/api/Program.cs:246-250`
- Test: `apps/api/Program.cs`

**Interfaces:**
- Consumes: Existing ASP.NET Core middleware registration sequence in `Program.cs`
- Produces: Backend startup pipeline without `app.UseMiddleware<RateLimitMiddleware>();`

- [ ] **Step 1: Write the failing test**

This change is configuration-only in startup wiring, so use a build verification instead of a new automated unit test.

```text
No new test file is required because the observable behavior is the absence of middleware registration in Program.cs.
```

- [ ] **Step 2: Run test to verify current state fails the requested behavior**

Run: `Select-String -Path "apps/api/Program.cs" -Pattern "UseMiddleware<RateLimitMiddleware>"`
Expected: One match showing the rate-limit middleware is currently enabled.

- [ ] **Step 3: Write minimal implementation**

Remove this line from `apps/api/Program.cs`:

```csharp
app.UseMiddleware<RateLimitMiddleware>();
```

Keep the surrounding middleware order unchanged.

- [ ] **Step 4: Run test to verify requested behavior now passes**

Run: `Select-String -Path "apps/api/Program.cs" -Pattern "UseMiddleware<RateLimitMiddleware>"`
Expected: No matches.

- [ ] **Step 5: Commit**

```bash
git add apps/api/Program.cs
git commit -m "fix(api): disable backend rate limit"
```

### Task 2: Verify backend still works and publish branch

**Files:**
- Modify: none
- Test: `apps/api/apps-api.sln` or backend project file discovered in `apps/api`

**Interfaces:**
- Consumes: Updated backend startup pipeline from Task 1
- Produces: Verified build output and a pushed git branch containing only the intended change

- [ ] **Step 1: Write the failing test**

Use the backend build as the regression check for startup wiring.

```text
No new source test is required; the build is the verification gate for this infrastructure-only change.
```

- [ ] **Step 2: Run test to verify the project can be checked**

Run: inspect `apps/api` for the correct solution or project file, then run `dotnet build` against it.
Expected before the edit: build succeeds or reports an existing unrelated failure that must be surfaced exactly.

- [ ] **Step 3: Write minimal implementation**

Create a feature branch from the current repository state after verification.

```text
git checkout -b fix/disable-backend-rate-limit
```

- [ ] **Step 4: Run test to verify final state**

Run:
- `dotnet build <backend-sln-or-csproj>`
- `git diff -- apps/api/Program.cs`
- `git status --short`
- `git push -u origin fix/disable-backend-rate-limit`

Expected:
- Backend build succeeds or any pre-existing failure is reported faithfully.
- Diff shows only removal of the rate-limit middleware registration.
- Push succeeds and sets upstream.

- [ ] **Step 5: Commit**

```bash
git add apps/api/Program.cs
git commit -m "fix(api): disable backend rate limit"
```

## Self-Review

- Spec coverage: The plan removes only the backend middleware registration, verifies the backend build, and includes branch/push steps requested by the user.
- Placeholder scan: Kept explicit commands and exact file paths; no TODO/TBD markers remain.
- Type consistency: Uses the exact middleware registration string already present in `apps/api/Program.cs`.
