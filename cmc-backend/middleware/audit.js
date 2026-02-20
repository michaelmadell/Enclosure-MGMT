import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logsDir = join(__dirname, '..', 'logs');
const auditLogPath = join(logsDir, 'audit.log');

// Create logs directory if it doesn't exist
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Write audit log entry
 */
export function auditLog(action, details = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    action,
    ...details,
  };

  const logLine = JSON.stringify(logEntry) + '\n';
  
  fs.appendFile(auditLogPath, logLine, (err) => {
    if (err) {
      console.error('Failed to write audit log:', err);
    }
  });
}

/**
 * Audit logging middleware
 * Logs all API requests
 */
export function auditMiddleware(req, res, next) {
  const startTime = Date.now();

  // Store original end function
  const originalEnd = res.end;

  res.end = function (...args) {
    const duration = Date.now() - startTime;
    
    // Log the request
    auditLog('api_request', {
      method: req.method,
      path: req.path,
      ip: req.ip,
      user: req.user ? req.user.username : 'anonymous',
      role: req.user ? req.user.role : 'none',
      status: res.statusCode,
      duration: `${duration}ms`,
    });

    // Call original end
    originalEnd.apply(res, args);
  };

  next();
}

/**
 * Audit CMC operations
 */
export function auditCmcOperation(operation, cmcId, cmcName, user) {
  auditLog('cmc_operation', {
    operation,
    cmc_id: cmcId,
    cmc_name: cmcName,
    user: user ? user.username : 'unknown',
    role: user ? user.role : 'unknown',
  });
}