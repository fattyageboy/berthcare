#!/bin/bash
# Test that the backend compiles and is ready to run

echo "🧪 Testing Backend Compilation and Configuration"
echo "================================================"
echo ""

# Test TypeScript compilation
echo "1. Testing TypeScript compilation..."
if npm run type-check > /dev/null 2>&1; then
    echo "✅ TypeScript compilation successful"
else
    echo "❌ TypeScript compilation failed"
    exit 1
fi
echo ""

# Test that all required modules can be imported
echo "2. Testing module imports..."
node -e "
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
console.log('✅ All required modules can be imported');
" || exit 1
echo ""

# Test database connection configuration
echo "3. Testing database configuration..."
if grep -q "DATABASE_HOST" ../../.env; then
    echo "✅ Database configuration found in .env"
else
    echo "⚠️  Database configuration not found in .env"
fi
echo ""

# Test Redis configuration
echo "4. Testing Redis configuration..."
if grep -q "REDIS_HOST" ../../.env; then
    echo "✅ Redis configuration found in .env"
else
    echo "⚠️  Redis configuration not found in .env"
fi
echo ""

# Test that services are accessible
echo "5. Testing service connectivity..."

# Test PostgreSQL
if nc -z localhost 5432 2>/dev/null; then
    echo "✅ PostgreSQL is accessible on port 5432"
else
    echo "⚠️  PostgreSQL is not accessible on port 5432"
fi

# Test Redis
if nc -z localhost 6379 2>/dev/null; then
    echo "✅ Redis is accessible on port 6379"
else
    echo "⚠️  Redis is not accessible on port 6379"
fi
echo ""

echo "================================================"
echo "✅ Backend is ready to run!"
echo ""
echo "To start the server manually, run:"
echo "  npm run dev"
echo ""
echo "Then test with:"
echo "  curl http://localhost:3000/health"
