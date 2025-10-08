#!/bin/bash
# BerthCare Backend Setup Verification Script
# Verifies that all components are properly configured

set -e

echo "🔍 BerthCare Backend Setup Verification"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check functions
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# 1. Check Node.js version
echo "1. Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 20 ]; then
    check_pass "Node.js version $(node -v) (required: 20+)"
else
    check_fail "Node.js version $(node -v) is too old (required: 20+)"
    exit 1
fi
echo ""

# 2. Check npm version
echo "2. Checking npm version..."
NPM_VERSION=$(npm -v | cut -d'.' -f1)
if [ "$NPM_VERSION" -ge 10 ]; then
    check_pass "npm version $(npm -v) (required: 10+)"
else
    check_warn "npm version $(npm -v) is old (recommended: 10+)"
fi
echo ""

# 3. Check if dependencies are installed
echo "3. Checking dependencies..."
if [ -d "node_modules" ]; then
    check_pass "Dependencies installed"
else
    check_fail "Dependencies not installed. Run: npm install"
    exit 1
fi
echo ""

# 4. Check TypeScript compilation
echo "4. Checking TypeScript compilation..."
if npm run type-check > /dev/null 2>&1; then
    check_pass "TypeScript compilation successful"
else
    check_fail "TypeScript compilation failed"
    exit 1
fi
echo ""

# 5. Check environment file
echo "5. Checking environment configuration..."
if [ -f "../../.env" ]; then
    check_pass "Environment file exists"
else
    check_warn "Environment file not found. Copy .env.example to .env"
fi
echo ""

# 6. Check Docker services
echo "6. Checking Docker services..."
if command -v docker &> /dev/null; then
    check_pass "Docker is installed"
    
    # Check if PostgreSQL is running
    if docker ps | grep -q postgres; then
        check_pass "PostgreSQL container is running"
    else
        check_warn "PostgreSQL container not running. Run: docker-compose up -d"
    fi
    
    # Check if Redis is running
    if docker ps | grep -q redis; then
        check_pass "Redis container is running"
    else
        check_warn "Redis container not running. Run: docker-compose up -d"
    fi
else
    check_warn "Docker not installed or not running"
fi
echo ""

# 7. Check file structure
echo "7. Checking file structure..."
REQUIRED_FILES=(
    "src/index.ts"
    "src/cache/index.ts"
    "src/database/index.ts"
    "src/middleware/monitoring.ts"
    "src/monitoring/logger.ts"
    "src/monitoring/metrics.ts"
    "src/monitoring/sentry.ts"
    "package.json"
    "tsconfig.json"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        check_pass "$file exists"
    else
        check_fail "$file missing"
        exit 1
    fi
done
echo ""

# 8. Check if server can start (optional - requires services)
echo "8. Testing server startup (optional)..."
if docker ps | grep -q postgres && docker ps | grep -q redis; then
    echo "   Starting server for 5 seconds..."
    timeout 5s npm run dev > /dev/null 2>&1 || true
    
    # Give server time to start
    sleep 2
    
    # Test health endpoint
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        check_pass "Server started successfully"
        check_pass "Health endpoint responding"
    else
        check_warn "Server started but health endpoint not responding"
    fi
else
    check_warn "Skipping server test (Docker services not running)"
fi
echo ""

# Summary
echo "========================================"
echo "✅ Setup verification complete!"
echo ""
echo "Next steps:"
echo "  1. Start Docker services: docker-compose up -d"
echo "  2. Start backend server: npm run dev"
echo "  3. Test health endpoint: curl http://localhost:3000/health"
echo ""
echo "For more information, see:"
echo "  - QUICKSTART.md"
echo "  - README.md"
echo "  - ../../docs/B1-completion-summary.md"
