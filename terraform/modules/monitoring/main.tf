# BerthCare Monitoring & Observability Module
# CloudWatch dashboards, alarms, and log aggregation
# Philosophy: "Obsess over every detail" - Monitor everything that matters

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "backend_api" {
  name              = "/berthcare/${var.environment}/backend/api"
  retention_in_days = var.log_retention_days

  tags = merge(var.tags, {
    Name = "berthcare-${var.environment}-backend-api-logs"
  })
}

resource "aws_cloudwatch_log_group" "backend_errors" {
  name              = "/berthcare/${var.environment}/backend/errors"
  retention_in_days = var.error_log_retention_days

  tags = merge(var.tags, {
    Name = "berthcare-${var.environment}-backend-errors"
  })
}

resource "aws_cloudwatch_log_group" "database" {
  name              = "/berthcare/${var.environment}/database"
  retention_in_days = var.log_retention_days

  tags = merge(var.tags, {
    Name = "berthcare-${var.environment}-database-logs"
  })
}

# CloudWatch Dashboard - API Performance
resource "aws_cloudwatch_dashboard" "api_performance" {
  dashboard_name = "berthcare-${var.environment}-api-performance"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", { stat = "Average", label = "Avg Latency" }],
            ["...", { stat = "p99", label = "P99 Latency" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "API Latency (ms)"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", { stat = "Sum", label = "Total Requests" }],
            [".", "HTTPCode_Target_2XX_Count", { stat = "Sum", label = "Success (2xx)" }],
            [".", "HTTPCode_Target_4XX_Count", { stat = "Sum", label = "Client Errors (4xx)" }],
            [".", "HTTPCode_Target_5XX_Count", { stat = "Sum", label = "Server Errors (5xx)" }]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "API Request Count & Status Codes"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "TargetConnectionErrorCount", { stat = "Sum" }],
            [".", "UnHealthyHostCount", { stat = "Average" }]
          ]
          period = 300
          region = var.aws_region
          title  = "Connection Errors & Unhealthy Hosts"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["BerthCare/API", "SyncBatchSize", { stat = "Average", label = "Avg Batch Size" }],
            [".", "SyncDuration", { stat = "Average", label = "Avg Sync Duration (ms)" }]
          ]
          period = 300
          region = var.aws_region
          title  = "Sync Performance"
        }
      }
    ]
  })
}

# CloudWatch Dashboard - Database Performance
resource "aws_cloudwatch_dashboard" "database_performance" {
  dashboard_name = "berthcare-${var.environment}-database"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", { stat = "Average", label = "CPU %" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Database CPU Utilization"
          yAxis = {
            left = {
              min = 0
              max = 100
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "DatabaseConnections", { stat = "Average", label = "Active Connections" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Database Connections"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "ReadLatency", { stat = "Average", label = "Read Latency (ms)" }],
            [".", "WriteLatency", { stat = "Average", label = "Write Latency (ms)" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Database Latency"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "FreeableMemory", { stat = "Average", label = "Free Memory (bytes)" }],
            [".", "FreeStorageSpace", { stat = "Average", label = "Free Storage (bytes)" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Database Resources"
        }
      }
    ]
  })
}

# CloudWatch Dashboard - Error Tracking
resource "aws_cloudwatch_dashboard" "error_tracking" {
  dashboard_name = "berthcare-${var.environment}-errors"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "log"
        properties = {
          query  = <<-EOT
            SOURCE '${aws_cloudwatch_log_group.backend_errors.name}'
            | fields @timestamp, level, message, error, stack
            | filter level = "error"
            | sort @timestamp desc
            | limit 100
          EOT
          region = var.aws_region
          title  = "Recent Errors (Last 100)"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["BerthCare/API", "ErrorRate", { stat = "Average", label = "Error Rate %" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "API Error Rate"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      }
    ]
  })
}

# CloudWatch Alarms - API Error Rate
resource "aws_cloudwatch_metric_alarm" "api_error_rate_high" {
  alarm_name          = "berthcare-${var.environment}-api-error-rate-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ErrorRate"
  namespace           = "BerthCare/API"
  period              = 300
  statistic           = "Average"
  threshold           = 5.0
  alarm_description   = "API error rate exceeds 5%"
  treat_missing_data  = "notBreaching"

  alarm_actions = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  tags = merge(var.tags, {
    Name     = "berthcare-${var.environment}-api-error-rate"
    Severity = "high"
  })
}

# CloudWatch Alarms - Database CPU
resource "aws_cloudwatch_metric_alarm" "database_cpu_high" {
  alarm_name          = "berthcare-${var.environment}-database-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80.0
  alarm_description   = "Database CPU utilization exceeds 80%"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = var.db_instance_id
  }

  alarm_actions = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  tags = merge(var.tags, {
    Name     = "berthcare-${var.environment}-database-cpu"
    Severity = "high"
  })
}

