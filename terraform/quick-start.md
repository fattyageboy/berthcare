# Terraform Quick Start Guide

Get BerthCare staging infrastructure up and running in 30 minutes.

## Prerequisites

```bash
# Install Terraform
brew install terraform

# Install AWS CLI
brew install awscli

# Configure AWS credentials
aws configure
```

## Deploy in 5 Steps

### 1. Initialize Backend

```bash
cd terraform/scripts
./init-backend.sh
```

### 2. Configure Environment

```bash
cd ../environments/staging
cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars  # Update alarm_email
```

### 3. Uncomment Backend in main.tf

Edit `main.tf` and uncomment the backend configuration block.

### 4. Deploy

```bash
terraform init
terraform plan
terraform apply
```

### 5. Get Credentials

```bash
# Database credentials
aws secretsmanager get-secret-value \
  --secret-id $(terraform output -raw db_credentials_secret_arn) \
  --query SecretString --output text | jq .

# Redis credentials
aws secretsmanager get-secret-value \
  --secret-id $(terraform output -raw redis_credentials_secret_arn) \
  --query SecretString --output text | jq .
```

## What Gets Created

- **VPC** with public/private subnets across 2 AZs
- **RDS PostgreSQL 15** (Multi-AZ, 100 GB, encrypted)
- **ElastiCache Redis 7** (2 nodes, Multi-AZ, encrypted)
- **S3 Buckets** for photos, documents, signatures (encrypted, versioned)
- **CloudFront CDN** for fast asset delivery
- **IAM Roles** with least privilege
- **Security Groups** with restrictive rules
- **CloudWatch** monitoring and alarms
- **Secrets Manager** for credentials

## Cost

Approximately **$245/month** for staging environment.

## Destroy

```bash
cd terraform/environments/staging
terraform destroy
```

## Need Help?

See full documentation: [docs/E5-aws-infrastructure-setup.md](../../docs/E5-aws-infrastructure-setup.md)
