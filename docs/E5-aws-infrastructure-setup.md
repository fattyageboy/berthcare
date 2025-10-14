# E5: AWS Infrastructure Setup (Staging)

**Task ID:** E5  
**Environment:** Staging  
**Region:** ca-central-1 (Canadian data residency - PIPEDA compliant)  
**IaC Tool:** Terraform 1.6+  
**Estimated Time:** 3 days

---

## Overview

This document provides step-by-step instructions for provisioning the complete AWS infrastructure for BerthCare staging environment using Terraform.

## Architecture Components

### Networking

- **VPC:** 10.0.0.0/16 CIDR block
- **Public Subnets:** 2 subnets across 2 AZs (ca-central-1a, ca-central-1b)
- **Private Subnets:** 2 subnets across 2 AZs
- **NAT Gateways:** 2 (one per AZ for high availability)
- **Internet Gateway:** 1
- **VPC Flow Logs:** Enabled for network monitoring

### Database

- **Engine:** PostgreSQL 15.5
- **Instance Class:** db.t4g.medium (ARM-based, cost-effective)
- **Storage:** 100 GB initial, auto-scaling up to 500 GB
- **Multi-AZ:** Enabled for high availability
- **Backup Retention:** 7 days
- **Encryption:** At rest with KMS
- **Performance Insights:** Enabled

### Cache

- **Engine:** Redis 7.1
- **Node Type:** cache.t4g.micro
- **Cluster Size:** 2 nodes
- **Multi-AZ:** Enabled
- **Automatic Failover:** Enabled
- **Encryption:** At rest and in transit
- **Auth Token:** Enabled

### Storage

- **S3 Buckets:**
  - `berthcare-photos-staging` - Visit photos
  - `berthcare-documents-staging` - Care plans and documents
  - `berthcare-signatures-staging` - Client signatures
  - `berthcare-logs-staging` - Access logs
- **Versioning:** Enabled on all buckets
- **Encryption:** AES256 or KMS
- **Lifecycle Policies:** Archive to Glacier after 1 year, Deep Archive after 7 years
- **Public Access:** Blocked

### CDN

- **CloudFront Distribution:** Global edge locations
- **Origins:** S3 buckets (photos, documents, signatures)
- **SSL/TLS:** TLS 1.2+ enforced
- **Geo Restriction:** Canada and US only
- **Caching:** Optimized for static assets
- **Compression:** Enabled

### Security

- **IAM Roles:**
  - ECS Task Execution Role (pull images, write logs)
  - ECS Task Role (application runtime permissions)
- **Security Groups:**
  - ALB Security Group (HTTPS/HTTP ingress)
  - ECS Tasks Security Group (HTTP from ALB)
  - RDS Security Group (PostgreSQL from ECS)
  - Redis Security Group (Redis from ECS)
- **KMS Key:** For encryption at rest
- **Secrets Manager:** Database and Redis credentials

### Monitoring

- **CloudWatch Dashboard:** Pre-configured metrics
- **CloudWatch Alarms:**
  - RDS CPU utilization > 80%
  - RDS freeable memory < 512 MB
  - RDS free storage < 10 GB
  - RDS connections > 80% of max
  - Redis CPU utilization > 75%
  - Redis memory utilization > 80%
  - Redis evictions > 1000
  - CloudFront 5xx error rate > 5%
- **SNS Topic:** Email notifications for alarms

---

## Prerequisites

### 1. Install Required Tools

```bash
# Install Terraform (macOS)
brew tap hashicorp/tap
brew install hashicorp/tap/terraform

# Verify installation
terraform version  # Should be 1.6+

# Install AWS CLI (macOS)
brew install awscli

# Verify installation
aws --version
```

### 2. Configure AWS Credentials

```bash
# Configure AWS CLI with your credentials
aws configure

# Enter your AWS credentials:
# AWS Access Key ID: [your-access-key]
# AWS Secret Access Key: [your-secret-key]
# Default region name: ca-central-1
# Default output format: json

# Verify configuration
aws sts get-caller-identity
```

### 3. Required AWS Permissions