# CloudWatch Alarms - Database Connections
resource "aws_cloudwatch_metric_alarm" "database_connections_high" {
  alarm_name          = "berthcare-${var.environment}-database-connections-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = var.db_max_connections * 0.8
  alarm_description   = "Database connections exceed 80% of max"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = var.db_instance_id
  }

  alarm_actions = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  tags = merge(var.tags, {
    Name     = "berthcare-${var.environment}-database-connections"
    Severity = "medium"
  })
}

# CloudWatch Alarms - API Latency
resource "aws_cloudwatch_metric_alarm" "api_latency_high" {
  alarm_name          = "berthcare-${var.environment}-api-latency-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Average"
  threshold           = 1.0
  alarm_description   = "API latency exceeds 1 second"
  treat_missing_data  = "notBreaching"

  alarm_actions = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  tags = merge(var.tags, {
    Name     = "berthcare-${var.environment}-api-latency"
    Severity = "medium"
  })
}

# CloudWatch Alarms - Unhealthy Hosts
resource "aws_cloudwatch_metric_alarm" "unhealthy_hosts" {
  alarm_name          = "berthcare-${var.environment}-unhealthy-hosts"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Average"
  threshold           = 0
  alarm_description   = "One or more backend hosts are unhealthy"
  treat_missing_data  = "notBreaching"

  alarm_actions = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  tags = merge(var.tags, {
    Name     = "berthcare-${var.environment}-unhealthy-hosts"
    Severity = "critical"
  })
}

# SNS Topic for Alarms (optional - can be created separately)
resource "aws_sns_topic" "alarms" {
  count = var.create_sns_topic ? 1 : 0

  name              = "berthcare-${var.environment}-alarms"
  display_name      = "BerthCare ${var.environment} Alarms"
  kms_master_key_id = "alias/aws/sns"

  tags = merge(var.tags, {
    Name = "berthcare-${var.environment}-alarms"
  })
}

resource "aws_sns_topic_subscription" "alarm_email" {
  count = var.create_sns_topic && var.alarm_email != "" ? 1 : 0

  topic_arn = aws_sns_topic.alarms[0].arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

# CloudWatch Log Metric Filter - Error Rate
resource "aws_cloudwatch_log_metric_filter" "error_rate" {
  name           = "berthcare-${var.environment}-error-rate"
  log_group_name = aws_cloudwatch_log_group.backend_errors.name
  pattern        = "[time, request_id, level = ERROR*, ...]"

  metric_transformation {
    name      = "ErrorRate"
    namespace = "BerthCare/API"
    value     = "1"
    unit      = "Count"
  }
}

# CloudWatch Log Metric Filter - Sync Operations
resource "aws_cloudwatch_log_metric_filter" "sync_operations" {
  name           = "berthcare-${var.environment}-sync-operations"
  log_group_name = aws_cloudwatch_log_group.backend_api.name
  pattern        = "[time, request_id, level, msg = \"*sync*\", batch_size, duration, ...]"

  metric_transformation {
    name      = "SyncOperations"
    namespace = "BerthCare/API"
    value     = "1"
    unit      = "Count"
  }
}
