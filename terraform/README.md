# BerthCare AWS Infrastructure

**Region:** ca-central-1 (Canadian data residency - PIPEDA compliant)  
**Environment:** Staging  
**IaC Tool:** Terraform 1.6+

## Overview

This Terraform configuration provisions the complete AWS infrastructure for BerthCare staging environment, including:

- **Networking:** VPC with public/private subnets across 2 AZs
- **Database:** RDS PostgreSQL 15 (Multi-AZ for high availability)
- **Cache:** ElastiCache Redis cluster
- **Storage:** S3 buckets for photos, documents, signatures
- **CDN:** CloudFront distribution for fast asset delivery
- **Security:** IAM roles with least privilege, security groups, encryption

## Prerequisites

- AWS CLI configured with appropriate credentials
- Terraform 1.6+ installed
- Access to AWS account with admin permissions

## Quick Start

```bash
# Initialize Terraform
cd terraform/environments/staging
terraform init

# Review planned changes
terraform plan

# Apply infrastructure
terraform apply

# View outputs
terraform output
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CloudFront (CDN)                          │
│                  Global Edge Locations                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  VPC (ca-central-1)                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Public Subnets (2 AZs)                              │   │
│  │  - NAT Gateways                                      │   │
│  │  - Application Load Balancer                         │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Private Subnets (2 AZs)                             │   │
│  │  - ECS Fargate Tasks (Backend API)                   │   │
│  │  - RDS PostgreSQL 15 (Multi-AZ)                      │   │
│  │  - ElastiCache Redis Cluster                         │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    S3 Buckets                                │
│  - berthcare-photos-staging                                  │
│  - berthcare-documents-staging                               │
│  - berthcare-signatures-staging                              │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
terraform/
├── README.md                    # This file
├── modules/                     # Reusable Terraform modules
│   ├── networking/              # VPC, subnets, NAT gateways
│   ├── database/                # RDS PostgreSQL
│   ├── cache/                   # ElastiCache Redis
│   ├── storage/                 # S3 buckets
│   ├── cdn/                     # CloudFront distribution
│   └── security/                # IAM roles, security groups
└── environments/
    ├── staging/                 # Staging environment
    │   ├── main.tf
    │   ├── variables.tf
    │   ├── outputs.tf
    │   └── terraform.tfvars
    └── production/              # Production environment (future)
```

## Security Features

- **Encryption at Rest:** All RDS and S3 data encrypted with AWS KMS
- **Encryption in Transit:** TLS 1.2+ enforced on all connections
- **Network Isolation:** Private subnets for databases and application servers
- **Least Privilege IAM:** Minimal permissions for each service
- **Security Groups:** Restrictive ingress/egress rules
- **Secrets Management:** Database credentials stored in AWS Secrets Manager
- **Audit Logging:** CloudTrail enabled for all API calls

## Cost Optimization

- **Right-Sized Instances:** db.t4g.medium for staging (ARM-based, cost-effective)
- **Reserved Capacity:** Consider 1-year reserved instances for production
- **S3 Lifecycle Policies:** Archive old photos to Glacier after 1 year
- **CloudFront Caching:** Reduce origin requests and data transfer costs
- **Auto-Scaling:** Scale down during off-hours

## Disaster Recovery

- **RDS Automated Backups:** 7-day retention, daily snapshots
- **Multi-AZ Deployment:** Automatic failover in case of AZ failure
- **S3 Versioning:** Enabled on all buckets for accidental deletion recovery
- **Point-in-Time Recovery:** RDS supports PITR within backup retention period

## Monitoring & Alerts

- **CloudWatch Dashboards:** Pre-configured for key metrics
- **CloudWatch Alarms:** CPU, memory, disk, connection count
- **RDS Performance Insights:** Enabled for database performance monitoring
- **VPC Flow Logs:** Network traffic analysis and security monitoring

## Compliance

- **Canadian Data Residency:** All resources in ca-central-1 region
- **PIPEDA Compliance:** Encryption, access controls, audit trails
- **Data Retention:** Configurable lifecycle policies
- **Access Logging:** S3 and CloudFront access logs enabled

## Maintenance

- **RDS Maintenance Window:** Sunday 03:00-04:00 EST
- **ElastiCache Maintenance Window:** Sunday 04:00-05:00 EST
- **Terraform State:** Stored in S3 with DynamoDB state locking
- **Version Control:** All infrastructure changes tracked in Git

## Troubleshooting

### Common Issues

**Issue:** Terraform state lock error  
**Solution:** Check DynamoDB table for stale locks, manually remove if needed

**Issue:** RDS connection timeout  
**Solution:** Verify security group rules allow traffic from application subnets

**Issue:** S3 bucket access denied  
**Solution:** Check IAM role permissions and bucket policies

## Support

For infrastructure issues, contact DevOps team or create an issue in the repository.