Your AWS user/role needs the following permissions:

- VPC management (create VPC, subnets, route tables, NAT gateways)
- RDS management (create databases, parameter groups, subnet groups)
- ElastiCache management (create Redis clusters)
- S3 management (create buckets, configure policies)
- CloudFront management (create distributions)
- IAM management (create roles, policies)
- KMS management (create keys)
- CloudWatch management (create dashboards, alarms)
- Secrets Manager management (create secrets)
- SNS management (create topics)

---

## Deployment Steps

### Step 1: Initialize Terraform Backend

The Terraform backend stores state files in S3 with DynamoDB for state locking.

```bash
# Run the backend initialization script
cd terraform/scripts
./init-backend.sh
```

This script creates:

- S3 bucket: `berthcare-terraform-state`
- DynamoDB table: `berthcare-terraform-locks`

### Step 2: Configure Staging Environment

```bash
# Navigate to staging environment
cd ../environments/staging

# Copy example configuration
cp terraform.tfvars.example terraform.tfvars

# Edit configuration (use your preferred editor)
nano terraform.tfvars
```

Update the following values in `terraform.tfvars`:

```hcl
# Project Configuration
project_name = "berthcare"
environment  = "staging"
aws_region   = "ca-central-1"

# Monitoring Configuration
alarm_email = "your-email@example.com"  # Update this!

# Other values can remain as defaults for staging
```

### Step 3: Uncomment Backend Configuration

Edit `main.tf` and uncomment the backend configuration:

```hcl
backend "s3" {
  bucket         = "berthcare-terraform-state"
  key            = "staging/terraform.tfstate"
  region         = "ca-central-1"
  encrypt        = true
  dynamodb_table = "berthcare-terraform-locks"
}
```

### Step 4: Initialize Terraform

```bash
# Initialize Terraform with backend
terraform init

# You should see:
# ✅ Terraform has been successfully initialized!
```

### Step 5: Validate Configuration

```bash
# Validate Terraform configuration
terraform validate

# Format Terraform files
terraform fmt -recursive

# You should see:
# ✅ Success! The configuration is valid.
```

### Step 6: Plan Infrastructure

```bash
# Generate execution plan
terraform plan -out=tfplan

# Review the plan carefully
# You should see approximately 50+ resources to be created
```

### Step 7: Apply Infrastructure

```bash
# Apply the plan
terraform apply tfplan

# This will take approximately 15-20 minutes
# Resources are created in the following order:
# 1. VPC and networking (2-3 min)
# 2. Security groups and IAM roles (1 min)
# 3. RDS database (10-12 min) - Multi-AZ takes longer
# 4. ElastiCache Redis (5-7 min)
# 5. S3 buckets (1 min)
# 6. CloudFront distribution (5-10 min)
```

### Step 8: Verify Deployment

```bash
# View all outputs
terraform output

# View specific outputs
terraform output db_endpoint
terraform output redis_endpoint
terraform output cloudfront_domain_name

# Test database connectivity (from within VPC)
# Note: RDS is in private subnet, not accessible from internet
```

---

## Post-Deployment Configuration

### 1. Retrieve Database Credentials

```bash
# Get the Secrets Manager ARN
DB_SECRET_ARN=$(terraform output -raw db_credentials_secret_arn)

# Retrieve credentials
aws secretsmanager get-secret-value \
  --secret-id "$DB_SECRET_ARN" \
  --region ca-central-1 \
  --query SecretString \
  --output text | jq .

# Output:
# {
#   "username": "berthcare_admin",
#   "password": "randomly-generated-password",
#   "engine": "postgres",
#   "host": "berthcare-staging-postgres.xxxxx.ca-central-1.rds.amazonaws.com",
#   "port": 5432,
#   "dbname": "berthcare"
# }
```

### 2. Retrieve Redis Credentials

