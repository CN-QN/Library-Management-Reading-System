# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj và restore
COPY apps/api/*.csproj apps/api/
RUN dotnet restore apps/api/api.csproj

# Copy source và build
COPY apps/api/ apps/api/
WORKDIR /src/apps/api
RUN dotnet build api.csproj -c Release -o /app/build

# Publish
FROM build AS publish
RUN dotnet publish api.csproj -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Cài đặt curl cho healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy published files
COPY --from=publish /app/publish .

# Tạo thư mục upload và logs
RUN mkdir -p /app/wwwroot/uploads /app/logs

# Expose ports
EXPOSE 5210
EXPOSE 5211

# Environment variables
ENV ASPNETCORE_ENVIRONMENT=Development
ENV ASPNETCORE_URLS=http://+:5210

ENTRYPOINT ["dotnet", "api.dll"]
