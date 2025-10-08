# Monitoring Module Variables

variable "environment" {
  description = "Environment name (staging, production)"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ca-central-1"
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "error_log_retention_days" {
  description = "Error log retention in days (longer for compliance)"
  type        = number
  default     = 90
}

variable "db_instance_id" {
  description = "RDS database instance identifier for alarms"
  type        = string
}

variable "db_max_connections" {
  description = "Maximum database connections for alarm threshold"
  type        = number
  default     = 100
}

variable "alarm_sns_topic_arn" {
  description = "SNS topic ARN for alarm notifications (optional)"
  type        = string
  default     = ""
}

variable "create_sns_topic" {
  description = "Whether to create SNS topic for alarms"
  type        = bool
  default     = true
}

variable "alarm_email" {
  description = "Email address for alarm notifications"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