```bash
# Get the Secrets Manager ARN
REDIS_SECRET_ARN=$(terraform output -raw redis_credentials_secret_arn)

# Retrieve credentials
aws secretsmanager get-secret-value \
  --secret-id "$REDIS_SECRET_ARN" \
  --region ca-central-1 \
  --query SecretString \
  --output text | jq .

# Output:
# {
#   "auth_token": "randomly-generated-token",
#   "host": "berthcare-staging-redis.xxxxx.cache.amazonaws.com",
#   "port": 6379,
#   "engine": "redis"
# }
```

### 3. Update Backend Environment Variables

Update your backend application's `.env` file with the infrastructure outputs:

```bash
# Database Configuration
POSTGRES_HOST=<db_address from terraform output>
POSTGRES_PORT=5432
POSTGRES_DB=berthcare
POSTGRES_USER=berthcare_admin
POSTGRES_PASSWORD=<from Secrets Manager>
DATABASE_URL=postgresql://berthcare_admin:<password>@<host>:5432/berthcare

# Redis Configuration
REDIS_HOST=<redis_endpoint from terraform output>
REDIS_PORT=6379
REDIS_PASSWORD=<from Secrets Manager>
REDIS_URL=redis://:<password>@<host>:6379/0

# AWS Configuration
AWS_REGION=ca-central-1
S3_BUCKET_PHOTOS=berthcare-photos-staging
S3_BUCKET_DOCUMENTS=berthcare-documents-staging
S3_BUCKET_SIGNATURES=berthcare-signatures-staging

# CloudFront Configuration
CLOUDFRONT_DOMAIN=<cloudfront_domain_name from terraform output>
```

### 4. Configure SNS Email Subscription

```bash
# Check your email for SNS subscription confirmation
# Click the confirmation link to start receiving alarm notifications
```

### 5. Access CloudWatch Dashboard

```bash
# Get dashboard URL
echo "https://ca-central-1.console.aws.amazon.com/cloudwatch/home?region=ca-central-1#dashboards:name=$(terraform output -raw cloudwatch_dashboard_name)"

# Open in browser to view metrics
```

---

## Verification Checklist

- [ ] VPC created with 2 public and 2 private subnets
- [ ] NAT Gateways operational in both AZs
- [ ] RDS PostgreSQL instance running (Multi-AZ)
- [ ] ElastiCache Redis cluster running (2 nodes)
- [ ] S3 buckets created with encryption and versioning
- [ ] CloudFront distribution deployed and active
- [ ] IAM roles created with appropriate permissions
- [ ] Security groups configured with least privilege
- [ ] KMS key created for encryption
- [ ] Secrets Manager secrets created for credentials
- [ ] CloudWatch dashboard accessible
- [ ] CloudWatch alarms configured
- [ ] SNS topic created and email subscribed
- [ ] VPC Flow Logs enabled
- [ ] All resources tagged correctly

---

## Cost Estimation (Staging)

### Monthly Costs (Approximate)

| Service           | Configuration                   | Monthly Cost (USD) |
| ----------------- | ------------------------------- | ------------------ |
| RDS PostgreSQL    | db.t4g.medium, Multi-AZ, 100 GB | $120               |
| ElastiCache Redis | cache.t4g.micro x2, Multi-AZ    | $30                |
| NAT Gateways      | 2 NAT Gateways                  | $65                |
| S3 Storage        | 100 GB + requests               | $5                 |
| CloudFront        | 100 GB data transfer            | $10                |
| Data Transfer     | Inter-AZ, outbound              | $10                |
| CloudWatch        | Logs, metrics, alarms           | $5                 |
| **Total**         |                                 | **~$245/month**    |

### Cost Optimization Tips

1. **Stop non-production resources during off-hours:**
   - RDS: Create snapshot, stop instance (saves ~50%)
   - ElastiCache: Cannot be stopped, consider smaller instance

2. **Use Reserved Instances for production:**
   - 1-year reserved: ~30% savings
   - 3-year reserved: ~50% savings

3. **Optimize S3 storage:**
   - Lifecycle policies automatically archive old data
   - Glacier: $0.004/GB vs S3 Standard: $0.023/GB

4. **Monitor and right-size:**
   - Use CloudWatch metrics to identify underutilized resources
   - Adjust instance sizes based on actual usage

