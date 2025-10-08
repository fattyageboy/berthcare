# IAM Module Outputs

output "backend_service_role_arn" {
  description = "Backend service IAM role ARN"
  value       = aws_iam_role.backend_service.arn
}

output "backend_service_role_name" {
  description = "Backend service IAM role name"
  value       = aws_iam_role.backend_service.name
}

output "backend_instance_profile_arn" {
  description = "Backend instance profile ARN"
  value       = aws_iam_instance_profile.backend_service.arn
}

output "backend_instance_profile_name" {
  description = "Backend instance profile name"
  value       = aws_iam_instance_profile.backend_service.name
}

output "lambda_execution_role_arn" {
  description = "Lambda execution IAM role ARN"
  value       = aws_iam_role.lambda_execution.arn
}

output "lambda_execution_role_name" {
  description = "Lambda execution IAM role name"
  value       = aws_iam_role.lambda_execution.name
}
