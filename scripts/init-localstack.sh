#!/bin/bash
# BerthCare LocalStack Initialization Script
# Creates S3 buckets for local development
# This script runs automatically when LocalStack container is ready

set -e

echo "Initializing LocalStack S3 buckets..."

# Wait for LocalStack to be fully ready
sleep 2

# Create S3 buckets for local development
awslocal s3 mb s3://berthcare-photos-dev || echo "Bucket berthcare-photos-dev already exists"
awslocal s3 mb s3://berthcare-documents-dev || echo "Bucket berthcare-documents-dev already exists"
awslocal s3 mb s3://berthcare-signatures-dev || echo "Bucket berthcare-signatures-dev already exists"

# Enable versioning on buckets (optional, for data safety)
awslocal s3api put-bucket-versioning --bucket berthcare-photos-dev --versioning-configuration Status=Enabled
awslocal s3api put-bucket-versioning --bucket berthcare-documents-dev --versioning-configuration Status=Enabled
awslocal s3api put-bucket-versioning --bucket berthcare-signatures-dev --versioning-configuration Status=Enabled

# Set CORS configuration for local development
awslocal s3api put-bucket-cors --bucket berthcare-photos-dev --cors-configuration '{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}'

awslocal s3api put-bucket-cors --bucket berthcare-documents-dev --cors-configuration '{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}'

awslocal s3api put-bucket-cors --bucket berthcare-signatures-dev --cors-configuration '{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}'

echo "✅ LocalStack S3 buckets created successfully:"
echo "   - berthcare-photos-dev"
echo "   - berthcare-documents-dev"
echo "   - berthcare-signatures-dev"
echo ""
echo "Access S3 at: http://localhost:4566"
