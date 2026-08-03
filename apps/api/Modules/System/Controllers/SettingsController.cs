using api.Auth;
using api.Common.Models;
using api.Database;
using api.Database.Entities;
using api.Modules.System.DTOs;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

namespace api.Modules.System.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SettingsController : ControllerBase
    {
        private readonly MongoDbContext _context;
        private readonly ILogger<SettingsController> _logger;

        public SettingsController(MongoDbContext context, ILogger<SettingsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Lấy toàn bộ cài đặt hệ thống (Yêu cầu quyền setting.read)
        /// </summary>
        [HttpGet]
        [RequirePermission("setting.read")]
        public async Task<IActionResult> GetAllSettings([FromQuery] string? scope)
        {
            try
            {
                var filterBuilder = Builders<SystemSetting>.Filter;
                var filter = filterBuilder.Empty;

                if (!string.IsNullOrWhiteSpace(scope))
                {
                    filter = filterBuilder.Eq(s => s.Scope, scope);
                }

                var settings = await _context.SystemSettings.Find(filter).ToListAsync();
                var result = settings.Select(s => new SystemSettingDto
                {
                    Id = s.Id,
                    Key = s.Key,
                    Value = s.Value,
                    Scope = s.Scope,
                    Description = s.Description,
                    UpdatedBy = s.UpdatedBy,
                    UpdatedAt = s.UpdatedAt
                }).ToList();

                return Ok(ApiResponse<List<SystemSettingDto>>.SuccessResponse(result, "Lấy cài đặt hệ thống thành công."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy cài đặt hệ thống.");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi lấy cài đặt."));
            }
        }

        /// <summary>
        /// Lấy chi tiết một cài đặt theo Key (Yêu cầu quyền setting.read)
        /// </summary>
        [HttpGet("{key}")]
        [RequirePermission("setting.read")]
        public async Task<IActionResult> GetSettingByKey(string key)
        {
            try
            {
                var setting = await _context.SystemSettings.Find(s => s.Key == key).FirstOrDefaultAsync();
                if (setting == null)
                    return NotFound(ApiResponse<object>.ErrorResponse(404, $"Không tìm thấy cài đặt với key '{key}'."));

                var dto = new SystemSettingDto
                {
                    Id = setting.Id,
                    Key = setting.Key,
                    Value = setting.Value,
                    Scope = setting.Scope,
                    Description = setting.Description,
                    UpdatedBy = setting.UpdatedBy,
                    UpdatedAt = setting.UpdatedAt
                };

                return Ok(ApiResponse<SystemSettingDto>.SuccessResponse(dto, "Lấy thông tin cài đặt thành công."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy cài đặt {Key}.", key);
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi lấy cài đặt."));
            }
        }

        /// <summary>
        /// Cập nhật hoặc tạo mới giá trị cài đặt theo Key (Yêu cầu quyền setting.update)
        /// </summary>
        [HttpPut("{key}")]
        [RequirePermission("setting.update")]
        public async Task<IActionResult> UpdateSetting(string key, [FromBody] UpdateSettingDto dto)
        {
            try
            {
                var userId = User.FindFirst("sub")?.Value ?? User.FindFirst("id")?.Value ?? "SYSTEM";
                var setting = await _context.SystemSettings.Find(s => s.Key == key).FirstOrDefaultAsync();

                if (setting == null)
                {
                    setting = new SystemSetting
                    {
                        Key = key,
                        Value = dto.Value,
                        Scope = dto.Scope ?? "SYSTEM",
                        Description = dto.Description,
                        UpdatedBy = userId,
                        UpdatedAt = DateTime.UtcNow
                    };
                    await _context.SystemSettings.InsertOneAsync(setting);
                    _logger.LogInformation("Created new system setting: {Key}", key);
                }
                else
                {
                    setting.Value = dto.Value;
                    if (!string.IsNullOrWhiteSpace(dto.Description)) setting.Description = dto.Description;
                    if (!string.IsNullOrWhiteSpace(dto.Scope)) setting.Scope = dto.Scope;
                    setting.UpdatedBy = userId;
                    setting.UpdatedAt = DateTime.UtcNow;

                    await _context.SystemSettings.ReplaceOneAsync(s => s.Key == key, setting);
                    _logger.LogInformation("Updated system setting: {Key}", key);
                }

                var responseDto = new SystemSettingDto
                {
                    Id = setting.Id,
                    Key = setting.Key,
                    Value = setting.Value,
                    Scope = setting.Scope,
                    Description = setting.Description,
                    UpdatedBy = setting.UpdatedBy,
                    UpdatedAt = setting.UpdatedAt
                };

                return Ok(ApiResponse<SystemSettingDto>.SuccessResponse(responseDto, "Cập nhật cài đặt hệ thống thành công."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi cập nhật cài đặt {Key}.", key);
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi cập nhật cài đặt."));
            }
        }
    }
}
