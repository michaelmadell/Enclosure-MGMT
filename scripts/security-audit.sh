#!/bin/bash

# Security Audit Script for CMC Central Manager
# Run this script regularly to check for security issues

echo "╔════════════════════════════════════════╗"
echo "║    CMC Manager Security Audit          ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track issues
ISSUES=0

# Check 1: Environment files
echo "Checking environment configuration..."
if [ -f "cmc-backend/.env" ]; then
    if grep -q "change-this" cmc-backend/.env; then
        echo -e "${RED}✗${NC} Default passwords found in .env"
        ((ISSUES++))
    else
        echo -e "${GREEN}✓${NC} No default passwords in .env"
    fi
else
    echo -e "${YELLOW}!${NC} .env file not found"
fi

# Check 2: File permissions
echo ""
echo "Checking file permissions..."
if [ -f "cmc-backend/cmc-manager.db" ]; then
    PERMS=$(stat -c "%a" cmc-backend/cmc-manager.db)
    if [ "$PERMS" != "600" ]; then
        echo -e "${RED}✗${NC} Database permissions too open: $PERMS (should be 600)"
        ((ISSUES++))
    else
        echo -e "${GREEN}✓${NC} Database permissions correct"
    fi
fi

# Check 3: NPM vulnerabilities
echo ""
echo "Checking npm vulnerabilities..."
cd cmc-backend
AUDIT_OUTPUT=$(npm audit --json 2>/dev/null)
VULNERABILITIES=$(echo "$AUDIT_OUTPUT" | grep -o '"total":[0-9]*' | head -1 | grep -o '[0-9]*')

if [ "$VULNERABILITIES" -gt 0 ]; then
    echo -e "${RED}✗${NC} Found $VULNERABILITIES npm vulnerabilities"
    ((ISSUES++))
else
    echo -e "${GREEN}✓${NC} No npm vulnerabilities found"
fi
cd ..

cd cmc-interface
AUDIT_OUTPUT=$(npm audit --json 2>/dev/null)
VULNERABILITIES=$(echo "$AUDIT_OUTPUT" | grep -o '"total":[0-9]*' | head -1 | grep -o '[0-9]*')

if [ "$VULNERABILITIES" -gt 0 ]; then
    echo -e "${RED}✗${NC} Found $VULNERABILITIES npm vulnerabilities in frontend"
    ((ISSUES++))
else
    echo -e "${GREEN}✓${NC} No npm vulnerabilities found in frontend"
fi
cd ..

# Check 4: Exposed secrets
echo ""
echo "Checking for exposed secrets..."
if git log --all --full-history -- "**/*.env" | grep -q "commit"; then
    echo -e "${YELLOW}!${NC} .env files found in git history"
fi

# Check 5: HTTPS configuration
echo ""
echo "Checking HTTPS configuration..."
if [ -f "cmc-interface/.env" ]; then
    if grep -q "http://" cmc-interface/.env && ! grep -q "localhost" cmc-interface/.env; then
        echo -e "${YELLOW}!${NC} HTTP URLs found (consider using HTTPS in production)"
    else
        echo -e "${GREEN}✓${NC} HTTPS or localhost URLs configured"
    fi
fi

# Check 6: Rate limiting
echo ""
echo "Checking rate limiting configuration..."
if [ -f "cmc-backend/.env" ]; then
    if grep -q "RATE_LIMIT" cmc-backend/.env; then
        echo -e "${GREEN}✓${NC} Rate limiting configured"
    else
        echo -e "${YELLOW}!${NC} Rate limiting not explicitly configured (using defaults)"
    fi
fi

# Check 7: CORS configuration
echo ""
echo "Checking CORS configuration..."
if [ -f "cmc-backend/.env" ]; then
    if grep -q "CORS_ORIGIN=\*" cmc-backend/.env; then
        echo -e "${YELLOW}!${NC} CORS allows all origins (acceptable for development)"
    else
        echo -e "${GREEN}✓${NC} CORS configured with specific origins"
    fi
fi

# Summary
echo ""
echo "════════════════════════════════════════"
if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}Security audit passed!${NC}"
    exit 0
else
    echo -e "${RED}Found $ISSUES security issues${NC}"
    echo "Please review and fix the issues above"
    exit 1
fi