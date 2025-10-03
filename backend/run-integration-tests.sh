#!/bin/bash

# Set test environment variables
export NODE_ENV=test
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=berthcare_test
export DB_USER=opus
export DB_PASSWORD=
export GOOGLE_MAPS_API_KEY=test-api-key

# Unset DATABASE_URL to force use of individual parameters
unset DATABASE_URL

# Run jest
npx jest tests/integration --runInBand
