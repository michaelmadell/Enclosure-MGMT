# Deployment Guide

This guide covers deploying CMC Central Manager to various environments.

## Prerequisites

- Node.js 16+ installed
- Sufficient disk space for database
- Network access to CMC devices
- (Optional) nginx or Apache for frontend
- (Optional) PM2 for process management

## Development Deployment

### 1. Backend

```bash
cd cmc-backend
npm install
cp .env.example .env
# Edit .env as needed
npm run dev
```

### 2. Frontend
```bash
cd cmc-interface
npm install
cp .env.example .env
npm run dev
```

Access: http://localhost:5173


## Production Deployment

### 1. Prepare Backend
```bash
cd cmc-backend
npm install --production
cp .env.example .env
```
Edit `.env`:
```bash
PORT=3001
NODE_ENV=production
CORS_ORIGIN=http://your-domain.com
```

### 2. Install PM2
```bash
npm install -g pm2
```

### 3. Start Backend with PM2
```bash
cd cmc-backend
pm2 start server.js --name cmc-backend
pm2 save
pm2 startup
# Follow the instructions to enable auto-start
```

### 4. Build Frontend

```bash
cd cmc-interface
npm install
cp .env.example .env
```

Edit `.env`:
```bash
VITE_API_URL=http://your-server-ip:3001/api
```
Build:
```bash
npm run build
```

### 5. Deploy Frontend 

#### 5A. Apache Configuration

##### 5A.1 Install Apache

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install apache2
```

**RHEL/CentOS/Fedora:**
```bash
sudo yum install httpd
# or
sudo dnf install httpd
```

##### 5A.2 Enable Required Modules

**Ubuntu/Debian**
```bash
sudo a2enmod proxy proxy_http headers rewrite ssl
```

**RHEL/CentOS/Fedora:**
Modules are typically enabled by default. Verify in `/etc/httpd/conf.modules.d/`

##### 5A.3 Basic HTTP Configuration

Create Apache virtual host configuration
```bash
sudo nano /etc/apache2/sites-available/cmc-manager.conf
```

**Configuration (HTTP-Only):**
```apache
<VirtualHost *:80>
    ServerName cmc-manager.yourcompany.com
    ServerAdmin admin@yourcompany.com

    # Document root for frontend
    DocumentRoot /var/ww/cmc-manager

    # Logging
    ErrorLog ${APACHE_LOG_DIR}/cmc-manager-error.log
    CustomLog ${APACHE_LOG_DIR}/cmc-manager-access.log combined

    # Frontend directory
    <Directory /var/www/cmc-manager>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted

        # SPA routing - redirect all requests to index.html
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    # Proxy API requests to Node.js backend
    ProxyPreserveHost On
    ProxyPass /api http://localhost:3001/api
    ProxyPassReverse /api http://localhost:3001/api

    # Health check endpoint
    ProxyPass /health http://localhost:3001/health
    ProxyPassReverse /health http://localhost:3001/health

    # Security headers
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"

    # Enable compression
    <IfModule mod_deflate.c>
        AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css
        AddOutputFilterByType DEFLATE application/javascript application/json
    </IfModule>

    # Browser caching for static assets
    <IfModule mod_expires.c>
        ExpiresActive On
        ExpiresByType image/jpg "access plus 1 year"
        ExpiresByType image/jpeg "access plus 1 year"
        ExpiresByType image/gif "access plus 1 year"
        ExpiresByType image/png "access plus 1 year"
        ExpiresByType image/svg+xml "access plus 1 year"
        ExpiresByType text/css "access plus 1 month"
        ExpiresByType application/javascript "access plus 1 month"
        ExpiresByType application/x-javascript "access plus 1 month"
        ExpiresByType text/javascript "access plus 1 month"
    </IfModule>
</VirtualHost>
```

##### 5A.4 HTTPS Configuration (Recommended)
**Option A: Self-Signed Certificate (Development/Internal Use)**
Generate certificate:
```bash
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/cmc-manager.key \
  -out /etc/ssl/certs/cmc-manager.crt
```

**Option B: Let's Encrypt (Production)**

Install Certbot:
```bash
# Ubuntu/Debian
sudo apt install certbot python3-certbot-apache

# RHEL/CentOS/Fedora
sudo yum install certbot python3-certbot-apache
```

Obtain certificate:
```bash
sudo certbot --apache -d cmc-manager.yourcompany.com
```

**HTTPS Virtual Host Configuration:**

```bash
sudo nano /etc/apache2/sites-available/cmc-manager-ssl.conf
```

```apache
<VirtualHost *:80>
    ServerName cmc-manager.yourcompany.com
    
    # Redirect all HTTP to HTTPS
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}$1 [R=301,L]
</VirtualHost>

