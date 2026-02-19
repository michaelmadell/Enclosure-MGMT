# CMC Backend

REST API server for the CMC Central Manager. Provides centralized storage and management of CMC configurations.

## Technology Stack

- **Runtime**: Node.js (ESM)
- **Framework**: Express.js
- **Database**: SQLite3 with better-sqlite3
- **CORS**: Cross-Origin Resource Sharing enabled

## Structure
cmc-backend/ 
├── server.js # Main Express server 
├── database.js # Database configuration & queries 
├── migrate.js # Migration utility 
├── package.json # Dependencies 
├── .env.example # Environment template 
└── cmc-manager.db # SQLite database (auto-generated)

## Installation

```bash
npm install
```

## Configuration
Create a .env file:

```bash
PORT=3001
NODE_ENV=development
CORS_ORIGIN=*
```

## Running

### Development

```bash
npm run dev
```

### production

```bash
npm start

# Or With PM2
pm2 start server.js --name cmc-backend
```

# API Enpoints

## CMC Management

- `GET /api/cmcs` - List all CMCs
- `GET /api/cmcs/:id` - Get specific CMC
- `POST /api/cmcs` - Create new CMC
- `PUT /api/cmcs` - Update CMC
- `DELETE /api/cmcs/:id` - Delete CMCM

## Health

- `GET /health` - Server Health Check

# Database Schema

```sql
CREATE TABLE cmcs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    notes TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);
```

# Security

- Passwords are stored in plain text (consider encryption for production)
- Use proper file permissions: chmod 600 cmc-manager.db
- Configure CORS appropriately for production
- Use HTTPS in production environments

# Migration
To migrate to localStorage

```bash
npm run migrate
```

Follow the on-screen instructions.

# Network Access

The server will display network information on startup:

```
CMC Manager API Server
─────────────────────
Local:   http://localhost:3001/api
Network: http://192.168.1.100:3001/api
Health:  http://192.168.1.100:3001/health
```

# Scripts

- `npm start` - Start production server
- `npm run dev` - Start Development server with nodemon
- `npm run migrate` - Run migration utility