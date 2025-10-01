#!/bin/bash

# BerthCare Development Environment Setup Script
# This script automates the initial setup of the local development environment

set -e  # Exit on error

# Colors for output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored messages
print_blue() {
    echo -e "${BLUE}$1${NC}"
}

print_green() {
    echo -e "${GREEN}$1${NC}"
}

print_yellow() {
    echo -e "${YELLOW}$1${NC}"
}

print_red() {
    echo -e "${RED}$1${NC}"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Header
echo ""
print_blue "================================================"
print_blue "  BerthCare Development Environment Setup"
print_blue "================================================"
echo ""

# Check prerequisites
print_blue "Checking prerequisites..."

if ! command_exists docker; then
    print_red "Error: Docker is not installed!"
    echo "Please install Docker Desktop: https://www.docker.com/products/docker-desktop"
    exit 1
fi
print_green "✓ Docker is installed"

if ! docker info >/dev/null 2>&1; then
    print_red "Error: Docker is not running!"
    echo "Please start Docker Desktop and try again"
    exit 1
fi
print_green "✓ Docker is running"

if ! command_exists docker-compose; then
    print_red "Error: docker-compose is not installed!"
    echo "Please install docker-compose: https://docs.docker.com/compose/install/"
    exit 1
fi
print_green "✓ docker-compose is installed"

if ! command_exists node; then
    print_yellow "Warning: Node.js is not installed!"
    echo "You'll need Node.js 18+ to run the application"
    echo "Download from: https://nodejs.org/"
fi

echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    print_yellow "Creating .env file from .env.example..."
    cp .env.example .env
    print_green "✓ .env file created"
    print_yellow "  Please update .env with your Auth0 credentials and other settings"
    echo ""
else
    print_green "✓ .env file already exists"
fi

# Create necessary directories
print_blue "Creating necessary directories..."
mkdir -p db/seeds
mkdir -p scripts
print_green "✓ Directories created"
echo ""

# Validate docker-compose configuration
print_blue "Validating docker-compose configuration..."
if docker-compose -f docker-compose.dev.yml config >/dev/null 2>&1; then
    print_green "✓ docker-compose.dev.yml is valid"
else
    print_red "Error: docker-compose.dev.yml is invalid!"
    exit 1
fi
echo ""

# Check if services are already running
if docker-compose -f docker-compose.dev.yml ps | grep -q "Up"; then
    print_yellow "Services are already running. Would you like to restart them? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        print_yellow "Stopping existing services..."
        docker-compose -f docker-compose.dev.yml down
    else
        print_blue "Skipping service restart"
        exit 0
    fi
fi

# Start services
print_blue "Starting BerthCare services..."
echo "This may take a few minutes on first run..."
echo ""

docker-compose -f docker-compose.dev.yml up -d

echo ""
print_blue "Waiting for services to be healthy..."

# Wait for services to be healthy
MAX_WAIT=60
WAIT_TIME=0
while [ $WAIT_TIME -lt $MAX_WAIT ]; do
    if docker-compose -f docker-compose.dev.yml ps | grep -q "unhealthy"; then
        echo -n "."
        sleep 2
        WAIT_TIME=$((WAIT_TIME + 2))
    else
        break
    fi
done

echo ""
echo ""

# Check service status
print_blue "Service Status:"
docker-compose -f docker-compose.dev.yml ps

echo ""

# Test connections
print_blue "Testing service connections..."

# Test PostgreSQL
if docker exec berthcare-postgres pg_isready -U postgres -d berthcare_dev >/dev/null 2>&1; then
    print_green "✓ PostgreSQL is ready"
else
    print_red "✗ PostgreSQL connection failed"
fi

# Test Redis
if docker exec berthcare-redis redis-cli -a dev_redis_password ping >/dev/null 2>&1; then
    print_green "✓ Redis is ready"
else
    print_red "✗ Redis connection failed"
fi

# Test MinIO
if curl -s http://localhost:9000/minio/health/live >/dev/null 2>&1; then
    print_green "✓ MinIO is ready"
else
    print_red "✗ MinIO connection failed"
fi

echo ""

# Display access information
print_green "================================================"
print_green "  Setup Complete!"
print_green "================================================"
echo ""
print_blue "You can now access the following services:"
echo ""
echo "  PostgreSQL Database:"
echo "    Host: localhost:5432"
echo "    Database: berthcare_dev"
echo "    User: postgres"
echo "    Password: dev_password_change_in_production"
echo ""
echo "  Redis Cache:"
echo "    Host: localhost:6379"
echo "    Password: dev_redis_password"
echo ""
echo "  MinIO S3 Storage:"
echo "    API: http://localhost:9000"
echo "    Console: http://localhost:9001"
echo "    Access Key: minioadmin"
echo "    Secret Key: minioadmin123"
echo ""
echo "  Management UIs:"
echo "    Adminer (Database): http://localhost:8080"
echo "    Redis Commander: http://localhost:8081"
echo ""
print_blue "Useful commands:"
echo "  make help      - Show all available commands"
echo "  make status    - Check service status"
echo "  make logs      - View service logs"
echo "  make down      - Stop all services"
echo "  make db-shell  - Access PostgreSQL shell"
echo ""
print_yellow "Next Steps:"
echo "  1. Update .env with your Auth0 credentials"
echo "  2. Install Node.js dependencies: npm install"
echo "  3. Start your application server"
echo ""
print_blue "For detailed documentation, see LOCAL_DEVELOPMENT.md"
echo ""
