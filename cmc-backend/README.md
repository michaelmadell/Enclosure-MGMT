# CMC Backend

REST API server for the CMC Central Manager. Provides centralized storage and management of CMC configurations with enterprise-grade security.

## Technology Stack

- **Runtime**: Node.js (ESM)
- **Framework**: Express.js
- **Database**: SQLite3 with better-sqlite3
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Security**: Helmet, CORS, Rate Limiting

## 🔐 Security Features

- ✅ **JWT Authentication** - Secure token-based authentication
- ✅ **Role-Based Access Control** - Admin and Guest roles
- ✅ **Password Encryption** - CMC passwords encrypted at rest (AES-256-GCM)
- ✅ **User Password Hashing** - bcrypt with salt
- ✅ **HTTPS Support** - Self-signed certificates for development
- ✅ **Rate Limiting** - Protection against brute force attacks
- ✅ **Input Validation** - Comprehensive data validation
- ✅ **XSS Protection** - Input sanitization
- ✅ **Security Headers** - Helmet.js integration
- ✅ **CORS Configuration** - Controlled cross-origin access
- ✅ **Audit Logging** - Complete activity logging

## Structure

```
cmc-backend/
├── server.js              # Main Express server
├── database.js            # Database config & queries
├── routes/
│   └── auth.js           # Authentication routes
├── middleware/
│   ├── auth.js           # JWT middleware
│   ├── audit.js          # Audit logging
│   └── security.js       # Security middleware
├── utils/
│   └── encryption.js     # Encryption utilities
├── scripts/
│   └── generate-cert.js  # SSL certificate generator
├── certs/                # SSL certificates (auto-generated)
├── logs/                 # Audit logs
├── package.json          # Dependencies
├── .env.example          # Environment template
└── cmc-manager.db        # SQLite database (auto-generated)
```

## Installation

```bash
cd cmc-backend
npm install
```

## Configuration

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Edit `.env` and update the following:

```bash
# IMPORTANT: Change these in production!
JWT_SECRET=your-long-random-secret-key-here
ENCRYPTION_KEY=your-32-character-encryption-key-here

# Optional: Enable HTTPS
USE_HTTPS=true

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

## Generate SSL Certificate (Optional)

For HTTPS support, generate a self-signed certificate:

```bash
npm run generate-cert
```

Then set `USE_HTTPS=true` in your `.env` file.

⚠️ **Note**: Self-signed certificates are for development only. Use a trusted CA certificate in production.

## Running

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

## 👤 Default Users

The system creates two default users on first run:

| Username | Password | Role | Permissions |
|----------|----------|------|-------------|
| `admin` | `admin123` | Admin | Full access (CRUD) |
| `guest` | `guest123` | Guest | Read-only access |

**⚠️ IMPORTANT**: Change these passwords immediately in production!

## API Endpoints

### Authentication

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "admin",
    "username": "admin",
    "role": "admin"
  }
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

### CMC Management

All CMC endpoints require authentication via `Authorization: Bearer <token>` header.

#### List All CMCs (Admin & Guest)
```http
GET /api/cmcs
Authorization: Bearer <token>
```

#### Get Specific CMC (Admin & Guest)
```http
GET /api/cmcs/:id
Authorization: Bearer <token>
```

#### Create CMC (Admin Only)
```http
POST /api/cmcs
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "CMC-001",
  "address": "https://cmc.example.com",
  "username": "cmcuser",
  "password": "cmcpass",
  "notes": "Production CMC"
}
```

#### Update CMC (Admin Only)
```http
PUT /api/cmcs/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "CMC-001",
  "address": "https://cmc.example.com",
  "username": "cmcuser",
  "password": "newpassword",
  "notes": "Updated notes"
}
```

#### Delete CMC (Admin Only)
```http
DELETE /api/cmcs/:id
Authorization: Bearer <token>
```

### Health Check
```http
GET /health
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,        -- bcrypt hashed
  role TEXT NOT NULL,            -- 'admin' or 'guest'
  created_at INTEGER NOT NULL,
  last_login INTEGER,
  created_by TEXT
);
```

### CMCs Table
```sql
CREATE TABLE cmcs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  username TEXT NOT NULL,
  password TEXT NOT NULL,        -- AES-256-GCM encrypted
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

## Security Best Practices

### For Development
1. Use self-signed certificates for HTTPS
2. Keep default credentials for testing
3. Enable debug logging

### For Production
1. **Change all default passwords immediately**
2. **Generate strong JWT_SECRET (min 64 characters)**
3. **Generate strong ENCRYPTION_KEY (min 32 characters)**
4. Use real SSL certificates from a trusted CA
5. Set specific CORS_ORIGIN (never use `*`)
6. Set `NODE_ENV=production`
7. Adjust rate limits based on your needs
8. Regular database backups
9. Monitor audit logs regularly
10. Keep dependencies updated

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| Global | 100 requests | 15 minutes |
| `/api/*` | 50 requests | 15 minutes |
| `/api/auth/login` | 5 attempts | 15 minutes |

## Audit Logging

All API requests and CMC operations are logged to `logs/audit.log`:

```json
{
  "timestamp": "2026-02-20T10:30:00.000Z",
  "action": "cmc_operation",
  "operation": "create",
  "cmc_id": "abc123",
  "cmc_name": "CMC-001",
  "user": "admin",
  "role": "admin"
}
```

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run generate-cert` - Generate self-signed SSL certificate
- `npm test` - Run tests
- `npm run security:audit` - Check for security vulnerabilities
- `npm run security:fix` - Fix security vulnerabilities

## Encryption

### CMC Passwords
CMC passwords are encrypted using AES-256-GCM before storage:
- Unique salt per encryption
- Authentication tag for integrity
- Requires `ENCRYPTION_KEY` environment variable

### User Passwords
User passwords are hashed using bcrypt:
- Salt rounds: 10
- One-way hashing (cannot be decrypted)
- Secure against rainbow table attacks

## Troubleshooting

### "SSL certificates not found"
Run `npm run generate-cert` to create self-signed certificates.

### "Invalid token"
Token may be expired (default: 24 hours). Login again to get a new token.

### "Guest users have read-only access"
Guest users cannot create, update, or delete CMCs. Login with admin credentials.

### CORS errors
Add your frontend URL to `CORS_ORIGIN` in `.env` file.

## Network Access

The server displays network information on startup:

```
🚀 CMC Manager API Server (Secure)
─────────────────────────────────
Local:   https://localhost:3001/api
Network: https://192.168.1.100:3001/api
Health:  https://localhost:3001/health
─────────────────────────────────
🔐 Authentication enabled
👤 Default credentials:
   Admin - username: admin, password: admin123
   Guest - username: guest, password: guest123
─────────────────────────────────
```

## License

ISC