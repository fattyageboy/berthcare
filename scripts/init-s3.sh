#!/bin/bash
# BerthCare LocalStack S3 Initialization Script
# Creates S3 buckets for local development
# Philosophy: "The best interface is no interface" - Automatic setup

set -e

echo "Initializing LocalStack S3 buckets..."

# Wait for LocalStack to be ready
sleep 2

# Create main development bucket
awslocal s3 mb s3://berthcare-dev 2>/dev/null || echo "Bucket berthcare-dev already exists"

# Create folder structure
awslocal s3api put-object --bucket berthcare-dev --key photos/ 2>/dev/null || true
awslocal s3api put-object --bucket berthcare-dev --key signatures/ 2>/dev/null || true
awslocal s3api put-object --bucket berthcare-dev --key documents/ 2>/dev/null || true

# Set bucket CORS configuration for local development
awslocal s3api put-bucket-cors --bucket berthcare-dev --cors-configuration '{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}'

# List buckets to confirm
echo "S3 buckets created successfully:"
awslocal s3 ls

echo "LocalStack S3 initialization complete!"
echo "Access S3 at: http://localhost:4566"
echo "Bucket: berthcare-dev"
echo "Folders: photos/, signatures/, documents/"