<VirtualHost *:443>
    ServerName cmc-manager.yourcompany.com
    ServerAdmin admin@yourcompany.com

    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /etc/ssl/certs/cmc-manager.crt
    SSLCertificateKeyFile /etc/ssl/private/cmc-manager.key
    
    # For Let's Encrypt, use:
    # SSLCertificateFile /etc/letsencrypt/live/cmc-manager.yourcompany.com/fullchain.pem
    # SSLCertificateKeyFile /etc/letsencrypt/live/cmc-manager.yourcompany.com/privkey.pem

    # Modern SSL configuration
    SSLProtocol all -SSLv3 -TLSv1 -TLSv1.1
    SSLCipherSuite HIGH:!aNULL:!MD5:!3DES
    SSLHonorCipherOrder on
    SSLCompression off

    # HSTS (Optional but recommended)
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"

    # Document root for frontend
    DocumentRoot /var/www/cmc-manager

    # Logging
    ErrorLog ${APACHE_LOG_DIR}/cmc-manager-ssl-error.log
    CustomLog ${APACHE_LOG_DIR}/cmc-manager-ssl-access.log combined

    # Frontend directory
    <Directory /var/www/cmc-manager>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted

        # SPA routing
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    # Proxy API requests to Node.js backend
    ProxyPreserveHost On
    ProxyPass /api http://localhost:3001/api
    ProxyPassReverse /api http://localhost:3001/api

    # Health check endpoint
    ProxyPass /health http://localhost:3001/health
    ProxyPassReverse /health http://localhost:3001/health

    # Security headers
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' http://localhost:3001 https://localhost:3001"

    # Enable compression
    <IfModule mod_deflate.c>
        AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css
        AddOutputFilterByType DEFLATE application/javascript application/json
    </IfModule>

    # Browser caching
    <IfModule mod_expires.c>
        ExpiresActive On
        ExpiresByType image/jpg "access plus 1 year"
        ExpiresByType image/jpeg "access plus 1 year"
        ExpiresByType image/gif "access plus 1 year"
        ExpiresByType image/png "access plus 1 year"
        ExpiresByType image/svg+xml "access plus 1 year"
        ExpiresByType text/css "access plus 1 month"
        ExpiresByType application/javascript "access plus 1 month"
        ExpiresByType application/x-javascript "access plus 1 month"
        ExpiresByType text/javascript "access plus 1 month"
    </IfModule>
