# Reader Self-Registration Without StudentCode Design

## Goal

Loại bỏ hoàn toàn `StudentCode` khỏi luồng tự đăng ký tài khoản độc giả, và chuyển auth-facing contract sang mô hình **email là định danh duy nhất** cho reader self-registration.

## Scope

### In scope

- Xóa `StudentCode` khỏi request contract của `POST /api/auth/register`.
- Xóa validation `StudentCode` khỏi backend register validator.
- Xóa logic kiểm tra trùng `StudentCode` và gán `StudentCode` trong `AuthService.RegisterAsync`.
- Đồng bộ `apps/web` register form để payload chỉ còn `email`, `password`, `fullName`.
- Đồng bộ auth-facing response DTO để không còn expose `StudentCode` trong profile/login response của reader auth flow.
- Đồng bộ store/type phía `apps/web` nếu đang assume auth response có `studentCode`.
- Đồng bộ rule password giữa frontend register form và backend validator để tránh pass ở FE nhưng fail ở BE.
- Verify self-registration, login và profile flow vẫn chạy bình thường sau khi đổi contract.

### Out of scope

- Không xóa `StudentCode` khỏi `User` entity hoặc toàn bộ domain model trong đợt này.
- Không migration dữ liệu cũ trong MongoDB.
- Không refactor các admin flows hoặc user management flows khác ngoài phạm vi bị ảnh hưởng trực tiếp bởi auth-facing contract.
- Không đổi role mặc định được gán sau khi tự đăng ký.

## Current problem

Hiện tại frontend reader register form không còn gửi `studentCode`, nhưng backend auth contract vẫn yêu cầu field này:

- `apps/web/src/components/auth/RegisterForm.tsx` chỉ gửi `email`, `password`, `fullName`.
- `apps/api/Modules/Auth/DTOs/AuthDtos.cs` vẫn giữ `RegisterRequest.StudentCode`.
- `apps/api/Modules/Auth/Validators/RegisterValidator.cs` vẫn `NotEmpty()` và validate định dạng `StudentCode`.
- `apps/api/Modules/Auth/Services/AuthService.cs` vẫn kiểm tra uniqueness theo `StudentCode` và gán giá trị đó vào `User` khi self-register.

Kết quả là self-registration fail với lỗi validation dù UI không còn trường `StudentCode`.

Ngoài ra frontend hiện cho phép mật khẩu tối thiểu 6 ký tự, trong khi backend yêu cầu tối thiểu 8 ký tự, tạo thêm một mismatch contract khác trong cùng luồng.

## Design principles

1. **Email-first auth contract**: self-registration chỉ dùng email làm định danh public-facing.
2. **Targeted change**: chỉ sửa các lớp auth/register/profile cần thiết để khôi phục và làm sạch self-registration, không đại phẫu toàn bộ domain.
3. **Backward-compatible persistence**: giữ nguyên `User.StudentCode` ở entity/database để tránh làm vỡ các module khác và dữ liệu cũ.
4. **Consistent validation across FE/BE**: frontend và backend phải thống nhất rule password và request shape.
5. **No ghost fields in auth response**: nếu auth flow không còn dùng `StudentCode`, response auth/profile cũng không nên tiếp tục expose field đó.

## Target design

## 1. Register API contract

`POST /api/auth/register` sẽ nhận body chỉ gồm:

- `email`
- `password`
- `fullName`

`RegisterRequest` sẽ bỏ property `StudentCode`.

## 2. Register validation

`RegisterValidator` sẽ chỉ validate:

- `Email`
  - bắt buộc
  - đúng định dạng
  - tối đa 100 ký tự
  - domain `@gmail.com`
  - unique trong hệ thống
- `Password`
  - bắt buộc
  - tối thiểu 8 ký tự
  - tối đa 32 ký tự
  - có chữ hoa, chữ thường, số, ký tự đặc biệt
- `FullName`
  - bắt buộc
  - tối thiểu 2 ký tự
  - tối đa 50 ký tự
  - không toàn khoảng trắng

Toàn bộ rule liên quan `StudentCode` bị xóa khỏi validator.

## 3. Register service behavior

`AuthService.RegisterAsync` sẽ đổi sang flow:

1. kiểm tra email đã tồn tại chưa
2. hash password
3. tạo `User` mới với:
   - `Email`
   - `FullName`
   - `PasswordHash`
   - `Status`
