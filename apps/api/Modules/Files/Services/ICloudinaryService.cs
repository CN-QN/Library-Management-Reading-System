using CloudinaryDotNet.Actions;

namespace api.Modules.Files.Services
{
    public interface ICloudinaryService
    {
        /// <summary>Upload ảnh lên Cloudinary, trả về ImageUploadResult</summary>
        Task<ImageUploadResult> UploadImageAsync(
            IFormFile file,
            string folder,
            string publicId);

        /// <summary>Xóa ảnh khỏi Cloudinary theo publicId</summary>
        Task<DeletionResult> DeleteImageAsync(string publicId);
    }
}
