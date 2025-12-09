# BargeOps Admin API - Postman Testing Guide

## Overview

This guide provides comprehensive Postman test collections for all BargeOps Admin API CRUD controllers. The collection includes tests for 5 controllers with 25 total endpoints, plus error handling scenarios.

## Files Included

- **`BargeOps_Admin_API_Complete_Tests.postman_collection.json`** - Main test collection
- **`BargeOps_Admin_API_Environment.postman_environment.json`** - Environment variables
- **`POSTMAN_TESTING_GUIDE.md`** - This guide

## Controllers & Endpoints Covered

### 1. Barge Controller (`/api/barge`)
- ✅ POST `/api/barge/bargeFilter` - List/Filter barges
- ✅ POST `/api/barge` - Create new barge
- ✅ GET `/api/barge/{id}` - Get barge by ID
- ✅ PUT `/api/barge/{id}` - Update barge
- ✅ PUT `/api/barge/{id}/active/{isActive}` - Set barge active/inactive

### 2. Customer Controller (`/api/customer`)
- ✅ POST `/api/customer/customerFilter` - List/Filter customers
- ✅ POST `/api/customer` - Create new customer
- ✅ GET `/api/customer/{id}` - Get customer by ID
- ✅ PUT `/api/customer/{id}` - Update customer
- ✅ PUT `/api/customer/{id}/active/{isActive}` - Set customer active/inactive

### 3. Commodity Controller (`/api/commodity`)
- ✅ POST `/api/commodity/commodityFilter` - List/Filter commodities
- ✅ POST `/api/commodity` - Create new commodity
- ✅ GET `/api/commodity/{id}` - Get commodity by ID
- ✅ PUT `/api/commodity/{id}` - Update commodity
- ✅ PUT `/api/commodity/{id}/active/{isActive}` - Set commodity active/inactive

### 4. RiverArea Controller (`/api/riverarea`)
- ✅ POST `/api/riverarea/riverareaFilter` - List/Filter river areas
- ✅ POST `/api/riverarea` - Create new river area
- ✅ GET `/api/riverarea/{id}` - Get river area by ID
- ✅ PUT `/api/riverarea/{id}` - Update river area
- ✅ PUT `/api/riverarea/{id}/active/{isActive}` - Set river area active/inactive

### 5. Vendor Controller (`/api/vendor`)
- ✅ POST `/api/vendor/vendorFilter` - List/Filter vendors
- ✅ POST `/api/vendor` - Create new vendor
- ✅ GET `/api/vendor/{id}` - Get vendor by ID
- ✅ PUT `/api/vendor/{id}` - Update vendor
- ✅ PUT `/api/vendor/{id}/active/{isActive}` - Set vendor active/inactive

### 6. Error Handling Tests
- ✅ 404 Not Found scenarios
- ✅ 400 Bad Request scenarios
- ✅ Validation error testing

## Setup Instructions

### 1. Import Collection and Environment

1. **Import Collection**:
   - Open Postman
   - Click **Import** button
   - Select `BargeOps_Admin_API_Complete_Tests.postman_collection.json`
   - Click **Import**

2. **Import Environment**:
   - Click **Import** button again
   - Select `BargeOps_Admin_API_Environment.postman_environment.json`
   - Click **Import**

3. **Select Environment**:
   - In top-right corner, select **"BargeOps Admin API - Development"** environment

### 2. Configure Environment Variables

Update the following variables in your environment:

#### Required Configuration:
- **`api_base_url`**: Set to your API base URL (default: `https://localhost:5001`)
- **`bearer_token`**: Set to a valid JWT bearer token for authentication

#### Auto-Populated Variables (No manual setup required):
- `test_barge_id`, `test_customer_id`, `test_commodity_id`, `test_riverarea_id`, `test_vendor_id`
- `created_barge_id`, `created_customer_id`, `created_commodity_id`, `created_riverarea_id`, `created_vendor_id`

### 3. Authentication Setup

All endpoints require authentication. You have two options:

#### Option A: Collection-Level Bearer Token (Recommended)
1. Right-click on the collection → **Edit**
2. Go to **Authorization** tab
3. Type: **Bearer Token**
4. Token: `{{bearer_token}}`
5. Update the `bearer_token` environment variable with your actual token

#### Option B: Manual Token Setup
Update each request individually with your authentication token.

## Running Tests

### 1. Individual Tests
- Expand any controller folder
- Click on any test request
- Click **Send** to execute
- Review response and test results in **Test Results** tab

