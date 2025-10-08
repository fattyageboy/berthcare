# Storage Module Outputs

output "photos_bucket_id" {
  description = "Photos S3 bucket ID"
  value       = aws_s3_bucket.photos.id
}

output "photos_bucket_arn" {
  description = "Photos S3 bucket ARN"
  value       = aws_s3_bucket.photos.arn
}

output "photos_bucket_name" {
  description = "Photos S3 bucket name"
  value       = aws_s3_bucket.photos.bucket
}

output "photos_bucket_domain_name" {
  description = "Photos S3 bucket domain name"
  value       = aws_s3_bucket.photos.bucket_regional_domain_name
}

output "documents_bucket_id" {
  description = "Documents S3 bucket ID"
  value       = aws_s3_bucket.documents.id
}

output "documents_bucket_arn" {
  description = "Documents S3 bucket ARN"
  value       = aws_s3_bucket.documents.arn
}

output "documents_bucket_name" {
  description = "Documents S3 bucket name"
  value       = aws_s3_bucket.documents.bucket
}

output "documents_bucket_domain_name" {
  description = "Documents S3 bucket domain name"
  value       = aws_s3_bucket.documents.bucket_regional_domain_name
}
