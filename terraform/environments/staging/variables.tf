# BerthCare Staging Environment Variables

variable "aws_region" {
  description = "AWS region for Canadian data residency"
  type        = string
  default     = "ca-central-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "staging"
}

# Networking Variables
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24"]
}

variable "database_subnet_cidrs" {
  description = "CIDR blocks for database subnets"
  type        = list(string)
  default     = ["10.0.21.0/24", "10.0.22.0/24"]
}

# Database Variables
variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t4g.medium"
}

variable "db_allocated_storage" {
  description = "Initial allocated storage in GB"
  type        = number
  default     = 100
}

variable "db_max_allocated_storage" {
  description = "Maximum allocated storage for autoscaling in GB"
  type        = number
  default     = 500
}

variable "db_engine_version" {
  description = "PostgreSQL engine version"
  type        = string
  default     = "15.5"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "berthcare_staging"
}

variable "db_master_username" {
  description = "Database master username"
  type        = string
  default     = "berthcare_admin"
}

variable "db_multi_az" {
  description = "Enable Multi-AZ deployment"
  type        = bool
  default     = true
}

variable "db_backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
  default     = 7
}

variable "db_deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = true
}

# Redis Variables
variable "redis_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t4g.micro"
}

variable "redis_num_cache_nodes" {
  description = "Number of cache nodes"
  type        = number
  default     = 2
}

variable "redis_engine_version" {
  description = "Redis engine version"
  type        = string
  default     = "7.1"
}

variable "redis_parameter_group_family" {
  description = "Redis parameter group family"
  type        = string
  default     = "redis7"
}

variable "redis_automatic_failover" {
  description = "Enable automatic failover"
  type        = bool
  default     = true
}

# S3 Variables
variable "photos_bucket_name" {
  description = "S3 bucket name for photos"
  type        = string
  default     = "berthcare-photos-staging-ca-central-1"
}

variable "documents_bucket_name" {
  description = "S3 bucket name for documents"
  type        = string
  default     = "berthcare-documents-staging-ca-central-1"
}

variable "s3_enable_versioning" {
  description = "Enable S3 versioning"
  type        = bool
  default     = true
}

variable "s3_lifecycle_glacier_days" {
  description = "Days before transitioning to Glacier"
  type        = number
  default     = 365
}

# CloudFront Variables
variable "cloudfront_price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_100"
}

variable "cloudfront_enable_compression" {
  description = "Enable CloudFront compression"
  type        = bool
  default     = true
}

# Tags
variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default = {
    Project     = "BerthCare"
    Environment = "staging"
    ManagedBy   = "Terraform"
    Compliance  = "PIPEDA"
  }
}

# Monitoring Variables
variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "error_log_retention_days" {
  description = "Error log retention in days"
  type        = number
  default     = 90
}

variable "db_max_connections" {
  description = "Maximum database connections for alarm threshold"
  type        = number
  default     = 100
}

variable "create_alarm_sns_topic" {
  description = "Whether to create SNS topic for alarms"
  type        = bool
  default     = true
}

variable "alarm_email" {
  description = "Email address for alarm notifications"
  type        = string
  default     = ""
}

# =============================================================================
# Twilio Configuration Variables
# =============================================================================

variable "twilio_account_sid" {
  description = "Twilio Account SID (starts with AC)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "twilio_auth_token" {
  description = "Twilio Auth Token"
  type        = string
  sensitive   = true
  default     = ""
}

variable "twilio_voice_number" {
  description = "Twilio phone number for voice calls (E.164 format: +1XXXXXXXXXX)"
  type        = string
  default     = ""
}

variable "twilio_sms_number" {
  description = "Twilio phone number for SMS (E.164 format: +1XXXXXXXXXX)"
  type        = string
  default     = ""
}

# Webhook Configuration
variable "voice_webhook_url" {
  description = "Webhook URL for Twilio voice calls"
  type        = string
  default     = "https://api-staging.berthcare.ca/v1/voice/webhook"
}

variable "voice_status_callback_url" {
  description = "Status callback URL for voice call events"
  type        = string
  default     = "https://api-staging.berthcare.ca/v1/voice/status"
}

variable "sms_webhook_url" {
  description = "Webhook URL for Twilio SMS"
  type        = string
  default     = "https://api-staging.berthcare.ca/v1/sms/webhook"
}

variable "sms_status_callback_url" {
  description = "Status callback URL for SMS delivery events"
  type        = string
  default     = "https://api-staging.berthcare.ca/v1/sms/status"
}

variable "webhook_auth_token" {
  description = "Authentication token for webhook validation"
  type        = string
  sensitive   = true
  default     = ""
}

# Secrets Management
variable "secrets_recovery_window_days" {
  description = "Number of days to retain deleted secrets before permanent deletion"
  type        = number
  default     = 7
}
