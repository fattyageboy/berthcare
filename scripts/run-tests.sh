#!/bin/bash

# Visit Service Integration Tests - Execution Script
# This script verifies prerequisites and runs integration tests

set -e  # Exit on error

echo "=========================================="
echo "Visit Service Integration Tests"
echo "=========================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Must be run from backend directory${NC}"
    echo "Usage: cd backend && ./run-tests.sh"
    exit 1
fi

echo "Step 1: Checking prerequisites..."
echo ""

# Check PostgreSQL
echo -n "Checking PostgreSQL... "
if pg_isready > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not running${NC}"
    echo "Please start PostgreSQL and try again"
    exit 1
fi

# Check if node_modules exists
echo -n "Checking dependencies... "
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓ Installed${NC}"
else
    echo -e "${YELLOW}⚠ Not installed${NC}"
    echo "Installing dependencies..."
    npm install
fi

# Check if migrations have been run
echo -n "Checking database migrations... "
if psql -h localhost -U postgres -d berthcare -c "SELECT 1 FROM visits LIMIT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Applied${NC}"
else
    echo -e "${YELLOW}⚠ Not applied${NC}"
    echo "Running migrations..."
    npm run migrate
fi

echo ""
echo "Step 2: Running integration tests..."
echo ""

# Run tests
npm run test:integration

echo ""
echo "=========================================="
echo -e "${GREEN}All tests completed successfully!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  - Review coverage: npm run test:coverage"
echo "  - View HTML report: open coverage/index.html"
echo "  - Run in watch mode: npm run test:watch"
echo ""