---

## Troubleshooting

### Issue: Terraform state lock error

**Symptom:** `Error acquiring the state lock`

**Solution:**

```bash
# Check DynamoDB for stale locks
aws dynamodb scan \
  --table-name berthcare-terraform-locks \
  --region ca-central-1

# If lock is stale (> 15 minutes old), force unlock
terraform force-unlock <LOCK_ID>
```

### Issue: RDS creation timeout

**Symptom:** `Error creating DB Instance: timeout while waiting for state to become 'available'`

**Solution:**

- Multi-AZ RDS takes 10-15 minutes to create
- Check AWS Console for actual status
- If stuck, check VPC subnet configuration

### Issue: S3 bucket already exists

**Symptom:** `Error creating S3 bucket: BucketAlreadyExists`

**Solution:**

```bash
# S3 bucket names are globally unique
# Update bucket names in terraform.tfvars:
# Add a unique suffix like your AWS account ID
```

### Issue: CloudFront distribution not accessible

**Symptom:** `403 Forbidden` when accessing CloudFront URL

**Solution:**

- CloudFront takes 15-20 minutes to fully deploy
- Check Origin Access Control configuration
- Verify S3 bucket policy allows CloudFront access

### Issue: Cannot connect to RDS from local machine

**Symptom:** Connection timeout

**Solution:**

- RDS is in private subnet (by design for security)
- To connect, use one of these methods:
  1. SSH tunnel through bastion host
  2. VPN connection to VPC
  3. AWS Systems Manager Session Manager
  4. Deploy application in same VPC

---

## Maintenance

### Regular Tasks

**Weekly:**

- Review CloudWatch alarms and metrics
- Check RDS and Redis performance
- Monitor S3 storage growth

**Monthly:**

- Review AWS costs and optimize
- Update Terraform modules to latest versions
- Review security group rules

**Quarterly:**

- Review and update IAM policies
- Test disaster recovery procedures
- Update RDS and Redis to latest minor versions

### Backup and Recovery

**RDS Backups:**

- Automated daily backups (7-day retention)
- Manual snapshots before major changes
- Point-in-time recovery available

**Redis Backups:**

- Automated daily snapshots (5-day retention)
- Manual snapshots before major changes

**S3 Versioning:**

- Enabled on all buckets
- Recover deleted objects within 90 days

**Terraform State:**

- Stored in S3 with versioning
- DynamoDB state locking prevents corruption

---

## Disaster Recovery

### RDS Failover

Multi-AZ RDS automatically fails over to standby in case of:

- Primary AZ failure
- Primary instance failure
- Maintenance operations

**RTO (Recovery Time Objective):** 1-2 minutes  
**RPO (Recovery Point Objective):** 0 (synchronous replication)

### Redis Failover

Multi-AZ Redis automatically fails over to replica in case of:

- Primary node failure
- Primary AZ failure

**RTO:** 1-2 minutes  
**RPO:** < 1 minute (asynchronous replication)

### Complete Region Failure

In case of complete ca-central-1 region failure, the Terraform state backend (S3 bucket and DynamoDB lock table) will also be unavailable. You **must** have a cross-region state replication strategy in place before attempting failover.

#### Prerequisites: Cross-Region Terraform State Strategy

**CRITICAL:** The following setup must be completed **before** a regional outage occurs. Without this, you cannot manage infrastructure in a secondary region.

##### Option 1: S3 Cross-Region Replication + Secondary DynamoDB Table (Recommended)

**Step 1: Enable S3 Bucket Versioning and Cross-Region Replication**

