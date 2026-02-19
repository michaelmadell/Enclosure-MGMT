# API Documentation

Base URL: `http://localhost:3001/api`

## Authentication

Currently, the API does not require authentication. All endpoints are publicly accessible.

⚠️ **Security Note**: Implement authentication before deploying to production.

## Endpoints

### Health Check

#### `GET /health`

Check if the server is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": 1709243567890
}
```

### List All CMCs

#### `GET /api/cmcs`

Retrieve all configured CMCs

**Response:**
```json
[
    {
        "id": "a1b2c3d4",
        "name": "Production CMC 1",
        "address": "https://10.50.0.123",
        "username": "admin",
        "password": "password123",
        "notes": "Main production chassis",
        "created_at": 1709243567890,
        "updated_at": 1709243567890
    }
]
```

### Get Single CMC

#### `GET /api/cmcs/:id`

Retrieve a specific CMC by ID.

**Parameters:**

- `id` (path): CMC identifier

**Response:**
```json
{
  "id": "a1b2c3d4",
  "name": "Production CMC 1",
  "address": "https://10.50.0.123",
  "username": "admin",
  "password": "password123",
  "notes": "Main production chassis",
  "created_at": 1709243567890,
  "updated_at": 1709243567890
}
```

**Error Response**
```json
{
  "error": "CMC not found"
}
```
Status: 404

### Create CMC
#### `POST /api/cmcs`

Create a new CMC configuration

**Request Body**
```json
{
  "name": "Production CMC 1",
  "address": "https://10.50.0.123",
  "username": "admin",
  "password": "password123",
  "notes": "Main production chassis"
}
```

**Required Fields**
- `name`: CMC Display name
- `address`: Full URL (must start with http:// or https://)
- `username`: CMC Login username
- `password`: CMC Login Password

**Optional Fields**
- `notes`: Additional Description

**Response:**
```json
{
  "id": "a1b2c3d4",
  "name": "Production CMC 1",
  "address": "https://10.50.0.123",
  "username": "admin",
  "password": "password123",
  "notes": "Main production chassis",
  "created_at": 1709243567890,
  "updated_at": 1709243567890
}
```
Status: 201

**Error Response:**
```json
{
    "error": "Missing required fields: name, address, username, password"
}
```
Status: 400

```json
{
    "error": "Address must start with http:// or https://"
}
```
Status: 400

### Update CMC

#### `PUT /api/cmcs/:id`

Update an existing CMC Configuration

**Parameters:**
- `id` (path): CMC Identifier

**Request Body:**
```json
{
  "name": "Updated CMC Name",
  "address": "https://10.50.0.124",
  "username": "admin",
  "password": "newpassword",
  "notes": "Updated notes"
}
```

**Required Fields:**
- `name`: CMC Display Name
- `address`: Full URL
- `username`: CMC login username
- `password`: CMC Login password

**Response:**
```json
{
  "id": "a1b2c3d4",
  "name": "Updated CMC Name",
  "address": "https://10.50.0.124",
  "username": "admin",
  "password": "newpassword",
  "notes": "Updated notes",
  "created_at": 1709243567890,
  "updated_at": 1709250000000
}
```

**Error Response:**
```json
{
  "error": "CMC not found"
}
```
Status: 404

### Delete CMC
#### `DELETE /api/cmcs/:id`
Delete a CMC Configuration
**Parameters:**
- `id` (path): CMC Identifier

**Response:** Status: 204 (No Content)

**Error Response:**
```json
{
    "error": "CMC Not Found"
}
```
Status: 404

### Error Codes
| Status Code |	Meaning |
| :---: | :--- |
| 200 |	OK - Request successful |
| 201 |	Created - Resource created successfully |
| 204 |	No Content - Deletion successful |
| 400 |	Bad Request - Invalid input data |
| 404 |	Not Found - Resource doesn't exist |
| 500 |	Internal Server Error - Server error |

### Rate Limiting
Currently not implemented. Consider adding rate limiting for production.

### CORS
The API supports CORS. Configure allowed origins in the backend `.env` file:
```bash
CORS_ORIGIN=http://localhost:5173,http://192.168.1.100:5173
```