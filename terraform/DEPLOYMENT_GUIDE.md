# BerthCare AWS Infrastructure Deployment Guide

**Task:** E5 - Configure AWS infrastructure (staging)  
**Philosophy:** "Simplicity is the ultimate sophistication"

This guide walks you through deploying the BerthCare staging infrastructure to AWS ca-central-1 region.

## Prerequisites

### 1. Install Required Tools

```bash
# Terraform (version 1.5+)
brew install terraform

# AWS CLI
brew install awscli

# Verify installations
terraform version
aws --version
```

### 2. Configure AWS Credentials

```bash
# Configure AWS CLI with your credentials
aws configure --profile berthcare-staging

# Enter when prompted:
# AWS Access Key ID: [your-access-key]
# AWS Secret Access Key: [your-secret-key]
# Default region name: ca-central-1
# Default output format: json

# Test connection
aws sts get-caller-identity --profile berthcare-staging
```

### 3. Create Terraform State Backend

The Terraform state must be stored in S3 for team collaboration and state locking.

```bash
# Set AWS profile
export AWS_PROFILE=berthcare-staging

# Create S3 bucket for Terraform state
aws s3 mb s3://berthcare-terraform-state-ca-central-1 --region ca-central-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket berthcare-terraform-state-ca-central-1 \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket berthcare-terraform-state-ca-central-1 \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Block public access
aws s3api put-public-access-block \
  --bucket berthcare-terraform-state-ca-central-1 \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name berthcare-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region ca-central-1
```

## Deployment Steps

### Step 1: Navigate to Staging Environment

```bash
cd terraform/environments/staging
```

### Step 2: Configure Variables

```bash
# Copy example variables
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars with your specific values
# Most defaults are production-ready for staging
nano terraform.tfvars
```

### Step 3: Initialize Terraform

```bash
# Initialize Terraform (downloads providers, sets up backend)
terraform init

# Expected output:
# Terraform has been successfully initialized!
```

### Step 4: Plan Infrastructure

```bash
# Generate execution plan
terraform plan -out=tfplan

# Review the plan carefully:
# - Check resource counts
# - Verify configurations
# - Ensure all resources are in ca-central-1
```

Expected resources to be created:
- **Networking:** VPC, 6 subnets, 2 NAT gateways, route tables, security groups
- **Database:** RDS PostgreSQL 15 (Multi-AZ), parameter group, security group
- **Cache:** ElastiCache Redis cluster (2 nodes), parameter group, security group
- **Storage:** 2 S3 buckets (photos, documents) with encryption and lifecycle policies
- **CDN:** CloudFront distribution with OAI
- **IAM:** Service roles and policies for backend and Lambda
- **Monitoring:** CloudWatch alarms for all services
- **Secrets:** Secrets Manager entries for database and Redis passwords

Total: ~60-70 resources

### Step 5: Apply Infrastructure

```bash
# Apply the plan
terraform apply tfplan

# This will take 15-20 minutes due to:
# - RDS Multi-AZ deployment (~10 min)
# - ElastiCache cluster creation (~5 min)
# - CloudFront distribution (~5 min)
# - NAT gateways and other resources (~2 min)
```

### Step 6: Verify Deployment

```bash
# Check outputs
terraform output

# Test database connectivity (from EC2 instance in same VPC)
# Note: RDS is in private subnet, not accessible from internet

# Test S3 buckets
aws s3 ls s3://berthcare-photos-staging-ca-central-1
aws s3 ls s3://berthcare-documents-staging-ca-central-1

# Test CloudFront distribution
aws cloudfront list-distributions --query "DistributionList.Items[?Comment=='staging CDN for photos'].DomainName"
```

### Step 7: Retrieve Secrets

```bash
# Get database password
aws secretsmanager get-secret-value \
  --secret-id staging-db-master-password \
  --query SecretString \
  --output text | jq .

# Get Redis AUTH token
aws secretsmanager get-secret-value \
  --secret-id staging-redis-auth-token \
  --query SecretString \
  --output text | jq .
```

## Post-Deployment Configuration

### 1. Update Backend Environment Variables

Add these to your backend `.env` file:

```bash
# Database
DATABASE_HOST=<terraform output db_instance_address>
DATABASE_PORT=5432
DATABASE_NAME=berthcare_staging
DATABASE_USER=berthcare_admin
DATABASE_PASSWORD=<from secrets manager>

# Redis
REDIS_HOST=<terraform output redis_endpoint>
REDIS_PORT=6379
REDIS_PASSWORD=<from secrets manager>

# S3
AWS_REGION=ca-central-1
S3_PHOTOS_BUCKET=berthcare-photos-staging-ca-central-1
S3_DOCUMENTS_BUCKET=berthcare-documents-staging-ca-central-1

# CloudFront
CLOUDFRONT_DOMAIN=<terraform output cloudfront_domain_name>
```

### 2. Configure Backend IAM Role

If deploying backend to EC2/ECS, attach the IAM role:

```bash
# Get role ARN
terraform output backend_service_role_arn

# Attach to EC2 instance or ECS task definition
```

### 3. Set Up Database Schema

```bash
# Connect to RDS from EC2 instance in same VPC
# Or use bastion host / VPN

# Run migrations
npm run migrate:staging
```

### 4. Configure Monitoring

```bash
# CloudWatch dashboards are automatically created
# Access at: https://console.aws.amazon.com/cloudwatch/

# Set up SNS topic for alerts (optional)
aws sns create-topic --name berthcare-staging-alerts --region ca-central-1

# Subscribe to alerts
aws sns subscribe \
  --topic-arn arn:aws:sns:ca-central-1:ACCOUNT_ID:berthcare-staging-alerts \
  --protocol email \
  --notification-endpoint devops@berthcare.ca
```

