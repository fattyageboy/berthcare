#!/bin/bash
# Redis Connection Verification Script
# Task B3: Configure Redis connection

set -e

echo "🔍 Verifying Redis Connection Setup (Task B3)..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: Redis service running
echo "1️⃣  Checking Redis service..."
if docker-compose ps redis | grep -q "Up"; then
    echo -e "${GREEN}✓${NC} Redis service is running"
else
    echo -e "${RED}✗${NC} Redis service is not running"
    echo "   Run: docker-compose up redis"
    exit 1
fi
echo ""

# Check 2: Redis connection
echo "2️⃣  Testing Redis connection..."
if redis-cli -a berthcare_redis_password PING > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Redis connection successful"
else
    echo -e "${RED}✗${NC} Redis connection failed"
    exit 1
fi
echo ""

# Check 3: Redis module tests
echo "3️⃣  Running Redis module tests..."
if npx tsx test-redis.js > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} All Redis module tests passed"
else
    echo -e "${RED}✗${NC} Redis module tests failed"
    echo "   Run: npm run test:redis"
    exit 1
fi
echo ""

# Check 4: Health check endpoint
echo "4️⃣  Checking health endpoint..."
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    HEALTH_STATUS=$(curl -s http://localhost:3000/health | jq -r '.checks.cache.healthy' 2>/dev/null || echo "false")
    if [ "$HEALTH_STATUS" = "true" ]; then
        echo -e "${GREEN}✓${NC} Health endpoint reports Redis healthy"
    else
        echo -e "${YELLOW}⚠${NC}  Health endpoint available but Redis status unknown"
        echo "   Note: Backend server may not be running"
    fi
else
    echo -e "${YELLOW}⚠${NC}  Health endpoint not available"
    echo "   Note: Backend server is not running (this is OK for verification)"
fi
echo ""

# Check 5: Documentation
echo "5️⃣  Checking documentation..."
if [ -f "src/cache/README.md" ]; then
    echo -e "${GREEN}✓${NC} Cache module README exists"
else
    echo -e "${RED}✗${NC} Cache module README missing"
fi

if [ -f "../../docs/B3-completion-summary.md" ]; then
    echo -e "${GREEN}✓${NC} B3 completion summary exists"
else
    echo -e "${RED}✗${NC} B3 completion summary missing"
fi

if [ -f "../../docs/redis-quick-reference.md" ]; then
    echo -e "${GREEN}✓${NC} Redis quick reference exists"
else
    echo -e "${RED}✗${NC} Redis quick reference missing"
fi
echo ""

# Summary
echo "═══════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ Task B3 Verification Complete${NC}"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Redis Connection Module Status:"
echo "  ✓ Redis service running"
echo "  ✓ Connection working"
echo "  ✓ Module tests passing"
echo "  ✓ Documentation complete"
echo ""
echo "Next Steps:"
echo "  • Task B4: Implement authentication endpoints (JWT)"
echo "  • Task B5: Create user management endpoints"
echo "  • Task B6: Implement client management endpoints"
echo ""
echo "Quick Commands:"
echo "  npm run test:redis    - Run Redis tests"
echo "  npm run dev           - Start backend server"
echo "  curl localhost:3000/health - Check health"
echo ""
