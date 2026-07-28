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
using api.Modules.Catalog.Services;
using api.Modules.DigitalContent.Services;
using api.Modules.Inventory.Services;
using api.Repositories.Implementations;
using api.Repositories.Interfaces;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using MongoDB.Driver;  // ← THÊM DÒNG NÀY

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateLogger();

try
{
    Log.Information("Starting Web Host...");
    
    var builder = WebApplication.CreateBuilder(args);

    // Setup Serilog
    builder.Host.UseSerilog((ctx, lc) => lc
        .WriteTo.Console()
        .ReadFrom.Configuration(ctx.Configuration));

    // Bind Configuration Sections
    builder.Services.Configure<MongoDbSettings>(builder.Configuration.GetSection("MongoDb"));
    builder.Services.Configure<RedisSettings>(builder.Configuration.GetSection("Redis"));
    builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));

    // Register Db Contexts
    builder.Services.AddSingleton<MongoDbContext>();
    builder.Services.AddSingleton<RedisContext>();

    // ===== ĐĂNG KÝ IMongoDatabase CHO REPOSITORIES =====
    builder.Services.AddSingleton<IMongoDatabase>(sp =>
    {
        var context = sp.GetRequiredService<MongoDbContext>();
        return context.Database;
    });

    // Register Index & Seed helpers
    builder.Services.AddScoped<IndexCreator>();
    builder.Services.AddScoped<SeedRunner>();

    // Register App Services
    builder.Services.AddScoped<JwtService>();
    builder.Services.AddScoped<AuthService>();
    builder.Services.AddScoped<UsersService>();
    builder.Services.AddScoped<RolesService>();
    
    // ===== CATALOG MODULE =====
    builder.Services.AddScoped<IBookService, BookService>();
    // builder.Services.AddScoped<IAuthorService, AuthorService>(); // Khi có
    // builder.Services.AddScoped<ICategoryService, CategoryService>(); // Khi có

    // ===== DIGITAL CONTENT MODULE =====
    builder.Services.AddScoped<IChapterService, ChapterService>();

    // ===== INVENTORY MODULE =====
    builder.Services.AddScoped<ICopyService, CopyService>();

    // ===== REPOSITORIES =====
    builder.Services.AddScoped<IBookRepository, BookRepository>();
    builder.Services.AddScoped<IChapterRepository, ChapterRepository>();
    builder.Services.AddScoped<IAuthorRepository, AuthorRepository>();
    builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
    builder.Services.AddScoped<ICopyRepository, CopyRepository>();
    builder.Services.AddScoped<IPublisherRepository, PublisherRepository>();

    // JWT Bearer Auth Setup
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

    builder.Services.AddAuthorization();

    // CORS Setup
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
    
    // Add Swagger with Security options
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(options =>
    {
        options.SwaggerDoc("v1", new OpenApiInfo { Title = "LibraryHub API", Version = "v1" });
        options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token in the text input below. Example: 'Bearer 12345abcdef'",
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

    // Startup Tasks: Run Index Creator & Seed Runner
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

    // Configure request pipeline
    app.UseMiddleware<TraceIdMiddleware>();
    app.UseMiddleware<ExceptionHandlingMiddleware>();
    app.UseMiddleware<RateLimitMiddleware>();
    app.UseMiddleware<AuditLogMiddleware>();

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    app.UseCors();
    app.UseAuthentication();
    app.UseAuthorization();
    app.MapControllers();

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Host terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}