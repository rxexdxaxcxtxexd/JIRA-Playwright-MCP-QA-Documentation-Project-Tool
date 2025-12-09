# BargeOps Admin Monorepo

## Overview
Monorepo containing the BargeOps Admin API and UI applications for managing barge operations, boats, facilities, customers, and commodities.

## Structure
```
BargeOps-Admin/
├── src/
│   ├── BargeOps.API/          # REST API (.NET 8, Dapper, SQL Server)
│   ├── BargeOps.UI/           # MVC Web App (.NET 8, Razor, jQuery)
│   └── BargeOps.Shared/       # Shared libraries (future)
├── tests/
│   └── playwright/            # End-to-end tests
├── pipelines/                 # Azure DevOps pipelines
├── docs/                      # Documentation
└── scripts/                   # Build and deployment scripts
```

## Technology Stack

### API (src/BargeOps.API/)
- .NET 8 Web API
- Dapper for data access
- SQL Server database
- Clean Architecture (Domain, Infrastructure, Api layers)
- Windows Authentication
- CSG Authorization library

### UI (src/BargeOps.UI/)
- ASP.NET Core 8 MVC
- Razor Views
- jQuery + DataTables
- Bootstrap 5
- Windows Authentication
- License-based feature visibility

## Quick Start

### Prerequisites
- .NET 8 SDK
- SQL Server (access to UnitTow database)
- Windows authentication configured

### Build

```bash
# API
cd src/BargeOps.API
dotnet restore AdminService.sln
dotnet build AdminService.sln

# UI
cd src/BargeOps.UI
dotnet restore BargeOps.Admin.UI.sln
dotnet build BargeOps.Admin.UI.sln
```

### Run Locally

```bash
# Terminal 1 - API
cd src/BargeOps.API/src/Admin.Api
dotnet run --urls=http://localhost:5001

# Terminal 2 - UI
cd src/BargeOps.UI
dotnet run --urls=http://localhost:5000
```

### Development Settings
- API runs on http://localhost:5001
- UI runs on http://localhost:5000
- Windows Auth bypassed in development mode
- Default dev user credentials configured in appsettings.Development.json

## Architecture Patterns

### API Patterns
- Repository pattern with Dapper
- SQL stored as embedded resources
- DTOs for request/response
- Service layer for business logic
- Controller → Service → Repository

### UI Patterns
- MVC pattern with ViewModels
- Service layer for API communication
- DataTables for grid displays
- jQuery for client-side interaction
- Partial views for reusable components

### Data Access
- Dapper for raw SQL execution
- SQL queries in dedicated .sql files
- Embedded resources in Infrastructure project
- Connection string in appsettings

### Authentication & Authorization
- Windows Authentication (IIS/Kestrel)
- CSG Authorization library for permissions
- License-based feature access
- Development bypass for local testing

## Key Features
- Boat Location management
- Facility management
- Customer management
- Commodity management
- Barge management
- Search and filter capabilities
- DataTables grids with server-side pagination

## Database
- SQL Server (UnitTow database)
- Dapper for queries
- No ORM, raw SQL preferred
- Connection managed via IDbConnectionFactory

## Deployment
- IIS deployment for both API and UI
- Separate sites for API and UI
- Windows Authentication enabled
- See pipelines/ for Azure DevOps CI/CD

## Common Tasks

### Adding a new entity
1. Create domain model in Admin.Domain/Models
2. Create repository interface and implementation
3. Add SQL queries in Infrastructure/DataAccess/Sql
4. Create controller in Admin.Api or UI
5. Add service layer if needed

### Running tests
```bash
# Playwright tests (UI)
cd src/BargeOps.UI
npx playwright test
```

## Configuration
- API: `src/BargeOps.API/src/Admin.Api/appsettings.json`
- UI: `src/BargeOps.UI/appsettings.json`
- Development overrides: `appsettings.Development.json`

## Troubleshooting

### Build Issues
- Ensure .NET 8 SDK is installed
- Check NuGet package restore
- Verify CSG package source is configured

### Runtime Issues
- Check connection strings
- Verify database access
- Confirm Windows Auth settings
- Review IIS application pool identity

## Documentation Organization

All monorepo-level documentation should be placed in the `/docs` directory, organized by category:

### `/docs` Structure
- **`/docs/architecture/`** - Architecture Decision Records (ADRs), system design, patterns
- **`/docs/api/`** - API documentation, endpoint specifications, integration guides
- **`/docs/development/`** - Developer tools, scripts, build processes, development workflows
- **`/docs/testing/`** - Testing guides, test documentation, Postman collections
- **`/docs/runbooks/`** - Operational runbooks, deployment guides, troubleshooting

### Documentation Placement Rules
- **Monorepo-level docs** → `/docs/` (affects multiple projects or overall architecture)
- **Project-specific docs** → Keep in project folder (e.g., `src/BargeOps.API/README.md`)
- **Claude Code config** → `CLAUDE.md` files stay at their respective levels (root, API, UI)
- **Temporary/working docs** → `.claude/` directory (git-ignored, for local work only)

### When creating new documentation:
1. Ask: "Does this apply to the whole monorepo or just one project?"
2. If monorepo-level → Place in `/docs/{category}/`
3. If project-specific → Place in `src/{ProjectName}/docs/` or project root
4. Update this section if you add new documentation categories

## Resources
- **Architecture & Patterns**: `/docs/architecture/`
- **API Documentation**: `/docs/api/` and `src/BargeOps.API/README.md`
- **UI Documentation**: `src/BargeOps.UI/CLAUDE.md`
- **Testing Guides**: `/docs/testing/` (Postman, Playwright)
- **Development Scripts**: `/docs/development/scripts-guide.md`
- **Pipeline Documentation**: `pipelines/README.md`

## Atlassian MCP Integration

This project uses the MCP Atlassian server (Docker-based) to enable Claude Code integration with Jira and Confluence for issue tracking and documentation management.

**Repository**: [sooperset/mcp-atlassian](https://github.com/sooperset/mcp-atlassian)

**Prerequisites**:
- Docker Desktop installed and running
- Valid Atlassian Cloud or Server/Data Center instance
- API Token or Personal Access Token

**Setup Status**: ✅ Configured for csgsolutions.atlassian.net

**Configuration Files**:
- `.mcp.json` - MCP server configuration (uses Docker)
- `.env.atlassian` - Jira/Confluence credentials (git-ignored)
- `.env.atlassian.example` - Template for credentials

**Quick Start**:
1. Credentials are already configured in `.env.atlassian`
2. Docker image pulled: `ghcr.io/sooperset/mcp-atlassian:latest`
3. Restart Claude Code to activate the MCP server

**Available Tools** (once activated):
- Jira: Create, read, update issues; manage projects and workflows
- Confluence: Search, read, create, and update pages and spaces
- Cross-platform support for Cloud and Server/Data Center deployments

**Testing**:
After restarting Claude Code, test with:
- "List my Jira projects"
- "Show me issues assigned to me"
- "Search Confluence for [topic]"
