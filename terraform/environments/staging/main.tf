# BerthCare Staging Environment
# AWS Infrastructure in ca-central-1 (Canada Central)
# Philosophy: "Simplicity is the ultimate sophistication"

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "berthcare-terraform-state-ca-central-1"
    key            = "staging/terraform.tfstate"
    region         = "ca-central-1"
    encrypt        = true
    dynamodb_table = "berthcare-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "BerthCare"
      Environment = "staging"
      ManagedBy   = "Terraform"
      Region      = "ca-central-1"
      Compliance  = "PIPEDA"
    }
  }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

# Networking Module
module "networking" {
  source = "../../modules/networking"

  environment           = var.environment
  vpc_cidr              = var.vpc_cidr
  availability_zones    = slice(data.aws_availability_zones.available.names, 0, 2)
  public_subnet_cidrs   = var.public_subnet_cidrs
  private_subnet_cidrs  = var.private_subnet_cidrs
  database_subnet_cidrs = var.database_subnet_cidrs

  tags = var.tags
}

# Database Module (RDS PostgreSQL)
module "database" {
  source = "../../modules/database"

  environment                = var.environment
  vpc_id                     = module.networking.vpc_id
  database_subnet_ids        = module.networking.database_subnet_ids
  database_subnet_group_name = module.networking.database_subnet_group_name
  allowed_security_group_ids = [module.networking.backend_security_group_id]

  instance_class          = var.db_instance_class
  allocated_storage       = var.db_allocated_storage
  max_allocated_storage   = var.db_max_allocated_storage
  engine_version          = var.db_engine_version
  database_name           = var.db_name
  master_username         = var.db_master_username
  multi_az                = var.db_multi_az
  backup_retention_period = var.db_backup_retention_period
  deletion_protection     = var.db_deletion_protection

  tags = var.tags
}

# Cache Module (ElastiCache Redis)
module "cache" {
  source = "../../modules/cache"

  environment                = var.environment
  vpc_id                     = module.networking.vpc_id
  private_subnet_ids         = module.networking.private_subnet_ids
  allowed_security_group_ids = [module.networking.backend_security_group_id]

  node_type              = var.redis_node_type
  num_cache_nodes        = var.redis_num_cache_nodes
  engine_version         = var.redis_engine_version
  parameter_group_family = var.redis_parameter_group_family
  automatic_failover     = var.redis_automatic_failover

  tags = var.tags
}

# Storage Module (S3 Buckets)
module "storage" {
  source = "../../modules/storage"

  environment = var.environment
  aws_region  = var.aws_region

  photos_bucket_name    = var.photos_bucket_name
  documents_bucket_name = var.documents_bucket_name

  enable_versioning      = var.s3_enable_versioning
  lifecycle_glacier_days = var.s3_lifecycle_glacier_days

  tags = var.tags
}

# CDN Module (CloudFront)
module "cdn" {
  source = "../../modules/cdn"

  environment          = var.environment
  photos_bucket_id     = module.storage.photos_bucket_id
  photos_bucket_arn    = module.storage.photos_bucket_arn
  photos_bucket_domain = module.storage.photos_bucket_domain_name

  price_class        = var.cloudfront_price_class
  enable_compression = var.cloudfront_enable_compression

  tags = var.tags
}

# IAM Module (Roles and Policies)
module "iam" {
  source = "../../modules/iam"

  environment          = var.environment
  photos_bucket_arn    = module.storage.photos_bucket_arn
  documents_bucket_arn = module.storage.documents_bucket_arn
  rds_resource_id      = module.database.db_instance_resource_id
  redis_arn            = module.cache.redis_cluster_arn

  tags = var.tags
}

# Monitoring Module (CloudWatch Dashboards & Alarms)
module "monitoring" {
  source = "../../modules/monitoring"

  environment              = var.environment
  aws_region               = var.aws_region
  log_retention_days       = var.log_retention_days
  error_log_retention_days = var.error_log_retention_days
  db_instance_id           = module.database.db_instance_id
  db_max_connections       = var.db_max_connections
  create_sns_topic         = var.create_alarm_sns_topic
  alarm_email              = var.alarm_email

  tags = var.tags
}

# Secrets Module (Twilio Credentials)
module "secrets" {
  source = "../../modules/secrets"

  environment          = var.environment
  project_name         = "berthcare"
  aws_region           = var.aws_region
  recovery_window_days = var.secrets_recovery_window_days

  # Twilio credentials (provided via terraform.tfvars or environment variables)
  twilio_account_sid  = var.twilio_account_sid
  twilio_auth_token   = var.twilio_auth_token
  twilio_voice_number = var.twilio_voice_number
  twilio_sms_number   = var.twilio_sms_number

  # Webhook configuration (update after backend deployment)
  voice_webhook_url         = var.voice_webhook_url
  voice_status_callback_url = var.voice_status_callback_url
  sms_webhook_url           = var.sms_webhook_url
  sms_status_callback_url   = var.sms_status_callback_url
  webhook_auth_token        = var.webhook_auth_token

  # Monitoring
  alarm_sns_topic_arn = module.monitoring.sns_topic_arn

  tags = var.tags
}