4. không kiểm tra duplicate `StudentCode`
5. không gán `StudentCode` cho user tự đăng ký
6. gán role mặc định `STUDENT` như hiện tại
7. tạo login session như hiện tại

Kết quả là user self-register mới sẽ không có `StudentCode`, và email trở thành định danh duy nhất trong auth-facing flow này.

## 4. Auth/profile response cleanup

Để contract auth nhất quán với mục tiêu email-first, `StudentCode` sẽ bị xóa khỏi:

- `UserProfileDto`
- mapping trong `GetProfileAsync`
- mapping trong `GenerateLoginSessionAsync`

Điều này đảm bảo:

- register response không trả `studentCode`
- login response không trả `studentCode`
- `GET /api/auth/profile` không trả `studentCode`

## 5. Reader web updates

### Register form

`apps/web/src/components/auth/RegisterForm.tsx` sẽ tiếp tục gửi payload không có `studentCode`, vì đây là shape mới đúng của backend contract.

Ngoài ra, frontend password schema phải tăng từ minimum 6 lên minimum 8 để đồng bộ với backend validator.

### Auth store typing

`apps/web/src/store/auth-store.ts` đang có type `User` chứa `studentCode?: string;`.

Vì auth/profile response sẽ không còn expose `studentCode`, type auth store nên được dọn lại để phản ánh đúng contract mới và tránh ghost field phía reader portal.

## 6. Compatibility boundary

`StudentCode` vẫn được giữ ở:

- `User` entity
- dữ liệu cũ trong MongoDB
- các flows khác ngoài auth/self-registration chưa nằm trong scope này

Điều này cho phép:

- user cũ có `StudentCode` vẫn hoạt động bình thường
- các module admin hoặc internal flow chưa refactor ngay không bị chạm ngoài phạm vi cần thiết

Nhưng trong self-registration và reader auth flow, `StudentCode` không còn là part of contract nữa.

## File impact summary

### Backend

- `apps/api/Modules/Auth/DTOs/AuthDtos.cs`
- `apps/api/Modules/Auth/Validators/RegisterValidator.cs`
- `apps/api/Modules/Auth/Services/AuthService.cs`
- có thể cần rà nhanh các test liên quan register/profile auth

### Reader web

- `apps/web/src/components/auth/RegisterForm.tsx`
- `apps/web/src/store/auth-store.ts`
- có thể thêm/đổi typed consumer nào đang assume auth user có `studentCode`

## Risks and mitigations

### Risk: hidden consumers still expect `studentCode` in auth response

**Mitigation:** rà các usage của `UserProfileDto` và auth store type trước khi bỏ field khỏi response; update các consumer trong `apps/web` cùng lượt.

### Risk: password validation still mismatched

**Mitigation:** chỉnh schema frontend từ min 6 lên min 8 trong cùng change set và verify UI message tương ứng.

### Risk: other domain flows still rely on `User.StudentCode`

**Mitigation:** không xóa field khỏi entity/database trong đợt này; chỉ bỏ nó khỏi self-registration and auth-facing contract.

## Testing strategy

### Backend verification

- register thành công khi chỉ gửi `email`, `password`, `fullName`
- register fail đúng khi email trùng
- register fail đúng khi password không đạt chuẩn
- login sau register vẫn thành công
- profile response không còn `studentCode`

### Frontend verification

- register form submit thành công mà không cần `studentCode`
- password dưới 8 ký tự bị chặn ngay từ frontend
- nếu backend trả validation error thì UI hiển thị thông điệp phù hợp thay vì chỉ generic failure khi có thể
- auth store vẫn nhận và lưu user data đúng sau login/checkAuth

## Acceptance criteria

- `POST /api/auth/register` không còn nhận hoặc yêu cầu `studentCode`.
- Reader register form không cần `studentCode` và submit thành công với contract mới.
- `RegisterValidator` không còn bất kỳ rule nào cho `StudentCode`.
- `AuthService.RegisterAsync` không còn check duplicate hoặc set `StudentCode` cho self-registration.
- Login/register/profile auth responses không còn expose `studentCode`.
- Frontend password validation khớp backend minimum length 8.
- User self-register mới có thể đăng ký, đăng nhập và lấy profile chỉ với email/password/full name.
- Dữ liệu user cũ có `StudentCode` không làm auth flow bị lỗi.