```bash
# 1. Enable versioning on primary state bucket (if not already enabled)
aws s3api put-bucket-versioning \
  --bucket berthcare-terraform-state \
  --versioning-configuration Status=Enabled \
  --region ca-central-1

# 2. Create secondary state bucket in us-east-1
aws s3api create-bucket \
  --bucket berthcare-terraform-state-dr \
  --region us-east-1

aws s3api put-bucket-versioning \
  --bucket berthcare-terraform-state-dr \
  --versioning-configuration Status=Enabled \
  --region us-east-1

# 3. Enable encryption on secondary bucket
aws s3api put-bucket-encryption \
  --bucket berthcare-terraform-state-dr \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }' \
  --region us-east-1

# 4. Create IAM role for replication
cat > replication-role-trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "s3.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}
EOF

aws iam create-role \
  --role-name S3TerraformStateReplicationRole \
  --assume-role-policy-document file://replication-role-trust-policy.json

# 5. Attach replication permissions
cat > replication-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetReplicationConfiguration",
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::berthcare-terraform-state"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObjectVersionForReplication",
        "s3:GetObjectVersionAcl"
      ],
      "Resource": "arn:aws:s3:::berthcare-terraform-state/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ReplicateObject",
        "s3:ReplicateDelete"
      ],
      "Resource": "arn:aws:s3:::berthcare-terraform-state-dr/*"
    }
  ]
}
EOF

aws iam put-role-policy \
  --role-name S3TerraformStateReplicationRole \
  --policy-name ReplicationPolicy \
  --policy-document file://replication-policy.json

# 6. Configure replication on primary bucket
REPLICATION_ROLE_ARN=$(aws iam get-role --role-name S3TerraformStateReplicationRole --query 'Role.Arn' --output text)

cat > replication-config.json <<EOF
{
  "Role": "$REPLICATION_ROLE_ARN",
  "Rules": [{
    "Status": "Enabled",
    "Priority": 1,
    "DeleteMarkerReplication": {"Status": "Enabled"},
    "Filter": {},
    "Destination": {
      "Bucket": "arn:aws:s3:::berthcare-terraform-state-dr",
      "ReplicationTime": {
        "Status": "Enabled",
        "Time": {"Minutes": 15}
      },
      "Metrics": {
        "Status": "Enabled",
        "EventThreshold": {"Minutes": 15}
      }
    }
  }]
}
EOF

aws s3api put-bucket-replication \
  --bucket berthcare-terraform-state \
  --replication-configuration file://replication-config.json \
  --region ca-central-1

# 7. Verify replication is working
aws s3api get-bucket-replication \
  --bucket berthcare-terraform-state \
  --region ca-central-1

# 8. Test replication by uploading a test file
echo "test" > test-replication.txt
aws s3 cp test-replication.txt s3://berthcare-terraform-state/test-replication.txt --region ca-central-1

# Wait 2-3 minutes, then verify in secondary bucket
aws s3 ls s3://berthcare-terraform-state-dr/ --region us-east-1
```

**Step 2: Provision Secondary DynamoDB Lock Table**

```bash
# Create DynamoDB table in us-east-1 for state locking
aws dynamodb create-table \
  --table-name berthcare-terraform-locks-dr \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1

# Verify table is active
aws dynamodb describe-table \
  --table-name berthcare-terraform-locks-dr \
  --region us-east-1 \
  --query 'Table.TableStatus'
```

**Step 3: Verify Replication Status**

```bash
# Check replication metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/S3 \
  --metric-name ReplicationLatency \
  --dimensions Name=SourceBucket,Value=berthcare-terraform-state Name=DestinationBucket,Value=berthcare-terraform-state-dr Name=RuleId,Value=Rule-1 \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Average \
  --region ca-central-1

# Verify state file exists in both buckets
aws s3 ls s3://berthcare-terraform-state/staging/ --region ca-central-1
aws s3 ls s3://berthcare-terraform-state-dr/staging/ --region us-east-1
```

##### Initial Data Migration to DR Region

1. **Wait for replication to stabilize.** Confirm that initial cross-region syncs have finished before scheduling failover exercises:

   ```bash
   aws s3 ls s3://berthcare-terraform-state/staging/ --region ca-central-1
   aws s3 ls s3://berthcare-terraform-state-dr/staging/ --region us-east-1
   ```