## Cost Estimation

### Monthly Costs (Staging)

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| RDS PostgreSQL | db.t4g.medium Multi-AZ | ~$70 |
| ElastiCache Redis | cache.t4g.micro x2 | ~$30 |
| NAT Gateways | 2 gateways | ~$64 |
| S3 Storage | 100 GB | ~$3 |
| CloudFront | 100 GB transfer | ~$10 |
| Data Transfer | Outbound | ~$20 |
| Secrets Manager | 2 secrets | ~$1 |
| CloudWatch | Logs & metrics | ~$10 |
| **Total** | | **~$208/month** |

### Cost Optimization Tips

1. **Stop non-production resources overnight:**
   ```bash
   # Use AWS Instance Scheduler
   # Save ~30% on compute costs
   ```

2. **Use Reserved Instances for production:**
   ```bash
   # 1-year commitment saves 30-40%
   # 3-year commitment saves 50-60%
   ```

3. **Enable S3 Intelligent-Tiering:**
   ```bash
   # Automatically moves data to cheaper storage tiers
   ```

## Troubleshooting

### Issue: Terraform init fails

```bash
# Check AWS credentials
aws sts get-caller-identity --profile berthcare-staging

# Check S3 bucket exists
aws s3 ls s3://berthcare-terraform-state-ca-central-1

# Check DynamoDB table exists
aws dynamodb describe-table --table-name berthcare-terraform-locks
```

### Issue: RDS creation fails

```bash
# Check subnet group
aws rds describe-db-subnet-groups --db-subnet-group-name staging-db-subnet-group

# Check security group
aws ec2 describe-security-groups --filters "Name=group-name,Values=staging-rds-sg"

# Check available AZs
aws ec2 describe-availability-zones --region ca-central-1
```

### Issue: S3 bucket name already taken

```bash
# S3 bucket names are globally unique
# Update bucket names in terraform.tfvars:
photos_bucket_name = "berthcare-photos-staging-ca-central-1-UNIQUE"
documents_bucket_name = "berthcare-documents-staging-ca-central-1-UNIQUE"
```

### Issue: Insufficient permissions

```bash
# Required IAM permissions:
# - VPC: Full access
# - RDS: Full access
# - ElastiCache: Full access
# - S3: Full access
# - CloudFront: Full access
# - IAM: Create roles and policies
# - Secrets Manager: Full access
# - CloudWatch: Full access

# Check current permissions
aws iam get-user --profile berthcare-staging
```

## Updating Infrastructure

### Making Changes

```bash
# Edit Terraform files or variables
nano terraform.tfvars

# Plan changes
terraform plan -out=tfplan

# Review changes carefully
# Apply changes
terraform apply tfplan
```

### Upgrading Terraform Modules

```bash
# Update provider versions
terraform init -upgrade

# Plan and apply
terraform plan -out=tfplan
terraform apply tfplan
```

## Destroying Infrastructure

**WARNING:** This will delete all resources and data!

```bash
# Only for staging environment
cd terraform/environments/staging

# Plan destruction
terraform plan -destroy -out=tfplan-destroy

# Review what will be destroyed
# Destroy infrastructure
terraform apply tfplan-destroy

# Confirm by typing: yes
```

## Security Checklist

- [x] All resources in ca-central-1 (Canadian data residency)
- [x] RDS encryption at rest enabled
- [x] RDS encryption in transit (SSL) enabled
- [x] Redis encryption at rest enabled
- [x] Redis encryption in transit (TLS) enabled
- [x] S3 encryption enabled (AES-256)
- [x] S3 public access blocked
- [x] S3 versioning enabled
- [x] Security groups follow least privilege
- [x] Database in private subnet
- [x] Cache in private subnet
- [x] Secrets stored in Secrets Manager
- [x] IAM roles follow least privilege
- [x] CloudWatch logging enabled
- [x] VPC Flow Logs enabled
- [x] Multi-AZ enabled for high availability

## Compliance (PIPEDA)

- [x] Data residency: All data in Canada (ca-central-1)
- [x] Encryption: At rest and in transit
- [x] Access controls: IAM roles and security groups
- [x] Audit trails: CloudWatch logs and VPC Flow Logs
- [x] Backup & retention: 7-day RDS backups, S3 versioning
- [x] Data lifecycle: S3 lifecycle policies (7-year retention)

## Next Steps

1. **Deploy Backend Application:**
   - Set up ECS/Fargate or EC2 instances
   - Configure application with infrastructure outputs
   - Run database migrations

2. **Set Up CI/CD:**
   - Configure GitHub Actions to deploy to staging
   - Automate database migrations
   - Set up automated testing

3. **Configure Monitoring:**
   - Set up CloudWatch dashboards
   - Configure SNS alerts
   - Integrate with Sentry for error tracking

4. **Production Environment:**
   - Copy staging configuration to production
   - Adjust instance sizes for production load
   - Enable additional security features
   - Set up cross-region backups

## Support

For infrastructure issues:
- Check CloudWatch logs and metrics
- Review Terraform plan output
- Consult AWS documentation
- Contact DevOps team

## References

- [BerthCare Architecture Blueprint](../../project-documentation/architecture-output.md)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [PIPEDA Compliance](https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/)

---

**Status:** Ready for deployment  
**Last Updated:** October 7, 2025  
**Maintained By:** DevOps Team