### 2. Collection Runner (Recommended)
1. Right-click on collection → **Run collection**
2. Select **BargeOps Admin API - Development** environment
3. Click **Run BargeOps Admin API - Complete CRUD Tests**
4. Monitor test execution and results

### 3. Folder-Level Testing
- Right-click on any controller folder → **Run folder**
- Tests all endpoints for a specific controller

## Test Features

### 🔧 Automated Test Validation
Each test includes automated assertions:
- ✅ HTTP status code validation
- ✅ Response structure validation
- ✅ Data integrity checks
- ✅ Business logic validation

### 🔄 Test Data Management
- **Dynamic Data**: Uses `{{$randomInt}}` for unique test data
- **ID Chain Management**: Created entity IDs are automatically stored and reused
- **Cross-Controller References**: Tests use created entities as foreign keys where applicable

### 📊 Test Coverage
- **CRUD Operations**: Complete Create, Read, Update, Delete (soft delete) coverage
- **List/Filter Operations**: Advanced filtering and sorting tests
- **Error Scenarios**: 404 Not Found, 400 Bad Request, validation errors
- **Business Logic**: Entity-specific validation and business rules

## Test Data Examples

### Barge Test Data
```json
{
  "bargeNum": "TEST-12345",
  "uscgNum": "US67890",
  "isActive": true,
  "customerID": 1,
  "coverType": "Open",
  "loadStatus": "Empty"
}
```

### Customer Test Data
```json
{
  "name": "Test-12345",
  "billingName": "Test Customer Inc",
  "emailAddress": "test@example.com",
  "address": "123 Test Street",
  "isActive": true
}
```

### Vendor Test Data
```json
{
  "name": "Test-12345",
  "longName": "Test Vendor Inc",
  "emailAddress": "vendor@example.com",
  "isActive": true,
  "isLiquidBroker": false,
  "enablePortal": false
}
```

## Expected Test Results

### ✅ Successful Test Run Should Show:
- **25 CRUD endpoint tests** - All passing
- **3 error handling tests** - All passing
- **Total: 28 tests** - 0 failures

### 📈 Collection Statistics:
- **5 Controllers tested**
- **25 CRUD endpoints covered**
- **100% endpoint coverage**
- **Comprehensive validation testing**

## Troubleshooting

### Common Issues:

#### ❌ Authentication Errors (401 Unauthorized)
- **Solution**: Update `bearer_token` environment variable with valid JWT token
- **Check**: Ensure token hasn't expired

#### ❌ Connection Errors
- **Solution**: Verify `api_base_url` environment variable
- **Check**: Ensure API is running and accessible

#### ❌ 404 Not Found on GET Operations
- **Solution**: Run collection sequentially to populate entity IDs
- **Check**: Ensure database has test data

#### ❌ Validation Errors (400 Bad Request)
- **Solution**: Review request body format and required fields
- **Check**: Ensure field length limits and format requirements are met

### Debug Tips:
1. **Check Console**: View Postman console for detailed error messages
2. **Environment Variables**: Verify all variables are properly set
3. **Sequential Execution**: Run tests in order for proper ID chaining
4. **Request Bodies**: Ensure JSON format is valid and complete

## API Documentation Reference

### Standard Response Codes:
- **200 OK** - Successful GET, PUT operations
- **201 Created** - Successful POST operations
- **400 Bad Request** - Validation errors, malformed requests
- **401 Unauthorized** - Authentication required
- **404 Not Found** - Entity not found

### Common Request Headers:
```
Content-Type: application/json
Accept: application/json
Authorization: Bearer {token}
```

### Filter Request Format:
```json
{
  "filters": [
    {
      "field": "isActive",
      "operator": "eq",
      "value": true
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

## Advanced Usage

### Custom Environments
1. Duplicate the environment for different API environments (Dev, Test, Prod)
2. Update `api_base_url` for each environment
3. Maintain separate authentication tokens

### Data Cleanup
After testing, you may want to clean up created test data:
1. Note the created entity IDs from environment variables
2. Use the soft delete endpoints to deactivate test entities
3. Or manually clean up test data from the database

### Continuous Integration
The collection can be integrated with CI/CD pipelines using Newman:
```bash
newman run BargeOps_Admin_API_Complete_Tests.postman_collection.json \
  -e BargeOps_Admin_API_Environment.postman_environment.json \
  --reporters cli,json
```

## Support

For issues or questions regarding the API tests:
1. Check this guide first
2. Review API documentation
3. Contact the development team
4. File issues in the project repository

---

**Created**: July 31, 2025  
**Last Updated**: July 31, 2025  
**Version**: 1.0  
**Coverage**: 100% of implemented CRUD endpoints