# RiftRewind Backend

ASP.NET Core Web API for RiftRewind - A League of Legends match history and replay viewer.

## Tech Stack

- .NET 9.0
- ASP.NET Core Web API
- OpenAPI/Swagger

## Getting Started

### Prerequisites

- .NET 9.0 SDK or later

### Installation

1. Navigate to the project directory:
   ```bash
   cd Backend/RiftRewind.Api
   ```

2. Restore dependencies:
   ```bash
   dotnet restore
   ```

3. Build the project:
   ```bash
   dotnet build
   ```

### Running the API

```bash
dotnet run
```

The API will be available at:
- HTTPS: `https://localhost:5001`
- HTTP: `http://localhost:5000`

### Configuration

The Riot Games API configuration is stored in `appsettings.json`:

```json
{
  "RiotGames": {
    "ApiKey": "RGAPI-b48bfe29-f283-4d42-817f-649b71079338",
    "ApiBaseUrl": "https://developer.riotgames.com/apis"
  }
}
```

For production deployments, use environment variables or Azure Key Vault to secure the API key.

## API Documentation

When running in development mode, OpenAPI documentation is available at:
- `https://localhost:5001/openapi/v1.json`

## Project Structure

```
RiftRewind.Api/
├── Program.cs              # Application entry point
├── appsettings.json        # Configuration
├── appsettings.Development.json
└── RiftRewind.Api.csproj   # Project file
```

## Development

### Adding New Endpoints

Add new endpoints in `Program.cs` using minimal APIs:

```csharp
app.MapGet("/endpoint", () => {
    // Your logic here
    return Results.Ok();
});
```

### Riot Games API Integration

To integrate with Riot Games API:

1. Use the configured API key from `IConfiguration`
2. Make HTTP requests to Riot Games endpoints
3. Handle rate limiting and errors appropriately

Documentation: https://developer.riotgames.com/apis

## Testing

```bash
dotnet test
```

## Deployment

### Build for Production

```bash
dotnet publish -c Release -o ./publish
```

### Docker (Optional)

Create a `Dockerfile` to containerize the application:

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY ./publish .
ENTRYPOINT ["dotnet", "RiftRewind.Api.dll"]
```

## License

MIT
