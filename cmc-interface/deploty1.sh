#!/bin/bash

# Deploy Fixed Apache Configuration for URL-Encoded CMC Addresses

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Deploy Fixed Apache Config - URL Encoding    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}This script needs sudo privileges${NC}"
    echo -e "Run: ${BLUE}sudo ./deploy-apache-fix.sh${NC}"
    exit 1
fi

# Backup existing config
if [ -f /etc/apache2/sites-available/cmc-manager.conf ]; then
    echo -e "${YELLOW}→${NC} Backing up current configuration..."
    cp /etc/apache2/sites-available/cmc-manager.conf \
       /etc/apache2/sites-available/cmc-manager.conf.backup-$(date +%Y%m%d-%H%M%S)
    echo -e "${GREEN}✓${NC} Backup created"
fi

# Install new config
echo -e "${YELLOW}→${NC} Installing fixed Apache configuration..."
cp apache-config/cmc-manager.conf /etc/apache2/sites-available/cmc-manager.conf
echo -e "${GREEN}✓${NC} Configuration installed"
echo

# Test config
echo -e "${YELLOW}→${NC} Testing Apache configuration..."
if apache2ctl configtest 2>&1 | grep -q "Syntax OK"; then
    echo -e "${GREEN}✓${NC} Configuration syntax is valid"
else
    echo -e "${RED}✗${NC} Configuration has errors:"
    apache2ctl configtest
    exit 1
fi
echo

# Reload Apache
echo -e "${YELLOW}→${NC} Reloading Apache..."
systemctl reload apache2
echo -e "${GREEN}✓${NC} Apache reloaded"
echo

echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Apache Configuration Updated!${NC}"
echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo

echo -e "${YELLOW}Key Changes:${NC}"
echo -e "  • Added ${BLUE}AllowEncodedSlashes NoDecode${NC}"
echo -e "  • Added ${BLUE}NE (NoEscape)${NC} flag to RewriteRule"
echo -e "  • Simplified proxy pattern"
echo
echo -e "${YELLOW}Now Testing:${NC}"
echo

# Test the proxy
SERVER_IP=$(ip -4 addr show | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v '127.0.0.1' | head -1)

echo -e "Testing CMC proxy with encoded URL..."
ENCODED_ADDR=$(echo -n "http://10.50.0.132" | jq -sRr @uri)
TEST_URL="http://localhost/api/cmc/${ENCODED_ADDR}/api/interface/info"

echo -e "Test URL: ${BLUE}${TEST_URL}${NC}"
echo

if curl -s -o /dev/null -w "%{http_code}" "$TEST_URL" -k | grep -qE "^(200|401)"; then
    echo -e "${GREEN}✓${NC} Proxy is working! (Got response from CMC)"
else
    echo -e "${YELLOW}!${NC} Could not reach test CMC (this is OK if CMC doesn't exist)"
fi

echo
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  1. Hard refresh browser: ${BLUE}Ctrl+Shift+R${NC}"
echo -e "  2. Try adding CMC with address: ${BLUE}http://10.50.0.132${NC}"
echo -e "  3. Click ${BLUE}Test Connection${NC}"
echo
echo -e "${YELLOW}Verify in browser console:${NC}"
echo -e "  Should see: ${GREEN}Response status: 200 OK${NC}"
echo -e "  Should see: ${GREEN}Response content-type: application/json${NC}"
echo
echo -e "${YELLOW}Check Apache logs if issues persist:${NC}"
echo -e "  ${BLUE}sudo tail -f /var/log/apache2/cmc-manager-error.log${NC}"
echo