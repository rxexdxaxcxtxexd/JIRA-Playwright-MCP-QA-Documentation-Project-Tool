# BargeOps Admin Monorepo

Unified repository for BargeOps Admin API and UI applications.

## What's Included

- **API** (`src/BargeOps.API/`) - .NET 8 REST API with Dapper and SQL Server
- **UI** (`src/BargeOps.UI/`) - ASP.NET Core MVC web application
- **Pipelines** (`pipelines/`) - Azure DevOps build and deployment pipelines
- **Tests** (`tests/`) - End-to-end Playwright tests

## Getting Started

### Prerequisites
- .NET 8 SDK
- SQL Server access
- Windows for full auth support

### Build & Run
```bash
# Build API
cd src/BargeOps.API
dotnet build AdminService.sln

# Build UI
cd src/BargeOps.UI
dotnet build BargeOps.Admin.UI.sln

# Run API (Terminal 1)
cd src/BargeOps.API/src/Admin.Api
dotnet run

# Run UI (Terminal 2)
cd src/BargeOps.UI
dotnet run
```

Access the UI at http://localhost:5000

## Documentation

- [CLAUDE.md](CLAUDE.md) - Detailed architecture and patterns
- [API README](src/BargeOps.API/README.md) - API-specific documentation
- [UI CLAUDE.md](src/BargeOps.UI/CLAUDE.md) - UI-specific documentation

## CI/CD

Azure Pipelines are configured for both API and UI:
- **API Pipeline**: `pipelines/azure-pipelines-api.yml`
- **UI Pipeline**: `pipelines/azure-pipelines-ui.yml`

Pipelines trigger on changes to their respective `src/` folders.

## Contributing

1. Create feature branch from `main`
2. Make changes in appropriate `src/` folder
3. Test locally
4. Submit pull request
5. Ensure pipeline builds pass

## License

Proprietary - CSG Solutions
