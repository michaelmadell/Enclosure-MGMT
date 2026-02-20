#!/bin/bash

# CMC Central Manager - Two-Step Deployment
# Step 1: Build as user (has Node.js access)
# Step 2: Deploy as sudo (needs root permissions)

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DOMAIN="${1:-localhost}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  CMC Manager - User Build & Deploy   ${NC}"
echo -e "${BLUE}========================================${NC}"
echo

# Check if we're running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}❌ Do NOT run this script with sudo${NC}"
    echo -e "${YELLOW}This script will prompt for sudo when needed${NC}"
    exit 1
fi

echo -e "${BLUE}Step 1: Verify Node.js is Available${NC}"
echo "------------------------------------"

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found${NC}"
    echo -e "${YELLOW}Please install Node.js first:${NC}"
    echo "  - From: https://nodejs.org/"
    echo "  - Or use nvm: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
    exit 1
fi

echo -e "${GREEN}✓${NC} Node.js found: $(node --version)"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} npm found: $(npm --version)"

echo
echo -e "${BLUE}Step 2: Build the Application${NC}"
echo "------------------------------"

if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json not found${NC}"
    echo -e "${YELLOW}Please run this script from the cmc-manager directory${NC}"
    exit 1
fi

echo -e "${YELLOW}→${NC} Installing dependencies..."
npm install --quiet --legacy-peer-deps

echo -e "${YELLOW}→${NC} Building production bundle..."
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build failed - dist/ directory not created${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Build successful"

echo
echo -e "${BLUE}Step 3: Deploy with Sudo${NC}"
echo "-------------------------"

echo -e "${YELLOW}→${NC} Elevating to sudo for deployment..."

# Create directory
sudo mkdir -p /var/www/cmc-manager

# Copy files
echo -e "${YELLOW}→${NC} Copying files..."
sudo cp -r dist/* /var/www/cmc-manager/

# Set permissions
echo -e "${YELLOW}→${NC} Setting permissions..."
sudo chown -R www-data:www-data /var/www/cmc-manager
sudo chmod -R 755 /var/www/cmc-manager

echo -e "${GREEN}✓${NC} Files deployed to /var/www/cmc-manager"

echo
echo -e "${BLUE}Step 4: Configure Apache${NC}"
echo "------------------------"

# Check if Apache is installed
if ! command -v apache2 &> /dev/null; then
    echo -e "${RED}❌ Apache2 not installed${NC}"
    echo -e "${YELLOW}Install with: sudo apt install apache2${NC}"
    exit 1
fi

# Enable modules
echo -e "${YELLOW}→${NC} Enabling Apache modules..."
sudo a2enmod proxy proxy_http headers rewrite ssl &> /dev/null || true

# Copy config
if [ -f "apache-config/cmc-manager.conf" ]; then
    echo -e "${YELLOW}→${NC} Installing Apache configuration..."
    sudo cp apache-config/cmc-manager.conf /etc/apache2/sites-available/
    
    # Update domain
    sudo sed -i "s/cmc-manager.yourcompany.com/$DOMAIN/g" /etc/apache2/sites-available/cmc-manager.conf
    
    # Disable default site
    sudo a2dissite 000-default.conf &> /dev/null || true
    
    # Enable our site
    sudo a2ensite cmc-manager.conf
    
    echo -e "${GREEN}✓${NC} Apache configured"
else
    echo -e "${YELLOW}⚠${NC}  Apache config not found, skipping..."
fi

echo
echo -e "${BLUE}Step 5: Test Apache Configuration${NC}"
echo "-----------------------------------"

if sudo apache2ctl configtest 2>&1 | grep -q "Syntax OK"; then
    echo -e "${GREEN}✓${NC} Apache configuration is valid"
else
    echo -e "${RED}❌ Apache configuration has errors${NC}"
    sudo apache2ctl configtest
    exit 1
fi

echo
echo -e "${BLUE}Step 6: Reload Apache${NC}"
echo "---------------------"

sudo systemctl reload apache2

if sudo systemctl is-active --quiet apache2; then
    echo -e "${GREEN}✓${NC} Apache reloaded successfully"
else
    echo -e "${RED}❌ Apache failed to reload${NC}"
    sudo systemctl status apache2
    exit 1
fi

echo
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}     Deployment Successful! 🎉${NC}"
echo -e "${GREEN}========================================${NC}"
echo
echo -e "${BLUE}Application URL:${NC} http://$DOMAIN"
echo
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Access: http://$DOMAIN"
echo "  2. Click 'Add CMC' to add your chassis"
echo "  3. Test with multiple CMCs!"
echo
echo -e "${YELLOW}View logs:${NC}"
echo "  sudo tail -f /var/log/apache2/cmc-manager-access.log"
echo
