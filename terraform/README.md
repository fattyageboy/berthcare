# BerthCare AWS Infrastructure

**Philosophy:** "Simplicity is the ultimate sophistication"

This directory contains Terraform configurations for BerthCare's AWS infrastructure in the ca-central-1 (Canada Central) region, ensuring Canadian data residency and PIPEDA compliance.

## Directory Structure

```
terraform/
├── environments/
│   ├── staging/          # Staging environment configuration
│   └── production/       # Production environment (future)
├── modules/
│   ├── networking/       # VPC, subnets, security groups
│   ├── database/         # RDS PostgreSQL
│   ├── cache/            # ElastiCache Redis
│   ├── storage/          # S3 buckets
│   ├── cdn/              # CloudFront distribution
│   └── iam/              # IAM roles and policies
└── README.md             # This file
```

## Prerequisites

1. **AWS Account:** Access to AWS account with appropriate permissions
2. **Terraform:** Version 1.5+ installed
3. **AWS CLI:** Configured with credentials
4. **S3 Backend:** S3 bucket for Terraform state (created manually)

## Quick Start

### 1. Configure AWS Credentials

```bash
# Set AWS credentials
export AWS_PROFILE=berthcare-staging
# OR
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_DEFAULT_REGION=ca-central-1
```

### 2. Initialize Terraform Backend

```bash
# Create S3 bucket for Terraform state (one-time setup)
aws s3 mb s3://berthcare-terraform-state-ca-central-1 --region ca-central-1
aws s3api put-bucket-versioning \
  --bucket berthcare-terraform-state-ca-central-1 \
  --versioning-configuration Status=Enabled
```

### 3. Deploy Staging Environment

```bash
cd terraform/environments/staging
terraform init
terraform plan
terraform apply
```

## Architecture Overview

### Networking (VPC)
- **VPC CIDR:** 10.0.0.0/16
- **Public Subnets:** 2 AZs (10.0.1.0/24, 10.0.2.0/24)
- **Private Subnets:** 2 AZs (10.0.11.0/24, 10.0.12.0/24)
- **Database Subnets:** 2 AZs (10.0.21.0/24, 10.0.22.0/24)
- **NAT Gateways:** 2 (one per AZ for high availability)
- **Internet Gateway:** 1

### Database (RDS PostgreSQL)
- **Engine:** PostgreSQL 15.x
- **Instance Class:** db.t4g.medium (staging)
- **Multi-AZ:** Yes (high availability)
- **Storage:** 100 GB gp3 (auto-scaling enabled)
- **Backup:** 7-day retention
- **Encryption:** At rest and in transit

### Cache (ElastiCache Redis)
- **Engine:** Redis 7.x
- **Node Type:** cache.t4g.micro (staging)
- **Cluster Mode:** Disabled (simple setup)
- **Nodes:** 2 (primary + replica)
- **Encryption:** At rest and in transit
- **Automatic Failover:** Enabled

### Storage (S3)
- **Photos Bucket:** berthcare-photos-staging-ca-central-1
- **Documents Bucket:** berthcare-documents-staging-ca-central-1
- **Lifecycle Policies:** Archive to Glacier after 1 year
- **Versioning:** Enabled
- **Encryption:** AES-256 (SSE-S3)
- **Public Access:** Blocked

### CDN (CloudFront)
- **Origin:** S3 photos bucket
- **Price Class:** PriceClass_100 (North America + Europe)
- **SSL Certificate:** AWS Certificate Manager
- **Caching:** Optimized for images
- **Compression:** Enabled

### IAM
- **Backend Service Role:** EC2/ECS access to RDS, Redis, S3
- **Lambda Execution Role:** For serverless functions
- **Least Privilege:** Minimal permissions per service

## Environments

### Staging
- **Purpose:** Pre-production testing and validation
- **Cost:** ~$200-300/month
- **Uptime:** 99.5% target
- **Data:** Synthetic test data only