2. **Validate Terraform state integrity.** Inspect both state objects, compare `ETag` values (or object checksums), and ensure the DR copy matches the primary:

   ```bash
   PRIMARY_STATE_KEY=staging/default.tfstate

   aws s3api head-object \
     --bucket berthcare-terraform-state \
     --key "${PRIMARY_STATE_KEY}" \
     --region ca-central-1

   aws s3api head-object \
     --bucket berthcare-terraform-state-dr \
     --key "${PRIMARY_STATE_KEY}" \
     --region us-east-1
   ```

3. **Replicate critical databases.** Identify the latest automated snapshot, create a cross-region copy, and use it to seed the DR account. Automate this path with a scheduled Lambda (triggered via EventBridge) that keeps the most recent copies in sync.

   ```bash
   LATEST_SNAPSHOT=$(aws rds describe-db-snapshots \
     --db-instance-identifier berthcare-prod-db \
     --snapshot-type automated \
     --query 'DBSnapshots | sort_by(@, &SnapshotCreateTime)[-1].DBSnapshotIdentifier' \
     --output text \
     --region ca-central-1)

   aws rds copy-db-snapshot \
     --source-db-snapshot-identifier "${LATEST_SNAPSHOT}" \
     --target-db-snapshot-identifier "${LATEST_SNAPSHOT}-dr" \
     --source-region ca-central-1 \
     --region us-east-1
  ```

   Where the engine supports automatic backup replication, configure it with `aws rds modify-db-instance` (for example, specify `--enable-automatic-backup-replication` and `--automatic-backup-replication-region us-east-1`) so snapshots flow to the DR region without operator intervention. Otherwise, schedule an EventBridge rule that invokes a Lambda function to call `aws rds copy-db-snapshot` and prune older DR snapshots.

4. **Verify S3 object parity.** Ensure application data buckets mirror the expected contents before declaring the DR region ready:

   ```bash
   aws s3 ls s3://berthcare-photos-prod --recursive --summarize --region ca-central-1
   aws s3 ls s3://berthcare-photos-prod-dr --recursive --summarize --region us-east-1
   ```

   Investigate mismatched counts or sizes before approving DR readiness, and optionally spot-check object hashes (`aws s3api head-object`) for critical files.

##### Option 2: DynamoDB Global Tables (Alternative)

```bash
# Convert existing DynamoDB table to global table
aws dynamodb update-table \
  --table-name berthcare-terraform-locks \
  --stream-specification StreamEnabled=true,StreamViewType=NEW_AND_OLD_IMAGES \
  --region ca-central-1

# Create replica in us-east-1
aws dynamodb create-global-table \
  --global-table-name berthcare-terraform-locks \
  --replication-group RegionName=ca-central-1 RegionName=us-east-1 \
  --region ca-central-1

# Note: Global Tables require the table to be empty or use DynamoDB Streams
# For existing tables with data, Option 1 (separate table) is simpler
```

#### Failover Procedure

**Pre-Checks (Run these first):**

```bash
# 1. Verify ca-central-1 is truly unavailable
aws ec2 describe-availability-zones --region ca-central-1 2>&1 | grep -q "error" && echo "Region unavailable" || echo "Region still accessible"

# 2. Verify secondary state bucket has latest state
aws s3api head-object \
  --bucket berthcare-terraform-state-dr \
  --key staging/terraform.tfstate \
  --region us-east-1 \
  --query 'LastModified'

# 3. Verify secondary DynamoDB table is accessible
aws dynamodb describe-table \
  --table-name berthcare-terraform-locks-dr \
  --region us-east-1 \
  --query 'Table.TableStatus'

# 4. Check for any active locks (should be none if primary region is down)
aws dynamodb scan \
  --table-name berthcare-terraform-locks-dr \
  --region us-east-1
```

**Step 1: Migrate Terraform State to Secondary Backend**

```bash
# Navigate to staging environment
cd terraform/environments/staging

# Backup current backend configuration
cp main.tf main.tf.backup

# Update backend configuration in main.tf to point to secondary region
# Edit the backend block:
```

```hcl
backend "s3" {
  bucket         = "berthcare-terraform-state-dr"
  key            = "staging/terraform.tfstate"
  region         = "us-east-1"
  encrypt        = true
  dynamodb_table = "berthcare-terraform-locks-dr"
}
```