</VirtualHost>
```

##### 5A.5 Deploy Frontend Files

```bash
sudo mkdir -p /var/www/cmc-manager
sudo cp -r cmc-interface/dist/* /var/www/cmc-manager/
sudo chown -R www-data:www-data /var/www/cmc-manager
sudo chmod -R 755 /var/www/cmc-manager
```
**For RHEL/CentOS/Fedora:**
```bash
sudo chown -R apache:apache /var/www/cmc-manager
```

##### 5A.6 Enable Site and Restart Apache
**Ubuntu/Debian:**
```bash
# Disable default site
sudo a2dissite 000-default.conf

# Enable CMC Manager site
sudo a2ensite cmc-manager.conf
# or for HTTPS
sudo a2ensite cmc-manager-ssl.conf

# Test configuration
sudo apache2ctl configtest

# Restart Apache
sudo systemctl restart apache2
```

**RHEL/CentOS/Fedora:**
```bash
# Copy config to httpd conf.d
sudo cp cmc-manager.conf /etc/httpd/conf.d/

# Test configuration
sudo httpd -t

# Restart Apache
sudo systemctl restart httpd
```

##### 5A.7 Firewall Configuration

**Ubuntu/Debian (UFW):**
```bash
sudo ufw allow 'Apache Full'
# or for HTTPS only
sudo ufw allow 'Apache Secure'
```

**RHEL/CentOS/Fedora (firewalld):**
```bash
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

##### 5A.8 SELinux Configuration (RHEL/CentOS/Fedora)

If using SELinux:

```bash
# Allow Apache to connect to backend
sudo setsebool -P httpd_can_network_connect 1

# Set correct context for web files
sudo semanage fcontext -a -t httpd_sys_content_t "/var/www/cmc-manager(/.*)?"
sudo restorecon -Rv /var/www/cmc-manager
```
#### 5B. nginx Configuration (Alternative)

##### 5B.1 Install nginx

```bash
sudo apt install nginx # Ubuntu/Debian
sudo yum install nginx # RHEL/CentOS
```

##### 5B.2. Create nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/cmc-manager
```

**HTTP Configuration:**

```nginx
server {
    listen 80;
    server_name cmc-manager.yourcompany.com;
    
    root /var/www/cmc-manager;
    index index.html;
    
    # Logging
    access_log /var/log/nginx/cmc-manager-access.log;
    error_log /var/log/nginx/cmc-manager-error.log;
    
    # Frontend - SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Proxy API requests to backend
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:3001/health;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/json application/javascript;
    
    # Browser caching
    location ~* \.(jpg|jpeg|png|gif|ico|svg|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**HTTPS Configuration:**

```nginx
server {
    listen 80;
    server_name cmc-manager.yourcompany.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name cmc-manager.yourcompany.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/cmc-manager.yourcompany.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cmc-manager.yourcompany.com/privkey.pem;
    
    # Modern SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    root /var/www/cmc-manager;
    index index.html;
    
    access_log /var/log/nginx/cmc-manager-ssl-access.log;
    error_log /var/log/nginx/cmc-manager-ssl-error.log;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /health {
        proxy_pass http://localhost:3001/health;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/json application/javascript;
    
    location ~* \.(jpg|jpeg|png|gif|ico|svg|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

##### 5B.3 Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/cmc-manager /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Docker Deployment

### Backend Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3001

CMD ["node", "server.js"]
```

### Frontend Dockerfile

```dockerfile
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  backend:
    build: ./cmc-backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - CORS_ORIGIN=*
    volumes:
      - ./data:/app/data
    restart: unless-stopped

  frontend:
    build: ./cmc-interface
    ports:
      - "80:80"
    environment:
      - VITE_API_URL=http://localhost:3001/api
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  data:
```

Run:
```bash
docker-compose up -d
```

---

## Security Hardening

### 1. Database Permissions

```bash
chmod 600 cmc-backend/cmc-manager.db
chown node-user:node-user cmc-backend/cmc-manager.db
```

### 2. Environment Variables

Never commit `.env` files. Use environment-specific configurations.

### 3. Firewall Rules

**UFW (Ubuntu/Debian):**
```bash
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

**firewalld (RHEL/CentOS):**
```bash
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 4. Fail2Ban (Optional)

```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## Monitoring

### PM2 Monitoring

```bash
pm2 monit
pm2 logs cmc-backend
pm2 status
```

### Apache Logs

```bash
sudo tail -f /var/log/apache2/cmc-manager-access.log
sudo tail -f /var/log/apache2/cmc-manager-error.log
```

### nginx Logs

```bash
sudo tail -f /var/log/nginx/cmc-manager-access.log
sudo tail -f /var/log/nginx/cmc-manager-error.log
```

---

## Backup

### Database Backup

```bash
# Manual backup
cp cmc-backend/cmc-manager.db cmc-backend/backups/cmc-manager-$(date +%Y%m%d).db

# Automated backup (cron)
0 2 * * * cp /path/to/cmc-backend/cmc-manager.db /path/to/backups/cmc-manager-$(date +\%Y\%m\%d).db
```

---

## Automated Deployment Script

The repository includes an automated deployment script for Apache:

```bash
cd cmc-interface
./deploy.sh
```

This script will:
1. Check Node.js installation
2. Build the application
3. Deploy files to `/var/www/cmc-manager`
4. Configure Apache
5. Reload Apache

---

## Troubleshooting

### Backend won't start
```bash
pm2 logs cmc-backend
# Check port availability
lsof -i :3001
```

### Frontend can't connect
- Check `VITE_API_URL` in frontend `.env`
- Verify backend is running: `curl http://localhost:3001/health`
- Check browser console for CORS errors
- Check Apache/nginx proxy configuration

### Apache Issues
```bash
# Test configuration
sudo apache2ctl configtest

# Check error logs
sudo tail -f /var/log/apache2/error.log

# Check if modules are enabled
apache2ctl -M | grep proxy
```

### nginx Issues
```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log
```

### Database locked
- Check file permissions
- Ensure no multiple instances writing
- WAL mode is already enabled

### SSL Certificate Issues
```bash
# Verify certificate
openssl x509 -in /etc/ssl/certs/cmc-manager.crt -text -noout

# Renew Let's Encrypt certificate
sudo certbot renew
```

### SELinux Denials (RHEL/CentOS)
```bash
# Check for denials
sudo ausearch -m avc -ts recent

# Generate policy if needed
sudo ausearch -m avc -ts recent | audit2allow -M cmc-manager
sudo semodule -i cmc-manager.pp
```