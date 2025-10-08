# Monitoring Module Outputs

output "api_log_group_name" {
  description = "CloudWatch log group name for API logs"
  value       = aws_cloudwatch_log_group.backend_api.name
}

output "api_log_group_arn" {
  description = "CloudWatch log group ARN for API logs"
  value       = aws_cloudwatch_log_group.backend_api.arn
}

output "error_log_group_name" {
  description = "CloudWatch log group name for error logs"
  value       = aws_cloudwatch_log_group.backend_errors.name
}

output "error_log_group_arn" {
  description = "CloudWatch log group ARN for error logs"
  value       = aws_cloudwatch_log_group.backend_errors.arn
}

output "database_log_group_name" {
  description = "CloudWatch log group name for database logs"
  value       = aws_cloudwatch_log_group.database.name
}

output "api_performance_dashboard_arn" {
  description = "CloudWatch dashboard ARN for API performance"
  value       = aws_cloudwatch_dashboard.api_performance.dashboard_arn
}

output "database_performance_dashboard_arn" {
  description = "CloudWatch dashboard ARN for database performance"
  value       = aws_cloudwatch_dashboard.database_performance.dashboard_arn
}

output "error_tracking_dashboard_arn" {
  description = "CloudWatch dashboard ARN for error tracking"
  value       = aws_cloudwatch_dashboard.error_tracking.dashboard_arn
}

output "sns_topic_arn" {
  description = "SNS topic ARN for alarms"
  value       = var.create_sns_topic ? aws_sns_topic.alarms[0].arn : var.alarm_sns_topic_arn
}

output "alarm_arns" {
  description = "Map of alarm names to ARNs"
  value = {
    api_error_rate       = aws_cloudwatch_metric_alarm.api_error_rate_high.arn
    database_cpu         = aws_cloudwatch_metric_alarm.database_cpu_high.arn
    database_connections = aws_cloudwatch_metric_alarm.database_connections_high.arn
    api_latency          = aws_cloudwatch_metric_alarm.api_latency_high.arn
    unhealthy_hosts      = aws_cloudwatch_metric_alarm.unhealthy_hosts.arn
  }
}
