variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name (staging, production)"
  type        = string
}

variable "photos_bucket_domain_name" {
  description = "Photos S3 bucket domain name"
  type        = string
}

variable "documents_bucket_domain_name" {
  description = "Documents S3 bucket domain name"
  type        = string
}

variable "signatures_bucket_domain_name" {
  description = "Signatures S3 bucket domain name"
  type        = string
} 

variable "logs_bucket_domain_name" {
  description = "Logs S3 bucket domain name"
  type        = string
}

variable "price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_100" # North America and Europe
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN for custom domain (optional)"
  type        = string
  default     = null
}

variable "alarm_actions" {
  description = "List of ARNs to notify when alarms trigger"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}
