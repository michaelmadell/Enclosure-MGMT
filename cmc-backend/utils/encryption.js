import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

/**
 * Derive encryption key from password
 */
function deriveKey(password, salt) {
  return crypto.pbkdf2Sync(
    password,
    salt,
    ITERATIONS,
    KEY_LENGTH,
    'sha512'
  );
}

/**
 * Encrypt sensitive data
 * @param {string} text - Plain text to encrypt
 * @param {string} masterKey - Master encryption key from environment
 * @returns {string} Encrypted data in format: salt:iv:encrypted:tag
 */
export function encrypt(text, masterKey) {
  if (!masterKey) {
    throw new Error('Encryption key not configured');
  }

  // Generate random salt and IV
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);

  // Derive key from master key and salt
  const key = deriveKey(masterKey, salt);

  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  // Encrypt
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Get auth tag
  const tag = cipher.getAuthTag();

  // Return format: salt:iv:encrypted:tag
  return [
    salt.toString('hex'),
    iv.toString('hex'),
    encrypted,
    tag.toString('hex'),
  ].join(':');
}

/**
 * Decrypt sensitive data
 * @param {string} encryptedData - Encrypted data in format: salt:iv:encrypted:tag
 * @param {string} masterKey - Master encryption key from environment
 * @returns {string} Decrypted plain text
 */
export function decrypt(encryptedData, masterKey) {
  if (!masterKey) {
    throw new Error('Encryption key not configured');
  }

  // Parse encrypted data
  const parts = encryptedData.split(':');
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted data format');
  }

  const salt = Buffer.from(parts[0], 'hex');
  const iv = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  const tag = Buffer.from(parts[3], 'hex');

  // Derive key
  const key = deriveKey(masterKey, salt);

  // Create decipher
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  // Decrypt
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Hash password for storage (one-way)
 * Use this if you don't need to retrieve the original password
 */
export function hashPassword(password) {
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha512')
    .toString('hex');
  
  return `${salt}:${hash}`;
}

/**
 * Verify hashed password
 */
export function verifyPassword(password, hashedPassword) {
  const [salt, originalHash] = hashedPassword.split(':');
  const hash = crypto
    .pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha512')
    .toString('hex');
  
  return hash === originalHash;
}

/**
 * Generate secure random token
 */
export function generateToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Mask sensitive data for logging
 */
export function maskSensitiveData(data) {
  if (!data) return data;

  const masked = { ...data };
  const sensitiveFields = ['password', 'token', 'secret', 'key'];

  for (const field of sensitiveFields) {
    if (masked[field]) {
      masked[field] = '***REDACTED***';
    }
  }

  return masked;
}