#!/bin/bash
# Test script for BerthCare Backend API health endpoint
# Usage: ./test-health.sh

echo "🏥 Testing BerthCare Backend API Health Endpoint"
echo "================================================"
echo ""

# Check if server is running
if ! curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "❌ Server is not running on port 3000"
    echo ""
    echo "To start the server, run:"
    echo "  npm run dev"
    exit 1
fi

# Test health endpoint
echo "Testing GET /health..."
response=$(curl -s -w "\n%{http_code}" http://localhost:3000/health)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo ""
echo "HTTP Status: $http_code"
echo ""
echo "Response Body:"
echo "$body" | jq '.' 2>/dev/null || echo "$body"
echo ""

if [ "$http_code" = "200" ]; then
    echo "✅ Health check passed!"
else
    echo "❌ Health check failed with status $http_code"
    exit 1
fi
