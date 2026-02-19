import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

/**
 * Rate limiting middleware
 * Prevents brute force attacks and API abuse
 */
export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for health checks
  skip: (req) => req.path === '/health',
});

/**
 * API-specific rate limiter (stricter)
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Too many API requests, please slow down.',
});

/**
 * Security headers middleware using Helmet
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

/**
 * Input sanitization middleware
 * Prevents XSS and injection attacks
 */
export const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove potential XSS vectors
        obj[key] = obj[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);

  next();
};

/**
 * Validate CMC data
 */
export const validateCmcData = (req, res, next) => {
  const { name, address, username, password } = req.body;

  // Check required fields
  if (!name || !address || !username || !password) {
    return res.status(400).json({
      error: 'Missing required fields: name, address, username, password',
    });
  }

  // Validate name length
  if (name.length < 1 || name.length > 100) {
    return res.status(400).json({
      error: 'Name must be between 1 and 100 characters',
    });
  }

  // Validate address format
  if (!address.match(/^https?:\/\/.+/)) {
    return res.status(400).json({
      error: 'Address must start with http:// or https://',
    });
  }

  // Validate address length
  if (address.length > 255) {
    return res.status(400).json({
      error: 'Address must be less than 255 characters',
    });
  }

  // Validate username length
  if (username.length < 1 || username.length > 100) {
    return res.status(400).json({
      error: 'Username must be between 1 and 100 characters',
    });
  }

  // Validate password length
  if (password.length < 1 || password.length > 255) {
    return res.status(400).json({
      error: 'Password must be between 1 and 255 characters',
    });
  }

  // Validate notes length if provided
  if (req.body.notes && req.body.notes.length > 1000) {
    return res.status(400).json({
      error: 'Notes must be less than 1000 characters',
    });
  }

  next();
};

/**
 * Error handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(err.status || 500).json({
    error: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { stack: err.stack }),
  });
};

/**
 * Request logging middleware
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'ERROR' : 'INFO';
    
    console.log(
      `[${logLevel}] ${new Date().toISOString()} ${req.method} ${req.path} ${res.statusCode} ${duration}ms`
    );
  });

  next();
};

/**
 * CORS configuration with dynamic origin
 */
export const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
      : ['http://localhost:5173'];

    // Allow all origins in development or if wildcard is set
    if (
      process.env.NODE_ENV === 'development' ||
      allowedOrigins.includes('*')
    ) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};