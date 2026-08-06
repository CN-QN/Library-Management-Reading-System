using MongoDB.Bson; 
using api.Database.Entities;
using api.Repositories.Interfaces;
using MongoDB.Driver;
namespace api.Modules.Catalog.DTOs.Requests
{
    public class UpdateStatusDto
    {
        public string Status { get; set; } = string.Empty;
    }
}
