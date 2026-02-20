import express from 'express';
import bcrypt from 'bcrypt';
import { statements } from '../database.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';
import { auditLog } from '../middleware/audit.js';

const router = express.Router();

/**
 * Login endpoint
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Get user from database
    const user = statements.getUserByUsername.get(username);
    
    if (!user) {
      auditLog('login_failed', { username, reason: 'user_not_found' });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      auditLog('login_failed', { username, reason: 'invalid_password' });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user);
    
    // Update last login
    statements.updateLastLogin.run(Date.now(), user.id);

    auditLog('login_success', { username, role: user.role });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * Get current user
 * GET /api/auth/me
 */
router.get('/me', authenticateToken, (req, res) => {
  const user = statements.getUserById.get(req.user.id);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    id: user.id,
    username: user.username,
    role: user.role,
    created_at: user.created_at,
    last_login: user.last_login,
  });
});

/**
 * Logout endpoint (client-side token removal)
 * POST /api/auth/logout
 */
router.post('/logout', authenticateToken, (req, res) => {
  auditLog('logout', { username: req.user.username });
  res.json({ message: 'Logged out successfully' });
});

export default router;