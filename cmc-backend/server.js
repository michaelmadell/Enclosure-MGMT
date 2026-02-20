import express from 'express';
import https from 'https';
import http from 'http';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import { statements } from './database.js';
import { randomBytes } from 'crypto';
import { networkInterfaces } from 'os';
import {
  rateLimiter,
  apiRateLimiter,
  securityHeaders,
  sanitizeInput,
  validateCmcData,
  errorHandler,
  requestLogger,
  corsOptions,
} from './middleware/security.js';
import { 
  authenticateToken, 
  requireWritePermission, 
  requireAdmin 
} from './middleware/auth.js';
import { auditMiddleware, auditCmcOperation } from './middleware/audit.js';
import { encrypt, decrypt, maskSensitiveData } from './utils/encryption.js';
import authRoutes from './routes/auth.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const USE_HTTPS = process.env.USE_HTTPS === 'true';

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(sanitizeInput);
app.use(requestLogger);
app.use(auditMiddleware);

// Apply rate limiting
app.use(rateLimiter);
app.use('/api', apiRateLimiter);

// Authentication routes (public)
app.use('/api/auth', authRoutes);

// Helper function to encrypt/decrypt passwords if enabled
const shouldEncrypt = process.env.ENCRYPT_PASSWORDS === 'true';
const encryptionKey = process.env.ENCRYPTION_KEY;

function encryptPassword(password) {
  if (shouldEncrypt && encryptionKey) {
    return encrypt(password, encryptionKey);
  }
  return password;
}

function decryptPassword(password) {
  if (shouldEncrypt && encryptionKey) {
    try {
      return decrypt(password, encryptionKey);
    } catch (err) {
      console.error('Failed to decrypt password:', err.message);
      return password;
    }
  }
  return password;
}

// Health check (excluded from auth)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: Date.now(),
    environment: process.env.NODE_ENV || 'development',
    https: USE_HTTPS,
  });
});

// Protected CMC routes - require authentication
// Get all CMCs (both admin and guest can view)
app.get('/api/cmcs', authenticateToken, (req, res) => {
  try {
    const cmcs = statements.getAllCmcs.all();
    
    // Decrypt passwords if encryption is enabled
    const decryptedCmcs = cmcs.map(cmc => ({
      ...cmc,
      password: decryptPassword(cmc.password),
    }));

    console.log('Fetched CMCs:', decryptedCmcs.map(maskSensitiveData));

    res.json(decryptedCmcs);
  } catch (error) {
    console.error('Error fetching CMCs:', error);
    res.status(500).json({ error: 'Failed to fetch CMCs' });
  }
});

// Get single CMC by ID (both admin and guest can view)
app.get('/api/cmcs/:id', authenticateToken, (req, res) => {
  try {
    const cmc = statements.getCmcById.get(req.params.id);
    if (!cmc) {
      return res.status(404).json({ error: 'CMC not found' });
    }

    // Decrypt password if encryption is enabled
    cmc.password = decryptPassword(cmc.password);

    console.log('Fetched CMC:', maskSensitiveData(cmc));
    res.json(cmc);
  } catch (error) {
    console.error('Error fetching CMC:', error);
    res.status(500).json({ error: 'Failed to fetch CMC' });
  }
});

// Create new CMC (admin only)
app.post('/api/cmcs', authenticateToken, requireWritePermission, validateCmcData, (req, res) => {
  try {
    const { name, address, username, password, notes } = req.body;

    const id = randomBytes(8).toString('hex');
    const now = Date.now();

    // Encrypt password if enabled
    const encryptedPassword = encryptPassword(password);

    statements.createCmc.run(
      id,
      name,
      address,
      username,
      encryptedPassword,
      notes || null,
      now,
      now
    );

    auditCmcOperation('create', id, name, req.user);

    const newCmc = {
      id,
      name,
      address,
      username,
      password, // Return unencrypted for client
      notes,
      created_at: now,
      updated_at: now,
    };

    console.log('Created CMC:', maskSensitiveData(newCmc));
    res.status(201).json(newCmc);
  } catch (error) {
    console.error('Error creating CMC:', error);
    res.status(500).json({ error: 'Failed to create CMC' });
  }
});

// Update CMC (admin only)
app.put('/api/cmcs/:id', authenticateToken, requireWritePermission, validateCmcData, (req, res) => {
  try {
    const { name, address, username, password, notes } = req.body;
    const { id } = req.params;

    const existing = statements.getCmcById.get(id);
    if (!existing) {
      return res.status(404).json({ error: 'CMC not found' });
    }

    const now = Date.now();
    const encryptedPassword = encryptPassword(password);

    statements.updateCmc.run(
      name,
      address,
      username,
      encryptedPassword,
      notes || null,
      now,
      id
    );

    auditCmcOperation('update', id, name, req.user);

    const updated = {
      id,
      name,
      address,
      username,
      password,
      notes,
      created_at: existing.created_at,
      updated_at: now,
    };

    console.log('Updated CMC:', maskSensitiveData(updated));
    res.json(updated);
  } catch (error) {
    console.error('Error updating CMC:', error);
    res.status(500).json({ error: 'Failed to update CMC' });
  }
});

// Delete CMC (admin only)
app.delete('/api/cmcs/:id', authenticateToken, requireWritePermission, (req, res) => {
  try {
    const { id } = req.params;
    const cmc = statements.getCmcById.get(id);
    
    if (!cmc) {
      return res.status(404).json({ error: 'CMC not found' });
    }

    statements.deleteCmc.run(id);
    
    auditCmcOperation('delete', id, cmc.name, req.user);
    
    console.log('Deleted CMC:', id);
    res.json({ message: 'CMC deleted successfully' });
  } catch (error) {
    console.error('Error deleting CMC:', error);
    res.status(500).json({ error: 'Failed to delete CMC' });
  }
});

// Error handler (must be last)
app.use(errorHandler);

// Create HTTPS or HTTP server
let server;

if (USE_HTTPS) {
  try {
    const certPath = join(__dirname, 'certs', 'server-cert.pem');
    const keyPath = join(__dirname, 'certs', 'server-key.pem');

    if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
      console.error('❌ SSL certificates not found. Run: npm run generate-cert');
      process.exit(1);
    }

    const options = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };

    server = https.createServer(options, app);
    console.log('🔒 HTTPS enabled');
  } catch (error) {
    console.error('❌ Failed to setup HTTPS:', error.message);
    process.exit(1);
  }
} else {
  server = http.createServer(app);
  console.log('⚠️  Running in HTTP mode (set USE_HTTPS=true for HTTPS)');
}

server.listen(PORT, () => {
  const protocol = USE_HTTPS ? 'https' : 'http';
  const interfaces = networkInterfaces();
  const addresses = [];

  Object.keys(interfaces).forEach((name) => {
    interfaces[name].forEach((iface) => {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    });
  });

  console.log('\n🚀 CMC Manager API Server (Secure)');
  console.log('─────────────────────────────────');
  console.log(`Local:   ${protocol}://localhost:${PORT}/api`);
  if (addresses.length > 0) {
    console.log(`Network: ${protocol}://${addresses[0]}:${PORT}/api`);
  }
  console.log(`Health:  ${protocol}://localhost:${PORT}/health`);
  console.log('─────────────────────────────────');
  console.log('🔐 Authentication enabled');
  console.log('👤 Default credentials:');
  console.log('   Admin - username: admin, password: admin123');
  console.log('   Guest - username: guest, password: guest123');
  console.log('─────────────────────────────────\n');
});

export default app;