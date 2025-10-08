# IAM Module Variables

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "photos_bucket_arn" {
  description = "Photos S3 bucket ARN"
  type        = string
}

variable "documents_bucket_arn" {
  description = "Documents S3 bucket ARN"
  type        = string
}

variable "rds_resource_id" {
  description = "RDS instance resource ID"
  type        = string
}

variable "redis_arn" {
  description = "ElastiCache Redis ARN"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
