# CDN Module Variables

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "photos_bucket_id" {
  description = "Photos S3 bucket ID"
  type        = string
}

variable "photos_bucket_arn" {
  description = "Photos S3 bucket ARN"
  type        = string
}

variable "photos_bucket_domain" {
  description = "Photos S3 bucket domain name"
  type        = string
}

variable "price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_100"
}

variable "enable_compression" {
  description = "Enable CloudFront compression"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
