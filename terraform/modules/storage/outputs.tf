output "photos_bucket_id" {
  description = "Photos bucket ID"
  value       = aws_s3_bucket.photos.id
}

output "photos_bucket_arn" {
  description = "Photos bucket ARN"
  value       = aws_s3_bucket.photos.arn
}

output "photos_bucket_domain_name" {
  description = "Photos bucket domain name"
  value       = aws_s3_bucket.photos.bucket_domain_name
}

output "documents_bucket_id" {
  description = "Documents bucket ID"
  value       = aws_s3_bucket.documents.id
}

output "documents_bucket_arn" {
  description = "Documents bucket ARN"
  value       = aws_s3_bucket.documents.arn
}

output "documents_bucket_domain_name" {
  description = "Documents bucket domain name"
  value       = aws_s3_bucket.documents.bucket_domain_name
}

output "signatures_bucket_id" {
  description = "Signatures bucket ID"
  value       = aws_s3_bucket.signatures.id
}

output "signatures_bucket_arn" {
  description = "Signatures bucket ARN"
  value       = aws_s3_bucket.signatures.arn
}

output "signatures_bucket_domain_name" {
  description = "Signatures bucket domain name"
  value       = aws_s3_bucket.signatures.bucket_domain_name
}

output "logs_bucket_id" {
  description = "Logs bucket ID"
  value       = aws_s3_bucket.logs.id
}

output "logs_bucket_arn" {
  description = "Logs bucket ARN"
  value       = aws_s3_bucket.logs.arn
}
