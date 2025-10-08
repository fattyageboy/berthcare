# BerthCare Staging Environment Outputs

# Networking Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = module.networking.vpc_id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.networking.public_subnet_ids
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.networking.private_subnet_ids
}

output "database_subnet_ids" {
  description = "Database subnet IDs"
  value       = module.networking.database_subnet_ids
}

output "backend_security_group_id" {
  description = "Backend security group ID"
  value       = module.networking.backend_security_group_id
}

# Database Outputs
output "db_instance_endpoint" {
  description = "RDS instance endpoint"
  value       = module.database.db_instance_endpoint
  sensitive   = true
}

output "db_instance_address" {
  description = "RDS instance address"
  value       = module.database.db_instance_address
  sensitive   = true
}

output "db_instance_port" {
  description = "RDS instance port"
  value       = module.database.db_instance_port
}

output "db_instance_name" {
  description = "Database name"
  value       = module.database.db_instance_name
}

output "db_master_username" {
  description = "Database master username"
  value       = module.database.db_master_username
  sensitive   = true
}

# Cache Outputs
output "redis_endpoint" {
  description = "Redis primary endpoint"
  value       = module.cache.redis_primary_endpoint
  sensitive   = true
}

output "redis_port" {
  description = "Redis port"
  value       = module.cache.redis_port
}

output "redis_reader_endpoint" {
  description = "Redis reader endpoint"
  value       = module.cache.redis_reader_endpoint
  sensitive   = true
}

# Storage Outputs
output "photos_bucket_name" {
  description = "Photos S3 bucket name"
  value       = module.storage.photos_bucket_name
}

output "photos_bucket_arn" {
  description = "Photos S3 bucket ARN"
  value       = module.storage.photos_bucket_arn
}

output "documents_bucket_name" {
  description = "Documents S3 bucket name"
  value       = module.storage.documents_bucket_name
}

output "documents_bucket_arn" {
  description = "Documents S3 bucket ARN"
  value       = module.storage.documents_bucket_arn
}

# CDN Outputs
output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = module.cdn.distribution_id
}

output "cloudfront_domain_name" {
  description = "CloudFront domain name"
  value       = module.cdn.distribution_domain_name
}

# IAM Outputs
output "backend_service_role_arn" {
  description = "Backend service IAM role ARN"
  value       = module.iam.backend_service_role_arn
}

output "backend_service_role_name" {
  description = "Backend service IAM role name"
  value       = module.iam.backend_service_role_name
}

# Connection Strings (for backend configuration)
output "database_connection_string" {
  description = "Database connection string (without password)"
  value       = "postgresql://${module.database.db_master_username}@${module.database.db_instance_address}:${module.database.db_instance_port}/${module.database.db_instance_name}"
  sensitive   = true
}

output "redis_connection_string" {
  description = "Redis connection string"
  value       = "redis://${module.cache.redis_primary_endpoint}"
  sensitive   = true
}

# Summary Output
output "infrastructure_summary" {
  description = "Summary of deployed infrastructure"
  value = {
    environment = var.environment
    region      = var.aws_region
    vpc_id      = module.networking.vpc_id
    database = {
      endpoint = module.database.db_instance_endpoint
      name     = module.database.db_instance_name
    }
    cache = {
      endpoint = module.cache.redis_primary_endpoint
    }
    storage = {
      photos_bucket    = module.storage.photos_bucket_name
      documents_bucket = module.storage.documents_bucket_name
    }
    cdn = {
      domain = module.cdn.distribution_domain_name
    }
  }
  sensitive = true
}

# Monitoring Outputs
output "api_log_group_name" {
  description = "CloudWatch log group name for API logs"
  value       = module.monitoring.api_log_group_name
}

output "error_log_group_name" {
  description = "CloudWatch log group name for error logs"
  value       = module.monitoring.error_log_group_name
}

output "api_performance_dashboard_arn" {
  description = "CloudWatch dashboard ARN for API performance"
  value       = module.monitoring.api_performance_dashboard_arn
}

output "database_performance_dashboard_arn" {
  description = "CloudWatch dashboard ARN for database performance"
  value       = module.monitoring.database_performance_dashboard_arn
}

output "error_tracking_dashboard_arn" {
  description = "CloudWatch dashboard ARN for error tracking"
  value       = module.monitoring.error_tracking_dashboard_arn
}

output "alarm_sns_topic_arn" {
  description = "SNS topic ARN for alarms"
  value       = module.monitoring.sns_topic_arn
}

# =============================================================================
# Secrets Outputs (Twilio Configuration)
# =============================================================================

output "twilio_account_secret_arn" {
  description = "ARN of the Twilio account credentials secret"
  value       = module.secrets.twilio_account_secret_arn
}

output "twilio_account_secret_name" {
  description = "Name of the Twilio account credentials secret"
  value       = module.secrets.twilio_account_secret_name
}

output "twilio_phone_numbers_secret_arn" {
  description = "ARN of the Twilio phone numbers secret"
  value       = module.secrets.twilio_phone_numbers_secret_arn
}

output "twilio_webhooks_secret_arn" {
  description = "ARN of the Twilio webhooks configuration secret"
  value       = module.secrets.twilio_webhooks_secret_arn
}

output "secrets_access_policy_arn" {
  description = "ARN of the IAM policy for accessing Twilio secrets"
  value       = module.secrets.secrets_access_policy_arn
}
