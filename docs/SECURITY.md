# Security Guide

This document outlines security best practices and configurations for the CMC Central Manager.

## Table of Contents

- [Security Guide](#security-guide)
  - [Table of Contents](#table-of-contents)
  - [Security Features](#security-features)
  - [Configuration](#configuration)
    - [Environment Variables](#environment-variables)
    - [Generating Secure Keys](#generating-secure-keys)
  - [Password Encryption](#password-encryption)
    - [Enabling Encryption](#enabling-encryption)
    - [Encryption Details](#encryption-details)
    - [Migrating Existing Data](#migrating-existing-data)
  - [Network Security](#network-security)
    - [HTTPS Configuration](#https-configuration)
    - [Firewall Configuration](#firewall-configuration)
    - [VPN Access (Recommended)](#vpn-access-recommended)
  - [Database Security](#database-security)
    - [File Permissions](#file-permissions)
    - [Backup Encryption](#backup-encryption)
    - [SQLite Security Settings](#sqlite-security-settings)
  - [Authentication](#authentication)
    - [CMC Authentication](#cmc-authentication)
    - [Application Authentication (Future Enhancement)](#application-authentication-future-enhancement)
  - [Rate Limiting](#rate-limiting)
    - [Configuration](#configuration-1)
    - [Customization](#customization)
    - [Behind Reverse Proxy](#behind-reverse-proxy)
  - [Security Headers](#security-headers)
    - [Helmet.js Configuration](#helmetjs-configuration)
    - [Custom Headers](#custom-headers)
  - [Input Validation](#input-validation)
    - [Validation Rules](#validation-rules)
    - [Sanitisation](#sanitisation)
  - [Logging](#logging)
    - [What's Logged](#whats-logged)
    - [Sensitive Data Masking](#sensitive-data-masking)
    - [Log Management](#log-management)
  - [Security Checklist](#security-checklist)
    - [Pre-production](#pre-production)
    - [Post-deployment](#post-deployment)
  - [Incident Response](#incident-response)
    - [Security Breach Response](#security-breach-response)
    - [Reporting Vulnerabilities](#reporting-vulnerabilities)
  - [Additional Resources](#additional-resources)
  - [Questions?](#questions)

---

## Security Features

The CMC Central Manager includes the following security features:

- **Password Encryption**: Optional AES-256-GCM encryption for stored passwords
- **Rate Limiting**: Protection against brute force and DDoS attacks
- **Input Sanitization**: XSS and injection attack prevention
- **Security Headers**: Helmet.js with CSP, HSTS, and more
- **CORS Configuration**: Configurable origin restrictions
- **Input Validation**: Comprehensive validation middleware
- **Secure Sessions**: HttpOnly, Secure, SameSite cookies
- **Request Logging**: Audit trail with sensitive data masking

---

## Configuration

### Environment Variables

**Backend (`.env`):**

```bash
# Enable password encryption
ENCRYPT_PASSWORDS=true

# Generate with: openssl rand -base64 32
ENCRYPTION_KEY=your-secure-random-key-here

# CORS origins (comma-separated)
CORS_ORIGIN=https://your-domain.com,https://trusted-domain.com

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100   # Max requests per window

# Session security
SESSION_SECRET=your-session-secret-here
SESSION_MAX_AGE=86400000  # 24 hours
```

### Generating Secure Keys
```bash
# Generate encryption key
openssl rand -base64 32

# Generate session secret
openssl rand -hex 32

# Generate random password
openssl rand -base64 16
```

---

## Password Encryption

### Enabling Encryption
1. Generate an ecryption key: 
```bash
openssl rand -base64 32
```
2. Add to `.env`
```bash
ENCRYPT_PASSWORDS=true
ENCRYPTION_KEY=<your-generated-key>
```
3. **IMPORTANT:** Store Encryption key securely
    - Never commit to version control
    - Use environment variables or secret management
    - Backup securely (losing the key means losing all passwords)

### Encryption Details
- **Algorithm:** AES-256-GCM (Authenticated Encryption)
- **Key Derivation:** PBKDF2 with 100,000 iterations
- **IV:** Random 16 bytes per encryption
- **Salt:** Random 64 bytes per encryption
- **Authentication:** 16-byte auth tag for integrity

### Migrating Existing Data
If Enabling encryption on existing database:
```js
// Run this migration script
import { statements } from './database.js';
import { encrypt } from './utils/encryption.js';

const encryptionKey = process.env.ENCRYPTION_KEY;
const cmcs = statements.getAllCmcs.all();

for (const cmc of cmcs) {
  const encryptedPassword = encrypt(cmc.password, encryptionKey);
  statements.updateCmc.run(
    cmc.name,
    cmc.address,
    cmc.username,
    encryptedPassword,
    cmc.notes,
    Date.now(),
    cmc.id
  );
}

console.log('Migration complete!');
```


---

## Network Security
### HTTPS Configuration
**Always use HTTPS in production.**
**With Let's Encrypt (Recommended)**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-apache

# Obtain certificate
sudo certbot --apache -d your-domain.com

# Auto-renewal is configured automatically
```
**With Self Signed Certificate (Development or Internal Use Only)**
```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout server.key \
  -out server.crt
```

### Firewall Configuration
**Ubuntu/Debian (UFW)**
```bash
# Allow SSH (be careful!)
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow backend only from localhost (recommended)
# Frontend proxies requests to backend

# Enable firewall
sudo ufw enable
```

**RHEL/CentOs (firewalld)**
```bash
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### VPN Access (Recommended)
For maximum security, deploy behind a VPN:
- Use WireGuard or OpenVPN
- Only allow access from VPN network
- No public internet exposure
---

## Database Security
### File Permissions
```bash
# Restrict database access
chmod 600 cmc-backend/cmc-manager.db
chown app-user:app-user cmc-backend/cmc-manager.db

# Prevent directory listing
chmod 750 cmc-backend/
```
### Backup Encryption
```bash
# Backup with encryption
tar -czf - cmc-manager.db | openssl enc -aes-256-cbc -e > backup.tar.gz.enc

# Restore
openssl enc -aes-256-cbc -d -in backup.tar.gz.enc | tar -xz
```

### SQLite Security Settings
Already configured in `database.js`:

- **WAL Mode:** Write-Ahead Logging for better concurrency
- **Synchronous Mode:** Default (safe)
- **Foreign Keys:** Enabled (if using relationships)

---

## Authentication
### CMC Authentication
The application stores CMC credentials to automate access. Security considerations:

- **Least Privilege:** Use dedicated CMC accounts with minimal permissions
- **Regular Rotation:** Change CMC passwords periodically
- **Audit Logs:** Monitor CMC access logs for suspicious activity

### Application Authentication (Future Enhancement)
Consider adding:

- User authentication with bcrypt/argon2
- JWT tokens for API access
- Role-based access control (RBAC)
- Multi-factor authentication (MFA)
- OAuth/SAML integration

---

## Rate Limiting

### Configuration
Default settings:

- **General:** 100 requests per 15 minutes
- **API:** 50 requests per 15 minutes
- **Health Check:** Excluded from rate limiting

### Customization
Edit `.env`:
```bash
RATE_LIMIT_WINDOW_MS=900000      # 15 minutes in ms
RATE_LIMIT_MAX_REQUESTS=100      # Max requests
```

### Behind Reverse Proxy
Set `trust_proxy`:`
```js
app.set('trust proxy', 1);
```


---

## Security Headers

### Helmet.js Configuration
Automatically applied headers:

- **Content-Security-Policy:** Prevents XSS attacks
- **Strict-Transport-Security:** Enforces HTTPS
- **X-Content-Type-Options:** Prevents MIME sniffing
- **X-Frame-Options:** Prevents clickjacking
- **X-XSS-Protection:** Browser XSS filter

### Custom Headers
Add in nginx/Apache:
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```


---

## Input Validation
### Validation Rules
All CMC data is validated:

- **Name:** 1-100 characters
- **Address:** Valid URL with http/https
- **Username:** 1-100 characters
- **Password:** 1-255 characters
- **Notes:** 0-1000 characters

### Sanitisation
Automatic sanitization removes:

- `<script>` tags
- `javascript:` URLs
- Event handlers (`onclick=`, etc.)

---

## Logging

### What's Logged
- All API requests (method, path, status, duration)
- Error messages and stack traces (dev only)
- Security events (rate limit triggers, validation failures)

### Sensitive Data Masking
Passwords and tokens are automatically masked:
```js
{
  "username": "admin",
  "password": "***REDACTED***"
}
```

### Log Management
**Rotate Logs:**
```bash
# Install logrotate
sudo apt install logrotate

# Create config: /etc/logrotate.d/cmc-manager
/path/to/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 app-user app-group
    sharedscripts
}
```

---

## Security Checklist
### Pre-production
- [ ] Change all default passwords
 - [ ] Generate secure encryption and session keys
 - [ ] Enable password encryption
 - [ ] Configure CORS with specific origins
 - [ ] Set up HTTPS with valid certificate
 - [ ] Configure firewall rules
 - [ ] Set proper file permissions
 - [ ] Enable rate limiting
 - [ ] Configure log rotation
 - [ ] Set up automated backups
 - [ ] Review and test disaster recovery
 - [ ] Scan for vulnerabilities
 - [ ] Update all dependencies

### Post-deployment
- [ ] Monitor logs regularly
- [ ] Review access patterns
- [ ] Test backup restoration
- [ ] Update dependencies monthly
- [ ] Review and rotate credentials quarterly
- [ ] Conduct security audit annually

--- 

## Incident Response
### Security Breach Response
1. **Immediate Actions**
   - Isolate affected systems
   - Change all passwords
   - Review logs for breach extent
   - Document everything
2. **Investigation**
   - Identify attack vector
    - Determine data exposure
    - Check for persistence mechanisms
2. **Remediation**
    - Patch vulnerabilities
    - Update security measures
    - Restore from clean backups if needed

3. **Post-Incident**

   - Update security procedures
   - Train team on lessons learned
   - Implement additional monitoring

### Reporting Vulnerabilities
If you discover a security vulnerability:

1. **Do NOT** open a public issue
2. Email: [your-security-email@domain.com]
3. Include:
    - Description of vulnerability
    - Steps to reproduce
    - Potential impact
    - Suggested fix (if any)

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [SQLite Security](https://www.sqlite.org/security.html)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
---
## Questions? 
For security-related questions or concerns, contact: [your-email@domain.com]