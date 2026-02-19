import express from 'express';
import cors from 'cors';
import { statements } from './database.js';
import { randomBytes } from 'crypto';
import { networkInterfaces } from 'os';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - Allow LAN access
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // In development, allow all origins
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // In production, check against allowed origins
    const allowedOrigins = process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',')
      : [];
    
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Get all CMCs
app.get('/api/cmcs', (req, res) => {
  try {
    const cmcs = statements.getAllCmcs.all();
    res.json(cmcs);
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
    res.json(cmc);
  } catch (error) {
    console.error('Error fetching CMC:', error);
    res.status(500).json({ error: 'Failed to fetch CMC' });
  }
});

// Create new CMC
app.post('/api/cmcs', (req, res) => {
  try {
    const { name, address, username, password, notes } = req.body;
    
    // Validation
    if (!name || !address || !username || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, address, username, password' 
      });
    }

    // Validate address format
    if (!address.match(/^https?:\/\//)) {
      return res.status(400).json({ 
        error: 'Address must start with http:// or https://' 
      });
    }

    const id = randomBytes(8).toString('hex');
    const now = Date.now();

    statements.createCmc.run(
      id,
      name,
      address,
      username,
      password,
      notes || '',
      now,
      now
    );

    const newCmc = statements.getCmcById.get(id);
    res.status(201).json(newCmc);
  } catch (error) {
    console.error('Error creating CMC:', error);
    res.status(500).json({ error: 'Failed to create CMC' });
  }
});

// Update CMC
app.put('/api/cmcs/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, username, password, notes } = req.body;

    // Check if CMC exists
    const existing = statements.getCmcById.get(id);
    if (!existing) {
      return res.status(404).json({ error: 'CMC not found' });
    }

    // Validation
    if (!name || !address || !username || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, address, username, password' 
      });
    }

    if (!address.match(/^https?:\/\//)) {
      return res.status(400).json({ 
        error: 'Address must start with http:// or https://' 
      });
    }

    const now = Date.now();

    statements.updateCmc.run(
      name,
      address,
      username,
      password,
      notes || '',
      now,
      id
    );

    const updated = statements.getCmcById.get(id);
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
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting CMC:', error);
    res.status(500).json({ error: 'Failed to delete CMC' });
  }
});

// Search CMCs
app.get('/api/cmcs/search/:query', (req, res) => {
  try {
    const query = `%${req.params.query}%`;
    const cmcs = statements.searchCmcs.all(query, query, query);
    res.json(cmcs);
  } catch (error) {
    console.error('Error searching CMCs:', error);
    res.status(500).json({ error: 'Failed to search CMCs' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Get server's network address
const getNetworkAddress = () => {
  const nets = networkInterfaces();
  
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip internal (localhost) and non-IPv4 addresses
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
};

// Start server - Listen on all network interfaces (0.0.0.0)
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  const networkIP = getNetworkAddress();
  
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║  CMC Manager Backend - Server Running         ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log('');
  console.log(`Local:    http://localhost:${PORT}`);
  console.log(`Network:  http://${networkIP}:${PORT}`);
  console.log('');
  console.log('API Endpoints:');
  console.log(`  GET    http://${networkIP}:${PORT}/api/cmcs`);
  console.log(`  POST   http://${networkIP}:${PORT}/api/cmcs`);
  console.log(`  Health http://${networkIP}:${PORT}/health`);
  console.log('');
  console.log('To access from other devices on LAN:');
  console.log(`  Update frontend .env: VITE_API_URL=http://${networkIP}:${PORT}/api`);
  console.log('');
});

export default app;