#!/bin/bash

# BerthCare Database Migration Runner
# Philosophy: "If users need a manual, the design has failed"
# This script makes running migrations effortless

set -e

echo "🗄️  BerthCare Database Migration Runner"
echo "========================================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
  echo "⚠️  No .env file found. Copying from .env.example..."
  cp ../../.env.example ../../.env
  echo "✅ Created .env file. Please update DATABASE_URL if needed."
  echo ""
fi

# Load environment variables
if [ -f ../../.env ]; then
  export $(cat ../../.env | grep -v '^#' | xargs)
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL not set in .env file"
  echo "   Please set DATABASE_URL=postgresql://user:password@host:port/database"
  exit 1
fi

echo "📊 Database: $DATABASE_URL"
echo ""

# Check if PostgreSQL is running
echo "🔍 Checking PostgreSQL connection..."
if ! psql "$DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
  echo "❌ Cannot connect to PostgreSQL"
  echo "   Make sure PostgreSQL is running: docker-compose up -d"
  exit 1
fi
echo "✅ PostgreSQL is running"
echo ""

# Run migrations
echo "🚀 Running migrations..."
npm run migrate:up
echo ""

echo "✅ Migrations complete!"
