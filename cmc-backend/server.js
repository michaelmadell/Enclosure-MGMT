import express from 'express';
import cors from 'cors';
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
import { encrypt, decrypt, maskSensitiveData } from './utils/encryption.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(sanitizeInput);
app.use(requestLogger);

// Apply rate limiting
app.use(rateLimiter);
app.use('/api', apiRateLimiter);

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

// Health check (excluded from rate limiting)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: Date.now(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Get all CMCs
app.get('/api/cmcs', (req, res) => {
  try {
    const cmcs = statements.getAllCmcs.all();
    
    // Decrypt passwords if encryption is enabled
    const decryptedCmcs = cmcs.map(cmc => ({
      ...cmc,
      password: decryptPassword(cmc.password),
    }));

    // Log request (with masked data)
    console.log('Fetched CMCs:', decryptedCmcs.map(maskSensitiveData));

    res.json(decryptedCmcs);
  } catch (error) {
    console.error('Error fetching CMCs:', error);
    res.status(500).json({ error: 'Failed to fetch CMCs' });
  }
});

// Get single CMC by ID
app.get('/api/cmcs/:id', (req, res) => {
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

// Create new CMC
app.post('/api/cmcs', validateCmcData, (req, res) => {
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
      notes || '',
      now,
      now
    );

    const newCmc = statements.getCmcById.get(id);
    
    // Decrypt for response
    newCmc.password = decryptPassword(newCmc.password);

    console.log('Created CMC:', maskSensitiveData(newCmc));
    res.status(201).json(newCmc);
  } catch (error) {
    console.error('Error creating CMC:', error);
    res.status(500).json({ error: 'Failed to create CMC' });
  }
});

// Update CMC
app.put('/api/cmcs/:id', validateCmcData, (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, username, password, notes } = req.body;

    const existing = statements.getCmcById.get(id);
    if (!existing) {
      return res.status(404).json({ error: 'CMC not found' });
    }

    const now = Date.now();

    // Encrypt password if enabled
    const encryptedPassword = encryptPassword(password);

    statements.updateCmc.run(
      name,
      address,
      username,
      encryptedPassword,
      notes || '',
      now,
      id
    );

    const updated = statements.getCmcById.get(id);
    
    // Decrypt for response
    updated.password = decryptPassword(updated.password);

    console.log('Updated CMC:', maskSensitiveData(updated));
    res.json(updated);
  } catch (error) {
    console.error('Error updating CMC:', error);
    res.status(500).json({ error: 'Failed to update CMC' });
  }
});

// Delete CMC
app.delete('/api/cmcs/:id', (req, res) => {
  try {
    const { id } = req.params;

    const existing = statements.getCmcById.get(id);
    if (!existing) {
      return res.status(404).json({ error: 'CMC not found' });
    }

    statements.deleteCmc.run(id);
    console.log('Deleted CMC:', id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting CMC:', error);
    res.status(500).json({ error: 'Failed to delete CMC' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler (must be last)
app.use(errorHandler);

// Get network IP for LAN access
function getNetworkIP() {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

// Start server
const networkIP = getNetworkIP();
app.listen(PORT, () => {
  console.log('╔════════════════════════════════════════╗');
  console.log('║    CMC Manager API Server              ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Local:   http://localhost:${PORT}/api`);
  console.log(`Network: http://${networkIP}:${PORT}/api`);
  console.log(`Health:  http://${networkIP}:${PORT}/health`);
  console.log('');
  console.log('Security Features:');
  console.log(`  - Rate Limiting: ${process.env.RATE_LIMIT_MAX_REQUESTS || 100} requests per ${(parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 60000} minutes`);
  console.log(`  - Password Encryption: ${shouldEncrypt ? 'Enabled' : 'Disabled'}`);
  console.log(`  - CORS: ${process.env.CORS_ORIGIN || '*'}`);
  console.log('');
  console.log('To access from other devices on LAN:');
  console.log(`  Update frontend .env: VITE_API_URL=http://${networkIP}:${PORT}/api`);
  console.log('');
});

export default app;