### Production (Future)
- **Purpose:** Live production workload
- **Cost:** ~$500-800/month (estimated)
- **Uptime:** 99.9% target
- **Data:** Real patient data (PIPEDA compliant)

## Cost Optimization

### Staging Environment
- **RDS:** db.t4g.medium (~$70/month)
- **ElastiCache:** cache.t4g.micro x2 (~$30/month)
- **NAT Gateways:** 2 x $32 (~$64/month)
- **S3:** ~$5/month (minimal usage)
- **CloudFront:** ~$10/month (minimal traffic)
- **Data Transfer:** ~$20/month
- **Total:** ~$200-250/month

### Cost Savings Tips
1. **Stop non-production resources overnight:** Use AWS Instance Scheduler
2. **Use Reserved Instances:** 30-40% savings for production
3. **Enable S3 Intelligent-Tiering:** Automatic cost optimization
4. **Monitor with AWS Cost Explorer:** Set up budget alerts

## Security

### Network Security
- **Security Groups:** Least privilege access
- **NACLs:** Additional network layer protection
- **VPC Flow Logs:** Network traffic monitoring
- **Private Subnets:** Database and cache isolated

### Data Security
- **Encryption at Rest:** All data encrypted (RDS, Redis, S3)
- **Encryption in Transit:** TLS 1.2+ required
- **Secrets Management:** AWS Secrets Manager
- **IAM Policies:** Least privilege principle

### Compliance
- **Canadian Data Residency:** All resources in ca-central-1
- **PIPEDA Compliance:** Encryption, access controls, audit logs
- **Backup & Recovery:** Automated backups, point-in-time recovery

## Monitoring & Alerts

### CloudWatch Dashboards
- **Database:** CPU, connections, IOPS, storage
- **Cache:** CPU, memory, evictions, connections
- **S3:** Request metrics, storage metrics
- **Network:** VPC flow logs, NAT gateway metrics

### Alerts
- **RDS CPU > 80%:** Warning
- **RDS Storage < 20%:** Critical
- **Redis Memory > 80%:** Warning
- **S3 4xx Errors > 5%:** Warning
- **NAT Gateway Errors:** Critical

## Disaster Recovery

### Backup Strategy
- **RDS:** Automated daily backups (7-day retention)
- **S3:** Versioning enabled, cross-region replication (future)
- **Terraform State:** Versioned in S3

### Recovery Procedures
1. **Database Restore:** Point-in-time recovery from RDS snapshots
2. **S3 Restore:** Object versioning and lifecycle policies
3. **Infrastructure Rebuild:** Terraform apply from version control

### RTO/RPO Targets
- **Staging:** RTO 4 hours, RPO 24 hours
- **Production:** RTO 1 hour, RPO 1 hour (future)

## Maintenance

### Regular Tasks
- **Weekly:** Review CloudWatch metrics and alerts
- **Monthly:** Review AWS costs and optimize
- **Quarterly:** Update Terraform modules and provider versions
- **Annually:** Review security groups and IAM policies

### Terraform Updates
```bash
# Update provider versions
terraform init -upgrade

# Plan changes
terraform plan

# Apply updates
terraform apply
```

## Troubleshooting

### Common Issues

**Issue:** Terraform state lock
```bash
# Force unlock (use with caution)
terraform force-unlock <lock-id>
```

**Issue:** RDS connection timeout
```bash
# Check security group rules
aws ec2 describe-security-groups --group-ids <sg-id>

# Test connectivity from EC2 instance
psql -h <rds-endpoint> -U berthcare -d berthcare_staging
```

**Issue:** S3 access denied
```bash
# Check bucket policy
aws s3api get-bucket-policy --bucket <bucket-name>

# Check IAM role permissions
aws iam get-role-policy --role-name <role-name> --policy-name <policy-name>
```

## Support

For infrastructure issues:
1. Check CloudWatch logs and metrics
2. Review Terraform plan output
3. Consult AWS documentation
4. Contact DevOps team

## References

- [BerthCare Architecture Blueprint](../../project-documentation/architecture-output.md)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [PIPEDA Compliance Guide](https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/)
