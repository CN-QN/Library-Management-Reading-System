using System.Text;
using api.Auth;
using api.Configuration;
using api.Database;
using api.Database.Indexes;
using api.Database.Seed;
using api.Middleware;
using api.Roles;
using api.Users;
using api.Common.Filters;
using api.Common.Redis;
using api.Modules.Catalog.Services;
using api.Modules.DigitalContent.Services;
using api.Modules.Inventory.Services;
using api.Modules.Circulation.Services;
using api.Modules.ReservationsAndFines.Services;
using api.Modules.Reading.Services;
using api.Modules.SearchAndRecommendation.Services;
using api.Workers;
using api.Modules.Notifications.Services;
using api.Modules.Files.Services;
using api.Repositories.Implementations;
using api.Repositories.Interfaces;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using MongoDB.Driver;
using Microsoft.Extensions.Caching.StackExchangeRedis;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateLogger();

try
{
    // Nạp cấu hình từ file .env cục bộ nếu có trước khi khởi tạo WebApplication
    EnvLoader.Load();

    Log.Information("Starting Web Host...");

    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((ctx, lc) => lc
        .WriteTo.Console()
        .ReadFrom.Configuration(ctx.Configuration));

    builder.Services.Configure<MongoDbSettings>(builder.Configuration.GetSection("MongoDb"));
    builder.Services.Configure<RedisSettings>(builder.Configuration.GetSection("Redis"));
    builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));

    builder.Services.AddSingleton<MongoDbContext>();
    builder.Services.AddSingleton<RedisContext>();

    builder.Services.AddSingleton<IMongoDatabase>(sp =>
    {
        var context = sp.GetRequiredService<MongoDbContext>();
        return context.Database;
    });

    builder.Services.AddScoped<IndexCreator>();
    builder.Services.AddScoped<SeedRunner>();

    builder.Services.AddScoped<IFileService, FileService>();

    builder.Services.AddStackExchangeRedisCache(options =>
    {
        options.Configuration = builder.Configuration.GetConnectionString("Redis")
            ?? "localhost:6379";
        options.InstanceName = "LibraryHub_";
    });

    builder.Services.AddAuthorization();

    builder.Services.AddScoped<JwtService>();
    builder.Services.AddScoped<AuthService>();
    builder.Services.AddScoped<UsersService>();
    builder.Services.AddScoped<RolesService>();
builder.Services.AddScoped<
    api.Modules.Circulation.Services.IBorrowingService,
    api.Modules.Circulation.Services.BorrowingService
>();
    builder.Services.AddScoped<IBookService, BookService>();
    builder.Services.AddScoped<IChapterService, ChapterService>();

    // ===== REDIS HELPERS =====
    builder.Services.AddSingleton<RedisLockHelper>();

    // ===== CIRCULATION MODULE (M06) =====
    builder.Services.AddScoped<IBorrowingService, BorrowingService>();

    // ===== RESERVATIONS & FINES MODULE (M07) =====
    builder.Services.AddScoped<IReservationService, ReservationService>();
    builder.Services.AddScoped<IFineService, FineService>();
    builder.Services.AddHostedService<ReservationExpiryWorker>(); // Background worker: xử lý đặt trước hết hạn mỗi 30 phút

    // ===== READING MODULE (M09) =====
    builder.Services.AddScoped<IReadingProgressService, ReadingProgressService>();
    builder.Services.AddHostedService<ReadingProgressSyncWorker>();

    // ===== SEARCH & RECOMMENDATION MODULE (M12) =====
    builder.Services.AddScoped<ISearchRecommendationService, SearchRecommendationService>();
    builder.Services.AddScoped<ISearchRecommendationRepository, SearchRecommendationRepository>();

    // ===== NOTIFICATION MODULE (M13) =====
    builder.Services.AddScoped<INotificationService, NotificationService>();
    builder.Services.AddScoped<INotificationRepository, NotificationRepository>();
    builder.Services.AddScoped<ICopyService, CopyService>();

    builder.Services.AddScoped<IBookRepository, BookRepository>();
    builder.Services.AddScoped<IChapterRepository, ChapterRepository>();
    builder.Services.AddScoped<IAuthorRepository, AuthorRepository>();
    builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
    builder.Services.AddScoped<ICopyRepository, CopyRepository>();
    builder.Services.AddScoped<IPublisherRepository, PublisherRepository>();
    builder.Services.AddScoped<IBorrowingRepository, BorrowingRepository>();
    builder.Services.AddScoped<IFineRepository, FineRepository>();
    builder.Services.AddScoped<IReservationRepository, ReservationRepository>();

    builder.Services.AddScoped<IReadingProgressRepository, ReadingProgressRepository>();
    builder.Services.AddScoped<IReadingSessionRepository, ReadingSessionRepository>();
    builder.Services.AddScoped<IInventoryTransactionRepository, InventoryTransactionRepository>();

    var jwtSettings = builder.Configuration.GetSection("Jwt").Get<JwtSettings>()
        ?? throw new InvalidOperationException("JWT settings are not configured.");
    var key = Encoding.ASCII.GetBytes(jwtSettings.Secret);

    builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false;
        options.SaveToken = true;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidAudience = jwtSettings.Audience,
            ClockSkew = TimeSpan.Zero
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var token = context.Request.Cookies["accessToken"];
                if (!string.IsNullOrEmpty(token))
                {
                    context.Token = token;
                }
                return Task.CompletedTask;
            }
        };
    });

    var corsOrigins = builder.Configuration.GetValue<string>("CORS_ORIGINS") ?? "*";
    var originsList = corsOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries);

    builder.Services.AddCors(options =>
    {
        options.AddDefaultPolicy(policy =>
        {
            if (originsList.Length == 1 && originsList[0] == "*")
            {
                policy.SetIsOriginAllowed(origin => true)
                      .AllowAnyHeader()
                      .AllowAnyMethod()
                      .AllowCredentials();
            }
            else
            {
                policy.WithOrigins(originsList)
                      .AllowAnyHeader()
                      .AllowAnyMethod()
                      .AllowCredentials();
            }
        });
    });

    builder.Services.AddHttpContextAccessor();
    builder.Services.AddValidatorsFromAssemblyContaining<Program>();
    builder.Services.AddControllers(options =>
    {
        options.Filters.Add<FluentValidationFilter>();
    });

    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(options =>
    {
        options.SwaggerDoc("v1", new OpenApiInfo { Title = "LibraryHub API", Version = "v1" });
        options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Description = "JWT Authorization header using the Bearer scheme.",
            Name = "Authorization",
            In = ParameterLocation.Header,
            Type = SecuritySchemeType.ApiKey,
            Scheme = "Bearer"
        });
        options.AddSecurityRequirement(new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
                },
                Array.Empty<string>()
            }
        });
    });

    var app = builder.Build();

    using (var scope = app.Services.CreateScope())
    {
        var services = scope.ServiceProvider;
        try
        {
            var indexCreator = services.GetRequiredService<IndexCreator>();
            var seedRunner = services.GetRequiredService<SeedRunner>();

            await indexCreator.CreateIndexesAsync();
            await seedRunner.RunSeedAsync();
        }
        catch (Exception ex)
        {
            Log.Fatal(ex, "An error occurred during database initialization.");
        }
    }

    app.UseMiddleware<TraceIdMiddleware>();
    app.UseCors();
    app.UseMiddleware<ExceptionHandlingMiddleware>();
    app.UseMiddleware<RateLimitMiddleware>();
    app.UseMiddleware<AuditLogMiddleware>();

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    app.UseAuthentication();
    app.UseAuthorization();
    app.MapControllers();

    await app.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Host terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}