```bash
# Initialize Terraform with new backend and migrate state
terraform init -migrate-state

# Terraform will prompt: "Do you want to copy existing state to the new backend?"
# Type: yes

# Verify state migration
terraform state list
```

**Step 2: Verify State Read/Write and Locking**

```bash
# Test state locking in new region
terraform plan

# Verify lock was created and released in DynamoDB
aws dynamodb scan \
  --table-name berthcare-terraform-locks-dr \
  --region us-east-1

# Verify state file is readable
terraform show

# Test state write operation (safe, no changes)
terraform refresh
```

**Step 3: Update Region and Redeploy Infrastructure**

```bash
# Update terraform.tfvars with new region
sed -i.bak 's/aws_region = "ca-central-1"/aws_region = "us-east-1"/' terraform.tfvars

# Review changes
terraform plan

# Expected changes:
# - All resources will be recreated in us-east-1
# - Data will need to be restored from backups

# Apply infrastructure in new region
terraform apply

# This will take 15-20 minutes
```

**Step 4: Restore Persistent Data**

1. **Database:** Locate the newest RDS snapshot from the primary region (or backup account), copy it if necessary, and restore the instance in DR. Use placeholders for automation and double-check identifiers before applying:

   ```bash
   # Discover latest snapshot in primary region
   aws rds describe-db-snapshots \
     --db-instance-identifier berthcare-prod-db \
     --region ca-central-1 \
     --query 'DBSnapshots | sort_by(@, &SnapshotCreateTime)[-1].DBSnapshotArn' \
     --output text

   # (Optional) copy to DR if the snapshot is not yet replicated
   aws rds copy-db-snapshot \
     --source-db-snapshot-identifier arn:aws:rds:ca-central-1:123456789012:snapshot:rds:berthcare-prod-db-2025-10-10-05-30 \
     --target-db-snapshot-identifier berthcare-prod-db-restore-seed \
     --source-region ca-central-1 \
     --region us-east-1

   # Restore the DR instance from the copied snapshot
   aws rds restore-db-instance-from-db-snapshot \
     --db-instance-identifier berthcare-prod-db-dr \
     --db-snapshot-identifier berthcare-prod-db-restore-seed \
     --region us-east-1

   # Apply production parameter group and networking once instance is available
   aws rds modify-db-instance \
     --db-instance-identifier berthcare-prod-db-dr \
     --db-parameter-group-name berthcare-prod-pg \
     --vpc-security-group-ids sg-xxxxxxxx \
     --apply-immediately \
     --region us-east-1
   ```

2. **Object storage:** If cross-region replication is configured, confirm the latest objects are present. Otherwise sync from the primary bucket before promoting DR:

   ```bash
   aws s3 sync s3://berthcare-photos-prod s3://berthcare-photos-prod-dr --source-region ca-central-1 --region us-east-1
   ```

   For large backfills, consider S3 Batch Operations or AWS DataSync and verify parity:

   ```bash
   aws s3 ls s3://berthcare-photos-prod --recursive --summarize --region ca-central-1
   aws s3 ls s3://berthcare-photos-prod-dr --recursive --summarize --region us-east-1
   ```

3. **Caches:** Redis/ElastiCache data is treated as ephemeral. Warm it via normal application flows after the DR stack is online; do **not** attempt to replicate cache snapshots unless a business requirement demands it.



**Step 5: Update Application Configuration**

```bash
# Update backend application environment variables with new endpoints
# Get new infrastructure outputs
terraform output

# Update .env or ECS task definition with:
# - New RDS endpoint (us-east-1)
# - New Redis endpoint (us-east-1)
# - New S3 bucket names (us-east-1)
# - New CloudFront distribution (if recreated)
```

**Step 6: Verify Application Functionality**

