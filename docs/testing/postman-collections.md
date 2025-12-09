# Postman Collections for BargeOps Admin API

This folder contains Postman collections for testing the BargeOps Admin API endpoints.

## Collections

### Customer-CRUD-Collection.json
Complete CRUD operations for Customer management including:
- **List Customers** - Filter, sort, and paginate customers
- **Get Customer by ID** - Retrieve specific customer details
- **Create Customer** - Add new customers with validation
- **Update Customer** - Modify existing customer information
- **Soft Delete/Restore** - Deactivate/activate customers

### BargeOps-Admin-API-Commodity.postman_collection.json ✨ **NEW**
Complete CRUD operations for Commodity management including:
- **Create Commodity** - Add new commodities with full validation
- **Get Commodity** - Retrieve specific commodity details
- **Update Commodity** - Modify existing commodity information
- **List Commodities** - Advanced filtering and sorting capabilities
- **Soft Delete Operations** - Deactivate/activate commodities
- **Field Validation Tests** - Comprehensive validation scenarios

### BargeOps-Admin-API.postman_environment.json ✨ **NEW**
Environment configuration file with variables for:
- API base URLs (HTTPS/HTTP)
- Authentication tokens
- Dynamic test variables

## Setup Instructions

1. **Import Collection**
   - Open Postman
   - Click "Import" → "Files" → Select `Customer-CRUD-Collection.json`

2. **Configure Environment Variables**
   Set these variables in your Postman environment:
   ```
   baseUrl = https://localhost:5001  (or your API URL)
   apiKey = your-actual-api-key-here
   customerId = 123  (for testing specific customer operations)
   ```

3. **Authentication**
   All requests use API Key authentication via the `X-API-Key` header.

## Request Examples

### Create Customer
```json
{
  "name": "Test Corp",
  "billingName": "Test Corporation",
  "emailAddress": "billing@test.com",
  "isActive": true,
  "sendInvoiceOptions": "Print"
}
```

### Filter Customers
```json
{
  "filters": [
    {
      "field": "name",
      "operator": "contains", 
      "value": "ACME"
    }
  ],
  "sorts": [
    {
      "field": "name",
      "direction": "asc"
    }
  ],
  "page": 1,
  "pageSize": 20
}
```

## Available Filter Operators
- `eq` - Equals
- `contains` - Contains text
- `startsWith` - Starts with text
- `gt` - Greater than
- `lt` - Less than
- `gte` - Greater than or equal
- `lte` - Less than or equal

## Validation Rules
- **Name**: Required, max 20 chars, must be unique
- **BillingName**: Required, max 50 chars
- **EmailAddress**: Valid email format, max 100 chars
- **State**: Exactly 2 characters
- **Phone/Fax**: Max 10 characters
- **SendInvoiceOptions**: Must be "Print", "Email", or "Print and Email"

## Response Codes
- `200` - Success (GET, PUT)
- `201` - Created (POST)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid API key)
- `404` - Not Found
- `500` - Internal Server Error

## Testing Scenarios

### Happy Path
1. Create a new customer
2. Get the customer by ID
3. Update the customer
4. List customers with filters
5. Soft delete the customer
6. Restore the customer

### Error Cases
1. Create customer with missing required fields
2. Create customer with invalid email
3. Create customer with duplicate name
4. Update non-existent customer
5. Get non-existent customer

## Commodity API Features ✨ **NEW**

The new Commodity collection includes advanced testing capabilities:

### Comprehensive Test Coverage
- ✅ **Valid Operations**: Create, read, update, and list commodities
- ✅ **Error Scenarios**: Validation failures, duplicate names, not found cases
- ✅ **Field Validation**: Tests for all length limits and required fields
- ✅ **Soft Delete**: Deactivate/reactivate operations
- ✅ **Advanced Filtering**: Search by group, name, status, CDC flag
- ✅ **Automated Tests**: Built-in test scripts with assertions

### Available Endpoints
- `POST /api/commodity/commodityFilter` - List with filtering and sorting
- `POST /api/commodity` - Create new commodity
- `GET /api/commodity/{id}` - Get commodity by ID
- `PUT /api/commodity/{id}` - Update commodity
- `PUT /api/commodity/{id}/active/{isActive}` - Soft delete/activate

### Field Validation Rules
| Field | Required | Max Length | Special Rules |
|-------|----------|------------|---------------|
| `commodityGroup` | ✅ Yes | 40 chars | - |
| `name` | ✅ Yes | 70 chars | Must be unique |
| `description` | ❌ No | 250 chars | - |
| `bargeExCode` | ❌ No | 10 chars | - |
| `chrisCode` | ❌ No | 50 chars | - |
| `commoditySubGroup` | ❌ No | 50 chars | - |
| `estimatedFairValue` | ❌ No | - | Decimal/money type |
| `isCdc` | ❌ No | - | Boolean, default: false |
| `isActive` | ❌ No | - | Boolean, default: false |
| `isCoverRequired` | ❌ No | - | Boolean, default: false |

### Quick Start for Commodity Testing
1. Import `BargeOps-Admin-API-Commodity.postman_collection.json`
2. Import `BargeOps-Admin-API.postman_environment.json`
3. Set the `baseUrl` to your API endpoint (e.g., `https://localhost:7001`)
4. Run the collection or individual requests

### Advanced Test Scenarios
- **CDC Commodities**: Test dangerous cargo commodities with special handling
- **Filtering**: Complex queries with multiple filters and sorting
- **Validation**: Edge cases for field lengths and required fields
- **Business Rules**: Automated validation of business logic

## Additional Collections
More collections will be added for other entities (Barge, etc.) following the same patterns.