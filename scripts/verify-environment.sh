#!/bin/bash

# BerthCare Development Environment Verification Script
# This script verifies that all services are running correctly

set -e

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_header() {
    echo ""
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo ""
}

print_test() {
    echo -e "${BLUE}Testing:${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Track test results
TESTS_PASSED=0
TESTS_FAILED=0

run_test() {
    local test_name="$1"
    local test_command="$2"

    print_test "$test_name"

    if eval "$test_command" >/dev/null 2>&1; then
        print_success "$test_name passed"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        print_error "$test_name failed"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

print_header "BerthCare Environment Verification"

# Check if Docker is running
print_test "Docker daemon"
if ! docker info >/dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker Desktop."
    exit 1
fi
print_success "Docker is running"
TESTS_PASSED=$((TESTS_PASSED + 1))
echo ""

# Check if services are running
print_header "Service Status Check"

echo "Checking running containers..."
docker-compose -f docker-compose.dev.yml ps
echo ""

# PostgreSQL Tests
print_header "PostgreSQL Database Tests"

run_test "PostgreSQL container is running" \
    "docker ps | grep berthcare-postgres | grep -q Up"

run_test "PostgreSQL is accepting connections" \
    "docker exec berthcare-postgres pg_isready -U postgres -d berthcare_dev"

run_test "Database 'berthcare_dev' exists" \
    "docker exec berthcare-postgres psql -U postgres -lqt | cut -d \| -f 1 | grep -qw berthcare_dev"

run_test "Organizations table exists" \
    "docker exec berthcare-postgres psql -U postgres -d berthcare_dev -c '\dt organizations' | grep -q organizations"

run_test "Users table exists" \
    "docker exec berthcare-postgres psql -U postgres -d berthcare_dev -c '\dt users' | grep -q users"

run_test "Clients table exists" \
    "docker exec berthcare-postgres psql -U postgres -d berthcare_dev -c '\dt clients' | grep -q clients"

run_test "Visits table exists" \
    "docker exec berthcare-postgres psql -U postgres -d berthcare_dev -c '\dt visits' | grep -q visits"

run_test "Seed data loaded (organizations)" \
    "docker exec berthcare-postgres psql -U postgres -d berthcare_dev -c 'SELECT COUNT(*) FROM organizations' -t | grep -q '[1-9]'"

run_test "Seed data loaded (users)" \
    "docker exec berthcare-postgres psql -U postgres -d berthcare_dev -c 'SELECT COUNT(*) FROM users' -t | grep -q '[1-9]'"

run_test "Seed data loaded (clients)" \
    "docker exec berthcare-postgres psql -U postgres -d berthcare_dev -c 'SELECT COUNT(*) FROM clients' -t | grep -q '[1-9]'"

echo ""

# Redis Tests
print_header "Redis Cache Tests"

run_test "Redis container is running" \
    "docker ps | grep berthcare-redis | grep -q Up"

run_test "Redis is accepting connections" \
    "docker exec berthcare-redis redis-cli -a dev_redis_password ping"

run_test "Redis can set and get values" \
    "docker exec berthcare-redis redis-cli -a dev_redis_password SET test_key test_value && docker exec berthcare-redis redis-cli -a dev_redis_password GET test_key | grep -q test_value"

# Clean up test key
docker exec berthcare-redis redis-cli -a dev_redis_password DEL test_key >/dev/null 2>&1

echo ""

# MinIO Tests
print_header "MinIO S3 Storage Tests"

run_test "MinIO container is running" \
    "docker ps | grep berthcare-minio | grep -q Up"

run_test "MinIO API is accessible" \
    "curl -sf http://localhost:9000/minio/health/live"

run_test "MinIO Console is accessible" \
    "curl -sf http://localhost:9001/minio/health/live"

run_test "MinIO photos bucket exists" \
    "docker exec berthcare-minio ls /data/berthcare-dev-photos"

run_test "MinIO documents bucket exists" \
    "docker exec berthcare-minio ls /data/berthcare-dev-documents"

run_test "MinIO signatures bucket exists" \
    "docker exec berthcare-minio ls /data/berthcare-dev-signatures"

echo ""

# Web UI Tests
print_header "Management UI Tests"

run_test "Adminer (Database UI) is accessible" \
    "curl -sf http://localhost:8080"

run_test "Redis Commander is accessible" \
    "curl -sf http://localhost:8081"

echo ""

# Port Availability Tests
print_header "Port Availability Check"

run_test "Port 5432 (PostgreSQL) is listening" \
    "nc -z localhost 5432"

run_test "Port 6379 (Redis) is listening" \
    "nc -z localhost 6379"

run_test "Port 9000 (MinIO API) is listening" \
    "nc -z localhost 9000"

run_test "Port 9001 (MinIO Console) is listening" \
    "nc -z localhost 9001"

run_test "Port 8080 (Adminer) is listening" \
    "nc -z localhost 8080"

run_test "Port 8081 (Redis Commander) is listening" \
    "nc -z localhost 8081"

echo ""

# Database Schema Verification
print_header "Database Schema Verification"

echo "Counting tables..."
TABLE_COUNT=$(docker exec berthcare-postgres psql -U postgres -d berthcare_dev -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" -t | xargs)
echo "Total tables: $TABLE_COUNT"

if [ "$TABLE_COUNT" -ge 8 ]; then
    print_success "Schema has expected number of tables"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    print_error "Schema does not have expected number of tables"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

echo ""
echo "Database record counts:"
docker exec berthcare-postgres psql -U postgres -d berthcare_dev -c "
SELECT
    'organizations' AS table_name, COUNT(*) AS count FROM organizations
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'clients', COUNT(*) FROM clients
UNION ALL
SELECT 'care_plans', COUNT(*) FROM care_plans
UNION ALL
SELECT 'visits', COUNT(*) FROM visits
UNION ALL
SELECT 'family_members', COUNT(*) FROM family_members;
"

echo ""

# Summary
print_header "Test Summary"

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
echo "Total tests run: $TOTAL_TESTS"
echo -e "${GREEN}Tests passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    print_success "All tests passed! Environment is ready for development."
    echo ""
    echo "You can now:"
    echo "  - Access Adminer: http://localhost:8080"
    echo "  - Access Redis Commander: http://localhost:8081"
    echo "  - Access MinIO Console: http://localhost:9001"
    echo "  - Start developing your application!"
    echo ""
    exit 0
else
    print_error "Some tests failed. Please check the output above and fix any issues."
    echo ""
    echo "Common fixes:"
    echo "  - Restart services: make restart"
    echo "  - Check logs: make logs"
    echo "  - Reset environment: make reset (WARNING: deletes all data)"
    echo ""
    exit 1
fi