```bash
# Test database connectivity
psql -h $(terraform output -raw db_endpoint) -U berthcare_admin -d berthcare

# Test Redis connectivity
redis-cli -h $(terraform output -raw redis_endpoint) -a $(aws secretsmanager get-secret-value --secret-id $(terraform output -raw redis_credentials_secret_arn) --region us-east-1 --query SecretString --output text | jq -r .auth_token) PING

# Test S3 access
aws s3 ls s3://berthcare-photos-staging --region us-east-1

# Test application endpoints
curl https://$(terraform output -raw cloudfront_domain_name)/health
```

#### Rollback Procedure

If ca-central-1 becomes available again and you need to fail back:

```bash
# 1. Ensure all data is synchronized
# 2. Update backend configuration back to ca-central-1
# 3. Run terraform init -migrate-state
# 4. Update aws_region in terraform.tfvars
# 5. Run terraform apply to recreate resources in ca-central-1
# 6. Restore data from us-east-1 backups
# 7. Update application configuration
# 8. Verify functionality
# 9. Destroy us-east-1 resources to avoid duplicate costs
```

#### Important Notes

- **RTO (Recovery Time Objective):** 30-45 minutes (assuming pre-configured secondary backend)
- **RPO (Recovery Point Objective):**
  - RDS: Last automated backup (up to 24 hours)
  - S3: Near real-time (if CRR enabled, < 15 minutes)
  - Redis: Full data loss (cache only)
- **Cost Impact:** Running duplicate infrastructure in two regions doubles costs
- **Testing:** Perform disaster recovery drills quarterly to validate procedures
- **Automation:** Consider creating scripts to automate failover steps
- **Monitoring:** Set up CloudWatch alarms for replication lag and failures

---

## Security Best Practices

### Network Security

- ✅ RDS and Redis in private subnets (no internet access)
- ✅ Security groups with least privilege
- ✅ VPC Flow Logs enabled for monitoring
- ✅ NAT Gateways for outbound traffic only

### Data Security

- ✅ Encryption at rest (RDS, Redis, S3) with KMS
- ✅ Encryption in transit (TLS 1.2+)
- ✅ S3 bucket public access blocked
- ✅ Versioning enabled for data recovery

### Access Security

- ✅ IAM roles with least privilege
- ✅ Credentials stored in Secrets Manager
- ✅ No hardcoded credentials in code
- ✅ MFA required for AWS Console access (recommended)

### Monitoring Security

- ✅ CloudWatch alarms for anomalies
- ✅ VPC Flow Logs for network analysis
- ✅ S3 access logging enabled
- ✅ CloudTrail for API audit logs (recommended)

---

## Next Steps

After infrastructure is deployed:

1. **Deploy Backend Application:**
   - Build Docker image
   - Push to ECR
   - Deploy to ECS Fargate
   - Configure Application Load Balancer

2. **Configure DNS:**
   - Point custom domain to CloudFront
   - Configure SSL/TLS certificate in ACM
   - Update CloudFront distribution with custom domain

3. **Run Database Migrations:**
   - Connect to RDS from ECS task
   - Run migration scripts
   - Seed initial data

4. **Configure Monitoring:**
   - Set up Sentry for error tracking
   - Configure custom CloudWatch metrics
   - Set up log aggregation

5. **Security Hardening:**
   - Enable AWS GuardDuty
   - Configure AWS WAF for CloudFront
   - Set up AWS Config for compliance

---

## Support

For issues or questions:

- Check troubleshooting section above
- Review Terraform documentation: https://www.terraform.io/docs
- Review AWS documentation: https://docs.aws.amazon.com
- Contact DevOps team

---

## Acceptance Criteria

- [x] All resources created in ca-central-1 region
- [x] VPC with public/private subnets across 2 AZs
- [x] RDS PostgreSQL 15 Multi-AZ operational
- [x] ElastiCache Redis cluster operational
- [x] S3 buckets created with encryption and lifecycle policies
- [x] CloudFront distribution deployed
- [x] IAM roles with least privilege
- [x] Security groups configured
- [x] KMS encryption enabled
- [x] Secrets Manager storing credentials
- [x] CloudWatch monitoring configured
- [x] SNS alarms configured
- [x] Connectivity verified between components
- [x] Documentation complete
- [x] Terraform state stored in S3 with locking

**Status:** ✅ Complete
