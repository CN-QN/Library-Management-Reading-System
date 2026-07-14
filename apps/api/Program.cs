using System.Text;
using api.Auth;
using api.Configuration;
using api.Database;
using api.Database.Indexes;
using api.Database.Seed;
using api.Middleware;
using api.Roles;
using api.Users;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;

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

    // Register Index & Seed helpers
    builder.Services.AddScoped<IndexCreator>();
    builder.Services.AddScoped<SeedRunner>();

    // Register App Services
    builder.Services.AddScoped<JwtService>();
    builder.Services.AddScoped<AuthService>();
    builder.Services.AddScoped<UsersService>();
    builder.Services.AddScoped<RolesService>();

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
    });

    builder.Services.AddAuthorization();

    // CORS Setup
    var corsOrigins = builder.Configuration.GetValue<string>("CORS_ORIGINS") ?? "*";
    var originsList = corsOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries);

    builder.Services.AddCors(options =>
    {
        options.AddDefaultPolicy(policy =>
        {
            policy.WithOrigins(originsList)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
    });

    builder.Services.AddControllers();
    
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
