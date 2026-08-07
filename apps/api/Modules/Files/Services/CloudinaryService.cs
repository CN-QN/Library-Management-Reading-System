using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using api.Configuration;
using Microsoft.Extensions.Options;

namespace api.Modules.Files.Services
{
    public class CloudinaryService : ICloudinaryService
    {
        private readonly Cloudinary _cloudinary;
        private readonly ILogger<CloudinaryService> _logger;

        public CloudinaryService(
            IOptions<CloudinarySettings> settings,
            ILogger<CloudinaryService> logger)
        {
            _logger = logger;

            var cfg = settings.Value;
            var account = new Account(cfg.CloudName, cfg.ApiKey, cfg.ApiSecret);
            _cloudinary = new Cloudinary(account) { Api = { Secure = true } };
        }

        public async Task<ImageUploadResult> UploadImageAsync(
            IFormFile file,
            string folder,
            string publicId)
        {
            using var stream = file.OpenReadStream();

            var uploadParams = new ImageUploadParams
            {
                File         = new FileDescription(file.FileName, stream),
                Folder       = folder,
                PublicId     = publicId,
                Overwrite    = true,
                Transformation = new Transformation()
                    .Quality("auto")
                    .FetchFormat("auto")
            };

            var result = await _cloudinary.UploadAsync(uploadParams);

            if (result.Error != null)
            {
                _logger.LogError("Cloudinary upload error: {Msg}", result.Error.Message);
                throw new Exception($"Cloudinary upload failed: {result.Error.Message}");
            }

            _logger.LogInformation("Uploaded to Cloudinary: {Url}", result.SecureUrl);
            return result;
        }

        public async Task<DeletionResult> DeleteImageAsync(string publicId)
        {
            var deleteParams = new DeletionParams(publicId);
            var result = await _cloudinary.DestroyAsync(deleteParams);

            if (result.Error != null)
                _logger.LogWarning("Cloudinary delete error for {PublicId}: {Msg}", publicId, result.Error.Message);
            else
                _logger.LogInformation("Deleted from Cloudinary: {PublicId}", publicId);

            return result;
        }
    }
}
