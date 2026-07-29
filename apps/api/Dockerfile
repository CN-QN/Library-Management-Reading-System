FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj and restore as distinct layers
COPY ["api.csproj", "./"]
RUN dotnet restore "api.csproj"

# Copy everything else and build app
COPY . .
RUN dotnet publish "api.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Development
EXPOSE 5000

ENTRYPOINT ["dotnet", "api.dll"]
