#!/bin/bash

##
# S3 Lifecycle Policy Setup Script
# 
# Configures lifecycle policies for BerthCare S3 bucket:
# - Archive photos to Glacier after 7 years (2555 days)
# - Delete temporary files after 7 days
# 
# Philosophy: "Obsess over details" - Automate compliance and cost optimization
##

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f "../../.env" ]; then
    source ../../.env
else
    echo -e "${RED}Error: .env file not found${NC}"
    exit 1
fi

# Configuration
BUCKET_NAME="${AWS_S3_BUCKET:-berthcare-production}"
REGION="${AWS_REGION:-ca-central-1}"
ENDPOINT="${AWS_S3_ENDPOINT}"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       BerthCare S3 Lifecycle Policy Setup             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    echo "Install it from: https://aws.amazon.com/cli/"
    exit 1
fi

echo -e "${GREEN}✓ AWS CLI found${NC}"
echo ""

# Prepare AWS CLI command with optional endpoint
AWS_CMD="aws s3api"
if [ -n "$ENDPOINT" ]; then
    AWS_CMD="$AWS_CMD --endpoint-url $ENDPOINT"
fi

# Create lifecycle policy JSON
LIFECYCLE_POLICY=$(cat <<EOF
{
  "Rules": [
    {
      "Id": "ArchiveOldPhotos",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "photos/"
      },
      "Transitions": [
        {
          "Days": 2555,
          "StorageClass": "GLACIER"
        }
      ]
    },
    {
      "Id": "DeleteTempFiles",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "temp/"
      },
      "Expiration": {
        "Days": 7
      }
    },
    {
      "Id": "ArchiveOldSignatures",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "signatures/"
      },
      "Transitions": [
        {
          "Days": 2555,
          "StorageClass": "GLACIER"
        }
      ]
    },
    {
      "Id": "ArchiveOldDocuments",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "documents/"
      },
      "Transitions": [
        {
          "Days": 2555,
          "StorageClass": "GLACIER"
        }
      ]
    }
  ]
}
EOF
)

echo -e "${YELLOW}Lifecycle Policy Configuration:${NC}"
echo "$LIFECYCLE_POLICY" | jq '.'
echo ""

# Confirm before applying
read -p "Apply this lifecycle policy to bucket '$BUCKET_NAME'? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Aborted by user${NC}"
    exit 0
fi

# Apply lifecycle policy
echo -e "${BLUE}Applying lifecycle policy...${NC}"

# Save policy to temporary file
TEMP_POLICY_FILE=$(mktemp)
echo "$LIFECYCLE_POLICY" > "$TEMP_POLICY_FILE"

# Apply policy
if $AWS_CMD put-bucket-lifecycle-configuration \
    --bucket "$BUCKET_NAME" \
    --lifecycle-configuration file://"$TEMP_POLICY_FILE" \
    --region "$REGION"; then
    
    echo -e "${GREEN}✓ Lifecycle policy applied successfully${NC}"
    
    # Verify policy
    echo ""
    echo -e "${BLUE}Verifying policy...${NC}"
    
    if $AWS_CMD get-bucket-lifecycle-configuration \
        --bucket "$BUCKET_NAME" \
        --region "$REGION" > /dev/null 2>&1; then
        
        echo -e "${GREEN}✓ Policy verified${NC}"
        
        # Display policy details
        echo ""
        echo -e "${YELLOW}Active Lifecycle Rules:${NC}"
        echo "1. Archive photos to Glacier after 7 years (2555 days)"
        echo "2. Delete temporary files after 7 days"
        echo "3. Archive signatures to Glacier after 7 years"
        echo "4. Archive documents to Glacier after 7 years"
        echo ""
        echo -e "${GREEN}Cost Savings:${NC}"
        echo "- Glacier storage: ~90% cheaper than S3 Standard"
        echo "- Estimated savings: $500-1000/month after 7 years"
        echo ""
        echo -e "${BLUE}Compliance:${NC}"
        echo "- Meets 7-year data retention requirements"
        echo "- Automatic archival (no manual intervention)"
        echo "- Files remain accessible (3-5 hour retrieval time)"
    else
        echo -e "${YELLOW}Warning: Could not verify policy${NC}"
    fi
else
    echo -e "${RED}Error: Failed to apply lifecycle policy${NC}"
    rm -f "$TEMP_POLICY_FILE"
    exit 1
fi

# Cleanup
rm -f "$TEMP_POLICY_FILE"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              Setup Complete!                           ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Monitor lifecycle transitions in AWS Console"
echo "2. Set up CloudWatch alarms for storage costs"
echo "3. Document retrieval process for archived files"
echo ""
